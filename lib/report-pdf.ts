import {jsPDF} from 'jspdf';
import type {SimulationReport,ReportLine} from './simulation-report';

/** Create a real, searchable A4 PDF; does not rely on the browser print dialog. */
export function createSimulationPdf(report:SimulationReport):jsPDF {
 const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});
 const pw=210,ph=297,margin=15,contentWidth=pw-margin*2,bottom=ph-19;
 const ink:[number,number,number]=[0,0,0];
 const emphasis:[number,number,number]=[0,0,0];
 const muted:[number,number,number]=[64,64,64];
 let y=0;
 let page=0;

 function pageHeader(){
   if(page>0)doc.addPage();
   page++;
   doc.setFillColor(255,255,255);doc.rect(0,0,pw,22,'F');
   doc.setFont('helvetica','bold');doc.setFontSize(17);doc.setTextColor(...ink);
   doc.text('Comex',margin,15);doc.setTextColor(...emphasis);doc.text('Hub',margin+23.8,15);
   doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(...muted);
   doc.text('Simulação de comércio exterior',pw-margin,15,{align:'right'});
   doc.setDrawColor(192,192,192);doc.line(margin,23,pw-margin,23);
   y=32;
 }
 function room(height:number){if(y+height>bottom)pageHeader()}
 function text(value:string,size=10,bold=false,color=ink,indent=0){
   const label=String(value||'-').replace(/[→⟶➜]/g,' -> ').replace(/[–—−]/g,'-').replace(/\u00a0/g,' ');
   doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);doc.setTextColor(...color);
   const lines=doc.splitTextToSize(label,contentWidth-indent) as string[];
   const lineHeight=size*0.42+1.2;
   for(const line of lines){
     room(lineHeight);
     doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);doc.setTextColor(...color);
     doc.text(line,margin+indent,y+lineHeight*0.73);y+=lineHeight;
   }
 }
 function section(title:string){
   room(17);y+=7;doc.setDrawColor(192,192,192);doc.line(margin,y,pw-margin,y);y+=5;
   text(title,11,true,emphasis);y+=3;
 }
 function lines(items:ReportLine[]){
   for(const item of items){
     room(12);
     text(String(item.label),8,true,muted,1);
     text(String(item.value),10,false,ink,1);
     y+=3;
   }
 }
 function bullets(items:string[],symbol:string){
   for(const item of items){room(9);text(`${symbol} ${item}`,9,false,ink,2);y+=2;}
 }
 pageHeader();
 text('Relatório de simulação',16,true,ink);y+=4;
 text(`Emissão: ${report.generatedAt} · horário de Fortaleza`,8,false,muted);y+=5;
 text(`${report.operation} | ${report.route}`,11,true,emphasis);y+=4;
 text(`Mercadoria: ${report.product||'Não informada'}`,10);y+=2;
 text(`Status: ${report.status}`,10,true,report.status==='Requer revisão'?emphasis:ink);y+=2;
 room(19);y+=3;doc.setFillColor(255,255,255);doc.setDrawColor(0,0,0);doc.roundedRect(margin,y,contentWidth,17,2,2,'FD');y+=4;text('RESULTADO ESTIMADO DA SIMULAÇÃO',8,true,muted,4);text(report.total,14,true,emphasis,4);y+=5;
 section('Resumo da operação');lines(report.summary);
 for(const entry of report.sections){section(entry.title);lines(entry.lines)}
 room(35);section('Checklist da operação');
 text(`${report.checked.length} de ${report.checked.length+report.unchecked.length} verificações confirmadas`,9,false,muted);
 bullets(report.checked,'[OK]');bullets(report.unchecked.map(x=>`${x} - não confirmado`),'[ ]');
 if(report.alerts.length){section('Alertas e pendências');bullets(report.alerts,'!')}
 section('Fontes para conferência');
 for(const source of report.sources){text(source.name,9,true,ink,1);text(source.url,8,false,muted,1);y+=2;}
 section('Aviso importante');
 text('Este relatório apresenta uma simulação educacional baseada em dados fornecidos pelo usuário. Não constitui cotação comercial, declaração aduaneira, classificação fiscal vinculante nem cálculo tributário oficial. Confira alíquotas, bases de cálculo, documentação, Incoterms e exigências com as autoridades competentes.',8,false,muted);
 const pages=doc.getNumberOfPages();
 for(let i=1;i<=pages;i++){
   doc.setPage(i);doc.setDrawColor(192,192,192);doc.line(margin,ph-14,pw-margin,ph-14);
   doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(...muted);
   doc.text('ComexHub | Seu hub de aprendizados em comércio exterior',margin,ph-9);
   doc.text(`${i} / ${pages}`,pw-margin,ph-9,{align:'right'});
 }
 return doc;
}
