export const BCB_SOURCE='https://dadosabertos.bcb.gov.br/dataset/1-taxa-de-cambio---livre---dolar-americano-venda---diario';
export type ExchangePoint={date:string;value:number};
export function parseExchangeSeries(input:unknown):ExchangePoint[]{
 if(!Array.isArray(input))throw Error('Resposta não reconhecida do Banco Central.');
 const points=new Map<string,ExchangePoint>();
 for(const row of input){
  if(!row||typeof row!=='object')continue;
  const date=String(row.data||'');const value=Number(String(row.valor||'').replace(',','.'));
  const match=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(date);
  if(!match||!Number.isFinite(value)||value<=0)continue;
  const iso=`${match[3]}-${match[2]}-${match[1]}`;
  const stamp=new Date(iso+'T12:00:00Z');if(!Number.isFinite(stamp.getTime())||stamp.toISOString().slice(0,10)!==iso)continue;
  points.set(iso,{date:iso,value});
 }
 const result=[...points.values()].sort((a,b)=>a.date.localeCompare(b.date));
 if(result.length<2)throw Error('A fonte não retornou observações suficientes.');
 return result;
}
