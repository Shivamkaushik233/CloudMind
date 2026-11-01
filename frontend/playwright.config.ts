import {defineConfig} from "@playwright/test";
import {mkdirSync} from "node:fs";
import {resolve} from "node:path";
const data=resolve(".e2e",String(Date.now()));mkdirSync(data,{recursive:true});
const python=process.env.CLOUDMIND_PYTHON||"python";
export default defineConfig({
  testDir:"./e2e",workers:1,timeout:120000,
  use:{baseURL:"http://127.0.0.1:13000",trace:"retain-on-failure",channel:process.env.PLAYWRIGHT_CHANNEL||undefined},
  webServer:[
    {command:`"${python}" -m uvicorn app.main:app --app-dir ../backend/core-api --host 127.0.0.1 --port 18080`,url:"http://127.0.0.1:18080/health",timeout:120000,reuseExistingServer:false,
      env:{DATABASE_URL:`sqlite:///${resolve(data,"test.db").replaceAll("\\","/")}`,JWT_SECRET_KEY:"isolated-e2e-secret-never-use-for-production",DEMO_ENABLED:"true",ENVIRONMENT:"development",CORS_ORIGINS:"http://127.0.0.1:13000",MODEL_STORE:resolve(data,"models"),AUTH_RATE_LIMIT:"1000",REDIS_URL:""}},
    {command:"npm run dev -- --hostname 127.0.0.1 --port 13000",url:"http://127.0.0.1:13000",timeout:120000,reuseExistingServer:false,env:{NEXT_PUBLIC_API_URL:"http://127.0.0.1:18080",NEXT_TELEMETRY_DISABLED:"1"}}
  ]
});
