export type EconomicPoint={date:string;value:number};
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
