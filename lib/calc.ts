export type NumericTax = {rate:string; name:string};
export const numberFrom=(value:string|number):number=>{ const parsed= typeof value==='number'?value:Number(value.trim().replace(',','.'));return Number.isFinite(parsed)?Math.max(0,parsed):0; };
export const hasRate=(v:string)=>v.trim()!=='' && Number.isFinite(Number(v.trim().replace(',','.'))) && Number(v.trim().replace(',','.'))>=0;
export const formatUsd=(v:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'USD'}).format(v);
export const formatBrl=(v:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v);
export function calculateDestinationTax(value:number,dutyRate:string,indirectRate:string){
 const duty=hasRate(dutyRate)?value*numberFrom(dutyRate)/100:null;
 const indirect=duty!==null&&hasRate(indirectRate)?(value+duty)*numberFrom(indirectRate)/100:null;
 return {duty,indirect,complete:duty!==null&&indirect!==null,total:duty!==null&&indirect!==null?duty+indirect:null};
}
export function calculateBrazilImport(value:number,inputs:{ii:string;ipi:string;pis:string;cofins:string;icms:string},additional=0){
 const complete=Object.values(inputs).every(hasRate);
 const ii=value*numberFrom(inputs.ii)/100;
 const ipi=(value+ii)*numberFrom(inputs.ipi)/100;
 const pis=value*numberFrom(inputs.pis)/100;
 const cofins=value*numberFrom(inputs.cofins)/100;
 const p=numberFrom(inputs.icms)/100;
 const valid=p<1;
 // Ilustração do cálculo por dentro do ICMS. A composição real da base depende da legislação estadual e do caso.
 const icms=valid?(value+ii+ipi+pis+cofins+additional)/(1-p)*p:null;
 return {ii,ipi,pis,cofins,icms,complete:complete&&valid,total:complete&&valid&&icms!==null?ii+ipi+pis+cofins+icms:null};
}
