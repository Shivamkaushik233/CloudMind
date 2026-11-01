// k6 run -e BASE_URL=http://localhost:8000 -e TOKEN=... -e ENVIRONMENT_ID=... tests/load/operations.js
import http from "k6/http";
import {check,sleep} from "k6";
export const options={vus:5,duration:"30s",thresholds:{http_req_failed:["rate<0.01"],http_req_duration:["p(95)<1500"]}};
export default function(){
  const response=http.get(`${__ENV.BASE_URL}/operations/${__ENV.ENVIRONMENT_ID}/metrics?hours=1`,{headers:{Authorization:`Bearer ${__ENV.TOKEN}`}});
  check(response,{"metrics available":r=>r.status===200});sleep(1);
}
