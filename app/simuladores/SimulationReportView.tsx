'use client';

import {Printer,Download,RefreshCcw,AlertTriangle,CheckCircle2,Plus} from 'lucide-react';
import {useState} from 'react';
import type {SimulationReport} from '../../lib/simulation-report';

export default function SimulationReportView({report,stale,onEdit,onNew,saving=false,editLabel='Atualizar relatório'}:{report:SimulationReport;stale:boolean;onEdit:()=>void;onNew?:()=>void;saving?:boolean;editLabel?:string}){
 const [generatingPdf,setGeneratingPdf]=useState(false);
 const [pdfError,setPdfError]=useState('');
 async function downloadPdf(){
   if(stale||generatingPdf)return;
   setPdfError('');setGeneratingPdf(true);
   try{
     const {createSimulationPdf}=await import('../../lib/report-pdf');
     const doc=createSimulationPdf(report);
     const date=new Date().toISOString().slice(0,10);
     doc.save(`ComexHub-relatorio-simulacao-${date}.pdf`);
   }catch(error){
     console.error('Falha ao gerar o PDF da simulacao',error);
     setPdfError('Não foi possível gerar o PDF. Tente novamente.');
   }finally{setGeneratingPdf(false)}
 }
 return <section id="simulation-report-section" className="simulation-report-section" aria-label="Relatório da simulação" tabIndex={-1}>
  <div className="simulation-report-toolbar">
   <div><span className="eyebrow">RELATÓRIO GERADO</span><h2>Prévia do relatório</h2><p className="help">Confira os dados e escolha uma ação: imprimir ou baixar o PDF diretamente.</p></div>
   <div className="simulation-report-actions">
    {onNew&&<button type="button" className="btn" onClick={onNew} disabled={saving||generatingPdf}><Plus size={17}/> Nova simulação</button>}
    <button type="button" className="btn secondary" onClick={onEdit} disabled={saving}><RefreshCcw size={17}/> {editLabel}</button>
    <button type="button" className="btn secondary" onClick={()=>window.print()} disabled={stale||generatingPdf} title={stale?'Atualize o relatório para refletir os novos dados':'Abrir a impressão do relatório'}><Printer size={17}/> Imprimir</button>
    <button type="button" className="btn" onClick={()=>void downloadPdf()} disabled={stale||generatingPdf} title={stale?'Atualize o relatório para refletir os novos dados':'Baixar o relatório em arquivo PDF'}><Download size={17}/> {generatingPdf?'Gerando PDF...':'Baixar PDF'}</button>
   </div>
  </div>
  {pdfError&&<div className="alert simulation-report-stale" role="alert">{pdfError}</div>}
  {stale&&<div className="alert simulation-report-stale" role="status"><AlertTriangle size={18}/> A simulação foi modificada depois da geração. Selecione <strong>Atualizar relatório</strong> para revisar os dados e, na etapa Resultado, salve as alterações antes de imprimir ou baixar.</div>}
  <article className="simulation-printable" id="simulation-printable">
   <header className="simulation-report-header"><div><span className="simulation-report-brand">Comex<span>Hub</span></span><p>Relatório educacional de comércio exterior</p></div><div className="simulation-report-header-right"><strong>RELATÓRIO DIDÁTICO</strong><span>{report.generatedAt} · horário de Fortaleza</span></div></header>
   <div className="simulation-report-intro"><div><span className="simulation-report-label">OPERAÇÃO</span><h2>{report.operation}</h2><p>{report.route}</p></div><div><span className="simulation-report-label">MERCADORIA</span><h2>{report.product||'Não informada'}</h2><p>{report.status}</p></div></div>
   <div className="simulation-report-total"><div><span>Resultado estimado da simulação</span><strong>{report.total}</strong></div><div className="simulation-report-status"><span>{report.status==='Completa para fins didáticos'?<CheckCircle2 size={16}/>:<AlertTriangle size={16}/>} {report.status}</span></div></div>
   <section className="simulation-report-group"><h3>Resumo da operação</h3><dl className="simulation-report-lines">{report.summary.map((line,i)=><div key={i}><dt>{line.label}</dt><dd>{line.value}</dd></div>)}</dl></section>
   {report.sections.map((section,i)=><section key={i} className="simulation-report-group"><h3>{section.title}</h3><dl className="simulation-report-lines">{section.lines.map((line,j)=><div key={j}><dt>{line.label}</dt><dd>{line.value}</dd></div>)}</dl></section>)}
   <section className="simulation-report-group"><h3>Checklist da operação</h3><p className="simulation-report-caption">{report.checked.length} de {report.checked.length+report.unchecked.length} verificações confirmadas pelo usuário.</p><ul className="simulation-report-checklist">{report.checked.map((s,i)=><li key={'y'+i}><span aria-hidden="true">✓</span>{s}</li>)}{report.unchecked.map((s,i)=><li className="pending" key={'n'+i}><span aria-hidden="true">○</span>{s} — não confirmado</li>)}</ul></section>
   {report.alerts.length>0&&<section className="simulation-report-group simulation-report-warnings"><h3>Alertas e pendências</h3><ul>{report.alerts.map((s,i)=><li key={i}>{s}</li>)}</ul></section>}
   <section className="simulation-report-group simulation-report-sources"><h3>Fontes consultadas e conferência</h3><ul>{report.sources.map((s,i)=><li key={i}><strong>{s.name}:</strong> <a href={s.url} target="_blank" rel="noopener noreferrer">{s.url}</a></li>)}</ul></section>
   <footer className="simulation-report-disclaimer"><strong>Importante:</strong> Este relatório reproduz uma simulação educacional com valores e alíquotas fornecidos pelo usuário. Não constitui cotação, declaração aduaneira, classificação fiscal vinculante nem cálculo tributário oficial. As regras fiscais, bases de cálculo, exigências, origem preferencial, documentos e condições contratuais devem ser confirmados nas autoridades e fontes vigentes do país importador. A distribuição de despesas pelo Incoterm é simplificada e depende do local nomeado e das condições contratuais.</footer>
  </article>
 </section>;
}
