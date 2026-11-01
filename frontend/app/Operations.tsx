"use client";

import {useEffect, useRef, useState} from "react";

import {api, jsonBody, request} from "./api";



type Env = {id:string; name:string; application:string; project:string; simulated:boolean};

type Point = {timestamp:string; rps:number; cpu:number; memory:number; latency_ms:number; error_rate:number; replicas:number; cost_per_hour:number; source:string};

type Prediction = {model:string; points:{timestamp:string; rps:number; lower:number; upper:number}[]; evaluation:{mae:number; rmse:number; mape:number; persistence_mae:number}; interval_note:string; evaluation_note:string};

type Policy = {forecast_model:string; strategy:string; max_spot_fraction:number; spot_cost_per_replica_hour:number; min_replicas:number; max_replicas:number; max_step:number; capacity_per_replica:number; target_utilization:number; cooldown_seconds:number; latency_slo_ms:number; cost_per_replica_hour:number; mode:string};

type Decision = {id:string; current_replicas:number; recommended_replicas:number; action:string; reason:string; estimated_hourly_cost:number; capacity_shortfall:boolean};

type Finding = {metric:string; value:number; threshold:number; severity:string; classification:string};

type Investigation = {id:string; engine:string; hypothesis:string; confidence:string; recommendations:string[]; limitations:string[]; analysis?:string};

type AuditEvent = {id:string; kind:string; created_at:string; data:Record<string, unknown>};



function Chart({values, label, color="#4361ee", suffix=""}:{values:number[]; label:string; color?:string; suffix?:string}) {

  const max = Math.max(1,...values)*1.1;

  const pts = values.map((v,i)=>`${40+i*650/Math.max(1,values.length-1)},${175-v/max*140}`).join(" ");

  return <div className="ops-chart"><h3>{label}</h3><svg role="img" aria-label={`${label}: ${values.length} samples, latest ${values.at(-1)?.toFixed(1) || 0}${suffix}`} viewBox="0 0 710 210">

    {[0,.5,1].map(v=><g key={v}><line x1="40" x2="690" y1={175-v*140} y2={175-v*140} stroke="#e5eaf3"/><text x="0" y={179-v*140} fill="#7c879d" fontSize="10">{(max*v).toFixed(0)}</text></g>)}

    {values.length>0 && <><polygon points={`40,175 ${pts} 690,175`} fill={color} opacity=".07"/><polyline points={pts} stroke={color} fill="none" strokeWidth="2.5" strokeLinejoin="round"/></>}

    <text x="40" y="200" fill="#7c879d" fontSize="11">Oldest sample</text><text x="650" y="200" fill="#7c879d" fontSize="11">Latest</text>

  </svg></div>;

}



export default function Operations({readOnly=false}:{readOnly?:boolean}) {

  const [envs,setEnvs]=useState<Env[]>([]), [selected,setSelected]=useState("");

  const [series,setSeries]=useState<Point[]>([]), [summary,setSummary]=useState<{window_cost:number;p95_latency_ms:number;stale:boolean}|null>(null);

  const [prediction,setPrediction]=useState<Prediction|null>(null), [forecastError,setForecastError]=useState("");

  const [findings,setFindings]=useState<Finding[]>([]), [policy,setPolicy]=useState<Policy|null>(null), [decision,setDecision]=useState<Decision|null>(null);

  const [events,setEvents]=useState<AuditEvent[]>([]), [investigation,setInvestigation]=useState<Investigation|null>(null);

  const [question,setQuestion]=useState("Why is this environment unhealthy?"),[useLLM,setUseLLM]=useState(false);

  const [tab,setTab]=useState("Monitor"),[error,setError]=useState(""),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false),[loaded,setLoaded]=useState(false);

  const [hours,setHours]=useState(6);

  const [algorithm,setAlgorithm]=useState("ridge");

  const sequence=useRef(0);

  const env=envs.find(e=>e.id===selected), last=series.at(-1);

  async function loadEnvironments() {

    const data=await api("/operations/environments"); setEnvs(data); setSelected(old=>data.some((e:Env)=>e.id===old)?old:data[0]?.id||""); setLoaded(true);

  }

  useEffect(()=>{loadEnvironments().catch(e=>{setError(e.message);setLoaded(true);});},[]);

  async function refresh(id=selected, windowHours=hours) {

    if(!id)return;

    const version=++sequence.current;

    try {

      const [metrics,anomalies,forecast,history]=await Promise.all([

        api(`/operations/${id}/metrics?hours=${windowHours}`),

        api(`/operations/${id}/anomalies`).catch(()=>[]),

        api(`/operations/${id}/forecast?algorithm=${algorithm}`).then(data=>({data,error:""})).catch(e=>({data:null,error:e.message})),

        api(`/operations/${id}/events`)]);

      if(version!==sequence.current)return;

      setSeries(metrics.series);setSummary(metrics.summary);setFindings(anomalies);setPrediction(forecast.data);setForecastError(forecast.error);setEvents(history);

    }catch(e){if(version===sequence.current)setError((e as Error).message);}

  }

  useEffect(()=>{

    setSeries([]);setSummary(null);setPrediction(null);setFindings([]);setDecision(null);setInvestigation(null);setPolicy(null);setError("");setNotice("");

    if(!selected)return;

    let alive=true;

    api(`/operations/${selected}/policy`).then(p=>{if(alive)setPolicy(p);}).catch(e=>{if(alive)setError(e.message);});

    refresh(selected,hours);

    const timer=setInterval(()=>refresh(selected,hours),15000);

    return()=>{alive=false;sequence.current++;clearInterval(timer);};

  },[selected,hours,algorithm]);

  async function action(fn:()=>Promise<void>, message="") {

    setBusy(true);setError("");setNotice("");

    try{await fn();await refresh();setNotice(message);}catch(e){setError((e as Error).message);}finally{setBusy(false);}

  }

  async function exportCSV(){ const r=await request(`/operations/${selected}/metrics.csv`);if(!r.ok)throw new Error("CSV export failed");const url=URL.createObjectURL(await r.blob()); const a=document.createElement("a");a.href=url;a.download="cloudmind-metrics.csv";a.click();URL.revokeObjectURL(url);}

  return <section className="ops">

    <div className="ops-heading"><div><span className="ops-eyebrow">OBSERVE · PREDICT · INVESTIGATE</span><h2>Operations intelligence</h2><p>From infrastructure telemetry to evidence-based decisions.</p></div><button className="ops-button secondary" disabled={busy} onClick={()=>action(loadEnvironments)}>Refresh environments</button></div>

    {error&&<div className="ops-alert danger" role="alert">{error}</div>}{notice&&<div className="ops-alert" role="status">{notice}</div>}

    {!selected ? <div className="ops-empty"><h3>{loaded?"Connect your first environment":"Loading environments…"}</h3><p>Create a project, application and environment in the sidebar, then return here.</p>{loaded&&!readOnly&&<button className="ops-button" disabled={busy} onClick={()=>action(async()=>{const d=await api("/demo",{method:"POST"});await loadEnvironments();setSelected(d.environment_id);},"Demo workspace created with synthetic telemetry.")}>Create demo workspace</button>}<p className="ops-muted">Demo creation must be enabled by the server operator.</p></div> : <>

    <div className="ops-toolbar"><label>Environment<select aria-label="Operations environment" value={selected} disabled={busy} onChange={e=>setSelected(e.target.value)}>{envs.map(e=><option key={e.id} value={e.id}>{e.project} / {e.application} / {e.name}</option>)}</select></label><label>History<select aria-label="History window" value={hours} disabled={busy} onChange={e=>setHours(Number(e.target.value))}><option value="1">1 hour</option><option value="6">6 hours</option><option value="24">24 hours</option></select></label><span className={`ops-source ${env?.simulated?"simulated":""}`}>{env?.simulated?"SIMULATED DATA":"INGESTED TELEMETRY"}</span><button className="ops-button secondary" disabled={busy||!last} onClick={()=>action(exportCSV)}>Export CSV</button></div>

    <nav className="ops-tabs" aria-label="Operations views">{["Monitor","Forecast","Autoscaler","Investigation","Activity"].map(t=><button key={t} className={tab===t?"selected":""} onClick={()=>setTab(t)}>{t}</button>)}</nav>

    {summary?.stale&&<div className="ops-alert danger">Telemetry is stale. Forecasting and scaling are blocked until fresh samples arrive.</div>}

    {!last ? <div className="ops-empty"><h3>No telemetry yet</h3><p>Send measurements to the authenticated metrics API, or explore with simulated traffic.</p>{!readOnly&&<button className="ops-button" disabled={busy} onClick={()=>action(async()=>{await api(`/operations/${selected}/simulation`,{method:"POST"});await loadEnvironments();})}>Start simulated traffic</button>}</div> : <>

    {tab==="Monitor"&&<><div className="ops-stats">{[["CPU utilization",`${last.cpu.toFixed(1)}%`,`${last.replicas} replicas`],["Request rate",`${last.rps.toFixed(0)} /s`,`${(last.error_rate*100).toFixed(2)}% errors`],["Latency",`${last.latency_ms.toFixed(0)} ms`,`p95 ${summary?.p95_latency_ms.toFixed(0)} ms`],["Estimated cost",`$${last.cost_per_hour.toFixed(3)}/h`,`$${summary?.window_cost.toFixed(3)} in window`]].map(([label,value,sub])=><div className="ops-stat" key={label}><span>{label}</span><strong>{value}</strong><small>{sub}</small></div>)}</div><div className="ops-chart-grid"><Chart label="Request throughput / second" values={series.map(s=>s.rps)}/><Chart label="Response latency · milliseconds" values={series.map(s=>s.latency_ms)} color="#8b5cf6"/><Chart label="CPU utilization · percent" values={series.map(s=>s.cpu)} color="#0d9488"/><Chart label="Memory utilization · percent" values={series.map(s=>s.memory)} color="#f59e0b"/></div><div className="ops-panel"><h3>Active anomalies</h3>{findings.length?findings.map(f=><div className="ops-finding" key={f.metric}><span className="ops-source simulated">{f.severity}</span><strong>{f.metric}</strong><span>{f.value.toFixed(3)} / threshold {f.threshold.toFixed(3)}</span><span>{f.classification.replaceAll("_"," ")}</span></div>):<p>No active anomalies detected.</p>}{env?.simulated&&!readOnly&&<div className="ops-actions"><button className="ops-button secondary" disabled={busy} onClick={()=>action(async()=>{await api(`/operations/${selected}/simulation/incident`,{method:"POST"});},"A ten-minute synthetic incident is now active.")}>Inject simulated incident</button><button className="ops-button secondary" disabled={busy} onClick={()=>action(async()=>{await api(`/operations/${selected}/simulation`,{method:"DELETE"});await loadEnvironments();},"Simulation stopped. Historical data is retained.")}>Stop simulation</button></div>}</div><p className="ops-muted">Latest sample: {new Date(last.timestamp).toLocaleString()} · refresh every 15 seconds · simulator advances every minute.</p></>}

    {tab==="Forecast"&&<><div className="ops-panel"><h3>Forecast model</h3><label>Algorithm<select aria-label="Forecast algorithm" value={algorithm} disabled={busy} onChange={e=>setAlgorithm(e.target.value)}>{["ridge","xgboost","lstm","transformer"].map(a=><option key={a} value={a}>{a.toUpperCase()}</option>)}</select></label><p>Advanced models require 90 minutes of telemetry. Training uses a chronological holdout and saves an environment-specific artifact.</p>{algorithm!=="ridge"&&!readOnly&&<button className="ops-button" disabled={busy} onClick={()=>action(async()=>{await api(`/operations/${selected}/models/train`,jsonBody({algorithm,epochs:30}));},"Model trained and saved.")}>{busy?"Training…":"Train selected model"}</button>}</div>{prediction?<><div className="ops-panel"><h3>30-minute traffic forecast</h3><p>{prediction.model.toUpperCase()} trained on this environment’s telemetry.</p><ForecastChart prediction={prediction}/><p className="ops-muted">{prediction.interval_note}</p></div><div className="ops-stats">{Object.entries(prediction.evaluation).map(([k,v])=><div className="ops-stat" key={k}><span>{k.replaceAll("_"," ").toUpperCase()}</span><strong>{v.toFixed(2)}{k==="mape"?"%":""}</strong></div>)}</div><div className="ops-alert">{prediction.evaluation_note} Synthetic results describe the simulator, not production performance.</div></>:<div className="ops-empty">{forecastError||"Collect at least 60 minutes of data to train a forecast."}</div>}</>}

    {tab==="Autoscaler"&&<div className="ops-columns"><div className="ops-panel"><h3>Scaling policy</h3><p>Limits and cooldown apply to every recommendation.</p>{policy&&<form onSubmit={e=>{e.preventDefault();action(async()=>{setPolicy(await api(`/operations/${selected}/policy`,jsonBody(policy,"PUT")));setDecision(null);},"Policy saved.");}}><div className="ops-form-grid">{([['min_replicas','Minimum replicas'],['max_replicas','Maximum replicas'],['max_step','Maximum change'],['capacity_per_replica','Requests / replica / sec'],['target_utilization','Target utilization (0.1–0.95)'],['cooldown_seconds','Cooldown seconds'],['latency_slo_ms','Latency SLO (ms)'],['cost_per_replica_hour','Cost / replica / hour']] as [keyof Policy,string][]).map(([k,label])=><label key={k}>{label}<input aria-label={label} type="number" step={k.includes("cost")||k==="target_utilization"?"0.01":"1"} required disabled={readOnly||busy} value={policy[k]} onChange={e=>setPolicy({...policy,[k]:Number(e.target.value)})}/></label>)}</div><label>Forecast algorithm<select value={policy.forecast_model} disabled={readOnly||busy} onChange={e=>setPolicy({...policy,forecast_model:e.target.value})}>{["ridge","xgboost","lstm","transformer"].map(a=><option key={a}>{a}</option>)}</select></label><label>Strategy<select value={policy.strategy} disabled={readOnly||busy} onChange={e=>setPolicy({...policy,strategy:e.target.value})}><option value="forecast">Forecast safeguards</option><option value="qlearning">Q-learning with forecast safeguards</option></select></label>{!readOnly&&<button type="button" className="ops-button secondary" disabled={busy} onClick={()=>action(async()=>{await api(`/operations/${selected}/models/train`,jsonBody({algorithm:"qlearning"}));},"Q-learning policy trained.")}>Train Q-learning policy</button>}<label>Maximum spot fraction (advisory cost estimate)<input type="number" min="0" max="0.8" step="0.1" value={policy.max_spot_fraction} disabled={readOnly||busy} onChange={e=>setPolicy({...policy,max_spot_fraction:Number(e.target.value)})}/></label><label>Execution mode<select aria-label="Execution mode" disabled={readOnly||busy} value={policy.mode} onChange={e=>setPolicy({...policy,mode:e.target.value})}><option value="advisory">Advisory only</option><option value="simulation">Apply to simulation</option><option value="kubernetes">Kubernetes operator CLI</option></select></label><button className="ops-button" disabled={busy||readOnly}>Save policy</button></form>}</div><div className="ops-panel"><h3>Recommended capacity</h3><p>Uses the forecast’s upper envelope and checks telemetry freshness.</p><button className="ops-button" disabled={busy||readOnly} onClick={()=>action(async()=>setDecision(await api(`/operations/${selected}/scaling/plan`,{method:"POST"})))}>Generate scaling plan</button>{decision&&<div className="ops-decision"><strong>{decision.current_replicas} → {decision.recommended_replicas}</strong><span>replicas · {decision.action.replaceAll("_"," ")}</span><p>{decision.reason}</p><p>Estimated capacity cost: ${decision.estimated_hourly_cost.toFixed(3)}/hour</p>{decision.capacity_shortfall&&<div className="ops-alert danger">The policy limits cannot meet forecast capacity. Review bounds.</div>}{policy?.mode==="simulation"&&env?.simulated&&<button className="ops-button" disabled={busy||readOnly} onClick={()=>action(async()=>{await api(`/operations/${selected}/scaling/${decision.id}/apply`,{method:"POST"});setDecision(null);},"Simulation capacity updated.")}>Apply to simulation</button>}</div>}<p className="ops-muted">Real clusters are changed only through the configured operator CLI with an explicit apply flag. Registering a cluster alone does not connect it.</p></div></div>}

    {tab==="Investigation"&&<div className="ops-panel"><h3>Investigate with evidence</h3><p>Combines current anomalies and deployment history. Suggestions never execute remediation.</p><form onSubmit={e=>{e.preventDefault();action(async()=>setInvestigation(await api(`/operations/${selected}/investigate`,jsonBody({question,use_llm:useLLM}))));}}><label>Investigation question<textarea aria-label="Investigation question" value={question} maxLength={1000} minLength={3} required onChange={e=>setQuestion(e.target.value)}/></label><label className="ops-checkbox"><input type="checkbox" checked={useLLM} onChange={e=>setUseLLM(e.target.checked)}/>Use configured LLM provider (sends this question and environment evidence to Bedrock or Anthropic)</label><button className="ops-button" disabled={busy||readOnly}>{busy?"Investigating…":"Run investigation"}</button></form>{investigation&&<article className="ops-investigation"><span className="ops-source">{investigation.engine}</span><h3>{investigation.hypothesis}</h3><p>Confidence: {investigation.confidence}</p>{investigation.analysis&&<p className="ops-prewrap">{investigation.analysis}</p>}<h4>Recommended next steps</h4><ul>{investigation.recommendations.map(r=><li key={r}>{r}</li>)}</ul><h4>Evidence limitations</h4><ul>{investigation.limitations.map(r=><li key={r}>{r}</li>)}</ul></article>}</div>}

    {tab==="Activity"&&<div className="ops-panel"><h3>Environment activity</h3><p>Persisted ingestion, policy, investigation and scaling events.</p>{events.map(e=><details className="ops-event" key={e.id}><summary><strong>{e.kind}</strong><time>{new Date(e.created_at).toLocaleString()}</time></summary><pre>{JSON.stringify(e.data,null,2)}</pre></details>)}{!events.length&&<p>No events yet.</p>}</div>}

    </>}

    </>}

  </section>;

}



function ForecastChart({prediction}:{prediction:Prediction}) {

  const data=prediction.points,max=Math.max(1,...data.map(p=>p.upper))*1.1;

  const xy=(value:number,index:number)=>`${40+index*650/(data.length-1)},${175-value/max*140}`;

  return <svg role="img" aria-label="30-minute forecast with heuristic uncertainty band" viewBox="0 0 710 215" className="ops-forecast-chart"><line x1="40" y1="175" x2="690" y2="175" stroke="#dfe5ef"/><polygon points={[...data.map((p,i)=>xy(p.upper,i)),...data.map((p,i)=>xy(p.lower,i)).reverse()].join(" ")} fill="#4361ee" opacity=".15"/><polyline points={data.map((p,i)=>xy(p.rps,i)).join(" ")} fill="none" stroke="#4361ee" strokeWidth="3"/><text x="40" y="205" fontSize="12">+1 minute</text><text x="610" y="205" fontSize="12">+30 minutes</text><text x="0" y="30" fontSize="11">{max.toFixed(0)}</text><text x="8" y="175" fontSize="11">0</text></svg>;

}

