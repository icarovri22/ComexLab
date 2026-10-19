'use client';
import {useState} from 'react';
import {Clock3,Trash2} from 'lucide-react';
import type {SimulationReport} from '../../lib/simulation-report';
import SimulationReportView from './SimulationReportView';
export default function SimulationHistory({reports,enabled,onDelete}:{reports:SimulationReport[];enabled:boolean;onDelete:(index:number)=>void}){
 const [opened,setOpened]=useState<number|null>(null);
 return <section className="simulation-history" aria-label="Histórico das simulações">
  <div className="simulation-history-heading"><div><h2><Clock3 size={20}/> Histórico de simulações</h2><p>Até 30 relatórios recentes, armazenados neste navegador para sua conta.</p></div><span className="simulation-history-counter">{reports.length} salvas</span></div>
  {!enabled?<p className="help">Entre na sua conta para manter um histórico individual neste navegador.</p>:reports.length===0?<p className="help">Nenhuma simulação salva. Gere um relatório para adicioná-lo automaticamente ao histórico.</p>:<div className="simulation-history-list">{reports.map((report,index)=><div className="simulation-history-row" key={`${report.generatedAt}-${index}`}><div><strong>{report.operation} — {report.product||'Mercadoria não informada'}</strong><small>{report.generatedAt} · {report.route}</small><span>{report.total} · {report.status}</span></div><div className="simulation-history-actions"><button type="button" className="btn secondary" onClick={()=>setOpened(opened===index?null:index)}>{opened===index?'Fechar':'Visualizar'}</button><button type="button" className="btn secondary" aria-label="Excluir simulação" title="Excluir simulação" onClick={()=>{if(window.confirm('Excluir esta simulação do histórico?')){onDelete(index);setOpened(null)}}}><Trash2 size={16}/></button></div></div>)}</div>}
  {opened!==null&&reports[opened]&&<SimulationReportView report={reports[opened]} stale={false} onRegenerate={()=>setOpened(null)}/>}
 </section>;
}
