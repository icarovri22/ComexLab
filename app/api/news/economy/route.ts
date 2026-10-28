import {NextRequest,NextResponse} from 'next/server';
import {selectedSession} from '../../../../lib/account-session';
import {verifiedAccount,noStore} from '../../../../lib/admin-auth';
import {ECONOMIC_SERIES,parseEconomicSeries,parseGdpSeries,parseGdpValues} from '../../../../lib/economy';
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
  const config={key:'gdp',label:'PIB do Brasil',unit:'Reais a preços correntes · total do trimestre',description:'O valor mostra o tamanho da produção no trimestre. A variação real desconta os efeitos dos preços e compara com o mesmo trimestre do ano anterior.',source:'IBGE / SIDRA',sourceUrl:'https://sidra.ibge.gov.br/tabela/1846',growthSourceUrl:'https://sidra.ibge.gov.br/tabela/5932',valueType:'currency'};
  const read=async(url:string,parser:typeof parseGdpSeries)=>{
   try{
    const response=await fetch(url,{next:{revalidate:21600},signal:AbortSignal.timeout(10000)});
    if(!response.ok)throw Error('Fonte indisponível');
    return parser(await response.json(),now).at(-1)||null;
   }catch{return null}
  };
  const [latest,growth]=await Promise.all([
   read('https://apisidra.ibge.gov.br/values/t/1846/n1/1/v/585/p/last%204/c11255/90707?formato=json',parseGdpValues),
   read('https://apisidra.ibge.gov.br/values/t/5932/n1/1/v/6561/p/last%204/c11255/90707?formato=json',parseGdpSeries)
  ]);
  return {...config,latest,growth,status:latest?'available':'unavailable'};
 })();
 const [indicators,gdp]=await Promise.all([indicatorsPromise,gdpPromise]);
 return NextResponse.json({indicators:[...indicators,gdp],consultedAt:now.toISOString()},{headers:noStore});
}
