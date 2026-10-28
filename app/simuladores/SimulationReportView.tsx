'use client';

import {Printer,Download,RefreshCcw,AlertTriangle,CheckCircle2,Plus} from 'lucide-react';
import {useState} from 'react';
import type {SimulationReport} from '../../lib/simulation-report';

export default function SimulationReportView({report,stale,onEdit,onNew,saving=false,editLabel='Atualizar relatório'}:{report:SimulationReport;stale:boolean;onEdit:()=>void;onNew?:()=>void;saving?:boolean;editLabel?:string}){
 const [generatingPdf,setGeneratingPdf]=useState(false);
 const [pdfError,setPdfError]=useState('');
 async function downloadPdf(){
  if(stale||saving||generatingPdf)return;
  setGeneratingPdf(true);setPdfError('');
  try{
   const element=document.getElementById('simulation-printable');
   if(!element)throw Error('Prévia não encontrada.');
   const {createPreviewPdf}=await import('../../lib/report-preview-pdf');
   const pdf=await createPreviewPdf(element);
   pdf.save(`ComexHub-relatorio-simulacao-${new Date().toISOString().slice(0,10)}.pdf`);
  }catch{setPdfError('Não foi possível baixar o PDF. Tente novamente ou use Imprimir.');}
  finally{setGeneratingPdf(false)}
 }
 return <section id="simulation-report-section" className="simulation-report-section" aria-label="Relatório da simulação" tabIndex={-1}>
  <div className="simulation-report-toolbar">
   <div><span className="eyebrow">RELATÓRIO GERADO</span><h2>Prévia do relatório</h2><p className="help">Confira o relatório. Imprima ou baixe o PDF com o layout desta prévia.</p></div>
   <div className="simulation-report-actions">
    {onNew&&<button type="button" className="btn" onClick={onNew} disabled={saving||generatingPdf}><Plus size={17}/> Nova simulação</button>}
    <button type="button" className="btn secondary" onClick={onEdit} disabled={saving||generatingPdf}><RefreshCcw size={17}/> {editLabel}</button>
    <button type="button" className="btn" onClick={()=>window.print()} disabled={stale||saving||generatingPdf} title={stale?'Atualize o relatório para refletir os novos dados':'Abrir impressão'}><Printer size={17}/> Imprimir</button>
    <button type="button" className="btn" onClick={()=>void downloadPdf()} disabled={stale||saving||generatingPdf}><Download size={17}/> {generatingPdf?'Gerando PDF…':'Baixar PDF'}</button>
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
   <footer className="simulation-report-disclaimer"><strong>Importante:</strong> Este relatório reproduz uma simulação educacional com valores e alíquotas fornecidos pelo usuário. Não constitui cotação, declaração aduaneira, classificação fiscal vinculante nem cálculo tributário oficial. As regras fiscais, bases de cálculo, exigências, origem preferencial, documentos e condições contratuais devem ser confirmados nas autoridades e fontes vigentes do país importador. A distribuição de despesas pelo Incoterm é simplificada e depende do local nomeado e das condições contratuais.</footer>
  </article>
 </section>;
}
