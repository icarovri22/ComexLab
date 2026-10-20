import type {SimulationReport} from './simulation-report';
export function readStoredJson(key:string,getStorage:()=>Pick<Storage,'getItem'>=()=>window.localStorage):unknown{
 try{return JSON.parse(getStorage().getItem(key)||'null')}catch{return null}
}
export function chooseSimulationDraft(local:unknown,remote:unknown):Record<string,unknown>|null{
 const object=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
 return object(local)?local:object(remote)?remote:null;
}
export function isSimulationReport(value:unknown):value is SimulationReport{
 if(!value||typeof value!=='object')return false;const r=value as Record<string,unknown>;
 const strings=(v:unknown)=>Array.isArray(v)&&v.every(item=>typeof item==='string');
 const lines=(v:unknown)=>Array.isArray(v)&&v.every(item=>item&&typeof item.label==='string'&&typeof item.value==='string');
 return ['generatedAt','operation','route','product','total'].every(key=>typeof r[key]==='string')&&
  (r.status==='Completa para fins didáticos'||r.status==='Requer revisão')&&lines(r.summary)&&
  Array.isArray(r.sections)&&r.sections.every(item=>item&&typeof item.title==='string'&&lines(item.lines))&&
  strings(r.alerts)&&strings(r.checked)&&strings(r.unchecked)&&Array.isArray(r.sources)&&r.sources.every(item=>item&&typeof item.name==='string'&&typeof item.url==='string');
}
const sameReport=(a:SimulationReport,b:SimulationReport)=>a.generatedAt===b.generatedAt&&a.operation===b.operation&&a.route===b.route&&a.product===b.product&&a.total===b.total;
export function mergeSimulationHistory(remote:unknown,local:unknown):SimulationReport[]{
 const cached=Array.isArray(local)?local.filter(isSimulationReport):[];
 if(!Array.isArray(remote))return cached.slice(0,30);
 const stored=remote.filter(isSimulationReport);
 // Cached server records absent from the authoritative response were deleted elsewhere.
 const offline=cached.filter(row=>!row.serverId&&!stored.some(item=>sameReport(item,row)));
 return [...stored,...offline].slice(0,30);
}
