import {NextRequest,NextResponse} from 'next/server';
import {verifiedAccount,noStore} from '../../../../lib/admin-auth';
import {BCB_SOURCE,parseExchangeSeries} from '../../../../lib/news-indicators';
export const runtime='nodejs';
export async function GET(req:NextRequest){
 if(!await verifiedAccount(req.cookies.get('comexlab_session')?.value))return NextResponse.json({error:'Acesse sua conta.'},{status:401,headers:noStore});
 try{
  const end=new Date();const start=new Date(end.getTime()-45*86400000);
  const fmt=(d:Date)=>`${String(d.getUTCDate()).padStart(2,'0')}/${String(d.getUTCMonth()+1).padStart(2,'0')}/${d.getUTCFullYear()}`;
  const url=new URL('https://api.bcb.gov.br/dados/serie/bcdata.sgs.1/dados');
  url.searchParams.set('formato','json');url.searchParams.set('dataInicial',fmt(start));url.searchParams.set('dataFinal',fmt(end));
  const response=await fetch(url,{next:{revalidate:3600},signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw Error('Fonte indisponível');
  const points=parseExchangeSeries(await response.json()).filter(point=>point.date<=end.toISOString().slice(0,10)).slice(-30);
  return NextResponse.json({points,source:BCB_SOURCE,series:1,label:'Dólar americano — venda (PTAX)',unit:'R$ por US$ 1',consultedAt:new Date().toISOString()},{headers:noStore});
 }catch{return NextResponse.json({error:'Indicador temporariamente indisponível no Banco Central.',source:BCB_SOURCE},{status:503,headers:noStore});}
}
