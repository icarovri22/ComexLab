import {NextRequest,NextResponse} from 'next/server';
import {verifiedAdmin,noStore} from '../../../../lib/admin-auth';
import {synchronizeNews} from '../../../../lib/news-sync';
export const runtime='nodejs';
export const maxDuration=60;
function fail(message:string,status:number){return NextResponse.json({error:message},{status,headers:noStore})}
export async function GET(req:NextRequest){
 const expected=process.env.CRON_SECRET;
 if(!expected||expected.length<28||req.headers.get('authorization')!==`Bearer ${expected}`)return fail('Não autorizado.',401);
 try{return NextResponse.json(await synchronizeNews(),{headers:noStore})}catch(e){console.error('Cron news sync error',e instanceof Error?e.message:'unknown');return fail('Falha ao atualizar notícias.',503)}
}
export async function POST(req:NextRequest){
 const actor=await verifiedAdmin(req.cookies.get('comexlab_session')?.value);
 if(!actor)return fail('Acesso restrito.',403);
 const origin=req.headers.get('origin');
 try{if(!origin||new URL(origin).host!==req.nextUrl.host)return fail('Origem não autorizada.',403)}catch{return fail('Origem inválida.',403)}
 try{return NextResponse.json(await synchronizeNews(),{headers:noStore})}catch(e){console.error('Admin news sync error',e instanceof Error?e.message:'unknown');return fail('Não foi possível atualizar as fontes.',503)}
}
