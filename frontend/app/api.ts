export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
let refreshing: Promise<string> | null = null;

export async function request(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const send = () => fetch(`${API_URL}${endpoint}`, { ...options, headers: { ...options.headers, Authorization: `Bearer ${localStorage.getItem("cloudmind_token") || ""}` } });
  let response = await send();
  if (response.status === 401 && localStorage.getItem("cloudmind_refresh")) {
    if (!refreshing) refreshing = (async () => {
      const r = await fetch(`${API_URL}/auth/refresh`, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({refresh_token:localStorage.getItem("cloudmind_refresh")})});
      if (!r.ok) {
        localStorage.removeItem("cloudmind_token"); localStorage.removeItem("cloudmind_refresh");
        window.dispatchEvent(new Event("cloudmind-session-expired"));
        throw new Error("Session expired. Please sign in again.");
      }
      const data = await r.json();
      localStorage.setItem("cloudmind_token", data.access_token); localStorage.setItem("cloudmind_refresh", data.refresh_token);
      return data.access_token as string;
    })().finally(() => { refreshing = null; });
    await refreshing; response = await send();
  }
  return response;
}

export async function api(endpoint: string, options: RequestInit = {}) {
  const response = await request(endpoint, options);
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(typeof data.detail === "string" ? data.detail : data.detail ? JSON.stringify(data.detail) : `Request failed (${response.status})`);
  }
  return response.status === 204 ? null : response.json();
}

export const jsonBody = (body: unknown, method="POST") => ({method, headers:{"Content-Type":"application/json"}, body:JSON.stringify(body)});
