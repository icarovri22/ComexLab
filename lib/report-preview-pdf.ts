import html2canvas from 'html2canvas';
import {jsPDF} from 'jspdf';

/** Export the same rendered report, without opening the browser print dialog. */
export async function createPreviewPdf(element:HTMLElement){
 await document.fonts.ready;
 let blocks:{top:number;bottom:number}[]=[];
 const canvas=await html2canvas(element,{
  scale:2,backgroundColor:'#ffffff',windowWidth:1200,logging:false,
  onclone:doc=>{
   const clone=doc.getElementById(element.id);
   if(!clone)throw Error('Prévia do relatório não encontrada.');
   clone.style.width='930px';clone.style.maxWidth='930px';clone.style.margin='0';
   const top=clone.getBoundingClientRect().top;
   blocks=Array.from(clone.querySelectorAll('.simulation-report-lines>div,.simulation-report-checklist li,.simulation-report-warnings li,.simulation-report-header,.simulation-report-intro,.simulation-report-total,h3')).map(node=>{const r=node.getBoundingClientRect();return {top:r.top-top,bottom:r.bottom-top}});
  }
 });
 const pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});
 const margin=12,width=pdf.internal.pageSize.getWidth()-margin*2,height=pdf.internal.pageSize.getHeight()-margin*2;
 const pixelsPerMm=canvas.width/width,maxHeight=Math.floor(height*pixelsPerMm),scale=canvas.width/930;
 let start=0,page=0;
 while(start<canvas.height){
  let end=Math.min(start+maxHeight,canvas.height);
  if(end<canvas.height){
   const crossing=blocks.filter(b=>b.top*scale<end&&b.bottom*scale>end&&b.top*scale>start+maxHeight*.25);
   if(crossing.length)end=Math.floor(Math.min(...crossing.map(b=>b.top*scale)));
  }
  const slice=document.createElement('canvas');slice.width=canvas.width;slice.height=end-start;
  const context=slice.getContext('2d');if(!context)throw Error('Não foi possível preparar o PDF.');
  context.drawImage(canvas,0,start,canvas.width,slice.height,0,0,canvas.width,slice.height);
  if(page++)pdf.addPage();
  pdf.addImage(slice.toDataURL('image/png'),'PNG',margin,margin,width,slice.height/pixelsPerMm);
  start=end;slice.width=0;slice.height=0;
 }
 canvas.width=0;canvas.height=0;
 return pdf;
}
