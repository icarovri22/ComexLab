import {NextRequest,NextResponse} from 'next/server';
import {selectedSession} from '../../../../lib/account-session';
import {verifiedAccount,noStore} from '../../../../lib/admin-auth';
import {ECONOMIC_SERIES,parseEconomicSeries} from '../../../../lib/economy';
export const runtime='nodejs';
export const maxDuration=30;
export async function GET(req:NextRequest){
 if(!await verifiedAccount(selectedSession(req)))return NextResponse.json({error:'Acesse sua conta.'},{status:401,headers:noStore});
 const now=new Date();
 const indicatorsPromise=Promise.all(ECONOMIC_SERIES.map(async config=>{
  const sourceUrl=`https://www3.bcb.gov.br/sgspub/consultarmetadados/consultarMetadadosSeries.do?method=consultarMetadadosSeriesInternet&hdOidSerieSelecionada=${config.series}`;
  try{
   const response=await fetch(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.${config.series}/dados/ultimos/20?formato=json`,{next:{revalidate:3600},signal:AbortSignal.timeout(8000)});
   if(!response.ok)throw Error('Fonte indisponível');
   const points=parseEconomicSeries(await response.json(),now),latest=points.at(-1);
   if(!latest)throw Error('Sem observações válidas');
   return {...config,sourceUrl,latest,points,status:'available' as const};
  }catch{return {...config,sourceUrl,latest:null,points:[],status:'unavailable' as const}}
 }));
 const gdpPromise=(async()=>{
  const config={key:'gdp',label:'Atividade · PIB',unit:'% ante o mesmo trimestre do ano anterior',description:'PIB a preços de mercado. Variação trimestral interanual, sem confundir com crescimento anual.',source:'IBGE',sourceUrl:'https://sidra.ibge.gov.br/tabela/5932'};
  try{
   const response=await fetch('https://servicodados.ibge.gov.br/api/v3/agregados/5932/periodos/-4/variaveis/6561?localidades=N1[all]&classificacao=11255[90707]',{next:{revalidate:21600},signal:AbortSignal.timeout(8000)});
   if(!response.ok)throw Error('Fonte indisponível');
   const data=await response.json(),serie=data?.[0]?.resultados?.[0]?.series?.[0]?.serie;
   if(!serie||typeof serie!=='object')throw Error('Série não reconhecida');
   const points=Object.entries(serie).flatMap(([period,raw])=>{
    const match=/^(\d{4})0([1-4])$/.exec(period),value=Number(String(raw).replace(',','.'));
    if(!match||String(raw).trim()===''||!Number.isFinite(value))return [];
    const quarter=Number(match[2]),date=`${match[1]}-${String(quarter*3).padStart(2,'0')}-01`;
    return date>now.toISOString().slice(0,10)?[]:[{date,value,periodLabel:`${quarter}º trimestre de ${match[1]}`}];
   }).sort((a,b)=>a.date.localeCompare(b.date));
   const latest=points.at(-1);if(!latest)throw Error('Sem observações válidas');
   return {...config,latest,points,status:'available'};
  }catch{return {...config,latest:null,points:[],status:'unavailable'}}
 })();
 const [indicators,gdp]=await Promise.all([indicatorsPromise,gdpPromise]);
 return NextResponse.json({indicators:[...indicators,gdp],consultedAt:now.toISOString()},{headers:noStore});
}
