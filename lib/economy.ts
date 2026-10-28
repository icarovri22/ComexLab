export type EconomicPoint={date:string;value:number};
export function parseGdpSeries(input:unknown,now=new Date()){
 if(!Array.isArray(input))throw Error('Resposta do SIDRA não reconhecida');
 const points=new Map<string,{date:string;value:number;periodLabel:string}>();
 for(const row of input){
  if(!row||typeof row!=='object'||row.D1C!=='1'||row.D2C!=='6561'||row.D4C!=='90707'||row.MC!=='2')continue;
  const match=/^(\d{4})0([1-4])$/.exec(String(row.D3C)),raw=String(row.V??'').trim();
  if(!match||!raw||!/^-?\d+(?:[.,]\d+)?$/.test(raw))continue;
  const quarter=Number(match[2]),date=`${match[1]}-${String(quarter*3).padStart(2,'0')}-01`,value=Number(raw.replace(',','.'));
  if(!Number.isFinite(value)||date>now.toISOString().slice(0,10))continue;
  points.set(date,{date,value,periodLabel:`${quarter}º trimestre de ${match[1]}`});
 }
 return [...points.values()].sort((a,b)=>a.date.localeCompare(b.date));
}
export const ECONOMIC_SERIES=[
 {key:'inflation',series:13522,label:'Inflação · IPCA',unit:'% em 12 meses',description:'Variação dos preços ao consumidor. Referência mensal.',source:'IBGE / Banco Central'},
 {key:'interest',series:432,label:'Juros · meta Selic',unit:'% ao ano',description:'Meta definida pelo Copom; influencia crédito e financiamento.',source:'Banco Central'},
 {key:'employment',series:24369,label:'Desocupação',unit:'% da força de trabalho',description:'PNAD Contínua: trimestre móvel encerrado no mês de referência.',source:'IBGE / Banco Central'},
] as const;
export function parseEconomicSeries(input:unknown,now=new Date()):EconomicPoint[]{
 if(!Array.isArray(input))throw Error('Formato não reconhecido');
 const points=new Map<string,EconomicPoint>();
 for(const item of input){
  if(!item||typeof item!=='object')continue;
  const row=item as Record<string,unknown>,match=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(row.data||''));
  if(!match||row.valor===null||row.valor===undefined||String(row.valor).trim()==='')continue;
  const date=`${match[3]}-${match[2]}-${match[1]}`,stamp=new Date(date+'T00:00:00Z'),value=Number(String(row.valor).replace(',','.'));
  if(!Number.isFinite(value)||!Number.isFinite(stamp.getTime())||stamp.toISOString().slice(0,10)!==date||date>now.toISOString().slice(0,10))continue;
  points.set(date,{date,value});
 }
 return [...points.values()].sort((a,b)=>a.date.localeCompare(b.date));
}
