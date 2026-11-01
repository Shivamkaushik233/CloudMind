"""Bounded local development limiter; Redis-backed atomic production limiter."""
import hashlib
import time
import threading
from collections import OrderedDict
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from app.config import settings

WINDOW_SCRIPT="""
local value = redis.call('INCR', KEYS[1])
if value == 1 then redis.call('EXPIRE', KEYS[1], 61) end
return value
"""


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self,app):
        super().__init__(app); self.windows=OrderedDict(); self.lock=threading.Lock(); self.redis=None
        if settings.redis_url:
            import redis
            self.redis=redis.Redis.from_url(settings.redis_url,socket_connect_timeout=2,socket_timeout=2)
    async def dispatch(self,request,call_next):
        if request.url.path.startswith('/auth/') and request.method=='POST':
            peer=request.client.host if request.client else 'unknown'
            key='cloudmind:auth:'+hashlib.sha256(peer.encode()).hexdigest()+':'+str(int(time.time()//60))
            if self.redis:
                try:
                    from starlette.concurrency import run_in_threadpool
                    count=await run_in_threadpool(self.redis.eval,WINDOW_SCRIPT,1,key)
                except Exception:
                    return JSONResponse({'detail':'Authentication protection temporarily unavailable'},503)
            else:
                with self.lock:
                    self.windows[key]=self.windows.get(key,0)+1;count=self.windows[key]
                    while len(self.windows)>10000:self.windows.popitem(last=False)
            if count>settings.auth_rate_limit:
                return JSONResponse({'detail':'Too many authentication attempts; retry next minute'},429,headers={'Retry-After':'60'})
        response=await call_next(request)
        response.headers['X-Content-Type-Options']='nosniff'
        response.headers['Referrer-Policy']='strict-origin-when-cross-origin'
        if request.url.path.startswith('/auth/'):
            response.headers['Cache-Control']='no-store'
        return response
