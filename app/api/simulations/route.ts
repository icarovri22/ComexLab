import {selectedSession} from '../../../lib/account-session';
import {NextRequest,NextResponse} from 'next/server';
import {verifiedAccount,queryDB,noStore} from '../../../lib/admin-auth';
import {isSimulationReport} from '../../../lib/simulation-storage';
export const runtime='nodejs';
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:noStore});
async function user(req:NextRequest){return verifiedAccount(selectedSession(req))}
function trusted(req:NextRequest){const origin=req.headers.get('origin');try{return !!origin&&new URL(origin).host===req.nextUrl.host}catch{return false}}
export async function GET(req:NextRequest){
 const me=await user(req);if(!me)return fail('Sessão inválida.',401);
 try{const sql=queryDB();const [draft,hist]=await Promise.all([sql`SELECT payload FROM comexhub_simulation_drafts WHERE user_id=${me.id}`,sql`SELECT id::text AS id,report FROM comexhub_simulation_history WHERE user_id=${me.id} ORDER BY created_at DESC,id DESC LIMIT 30`]);return NextResponse.json({draft:draft[0]?.payload??null,history:hist.map(r=>({...r.report,serverId:r.id}))},{headers:noStore})}catch{return fail('Falha ao carregar as simulações.',503)}
}
export async function PUT(req:NextRequest){
 if(!trusted(req))return fail('Origem não autorizada.',403);const me=await user(req);if(!me)return fail('Sessão inválida.',401);
 let data:any;try{const body=await req.text();if(body.length>16000)return fail('Dados muito extensos.',413);data=JSON.parse(body)}catch{return fail('Dados inválidos.',400)}
 if(!data||typeof data!=='object'||Array.isArray(data))return fail('Rascunho inválido.',400);
 try{const sql=queryDB();await sql`INSERT INTO comexhub_simulation_drafts(user_id,payload,updated_at) VALUES (${me.id},${JSON.stringify(data)}::jsonb,NOW()) ON CONFLICT(user_id) DO UPDATE SET payload=excluded.payload,updated_at=NOW()`;return NextResponse.json({ok:true},{headers:noStore})}catch{return fail('Falha ao salvar o rascunho.',503)}
}
export async function POST(req:NextRequest){
 if(!trusted(req))return fail('Origem não autorizada.',403);const me=await user(req);if(!me)return fail('Sessão inválida.',401);
 let report:any;try{const body=await req.text();if(body.length>80000)return fail('Relatório muito extenso.',413);report=JSON.parse(body)}catch{return fail('Relatório inválido.',400)}
 if(!isSimulationReport(report))return fail('Relatório inválido.',400);
 try{const sql=queryDB();const result=await sql`INSERT INTO comexhub_simulation_history(user_id,report) VALUES (${me.id},${JSON.stringify(report)}::jsonb) RETURNING id::text`;return NextResponse.json({ok:true,id:result[0].id},{status:201,headers:noStore})}catch{return fail('Falha ao salvar o relatório.',503)}
}
export async function DELETE(req:NextRequest){
 if(!trusted(req))return fail('Origem não autorizada.',403);const me=await user(req);if(!me)return fail('Sessão inválida.',401);const id=req.nextUrl.searchParams.get('id');if(!id||!/^\d+$/.test(id))return fail('Identificador inválido.',400);
 try{const sql=queryDB();await sql`DELETE FROM comexhub_simulation_history WHERE id=${id} AND user_id=${me.id}`;return NextResponse.json({ok:true},{headers:noStore})}catch{return fail('Falha ao excluir o relatório.',503)}
}

export async function PATCH(req:NextRequest){
 if(!trusted(req))return fail('Origem não autorizada.',403);const me=await user(req);if(!me)return fail('Sessão inválida.',401);
 const id=req.nextUrl.searchParams.get('id');if(!id||!/^\d+$/.test(id))return fail('Identificador inválido.',400);
 let report:unknown;try{const body=await req.text();if(body.length>80000)return fail('Relatório muito extenso.',413);report=JSON.parse(body)}catch{return fail('Relatório inválido.',400)}
 if(!isSimulationReport(report))return fail('Relatório inválido.',400);
 try{const sql=queryDB();const result=await sql`UPDATE comexhub_simulation_history SET report=${JSON.stringify(report)}::jsonb WHERE id=${id} AND user_id=${me.id} RETURNING id::text`;if(!result.length)return fail('Relatório não encontrado.',404);return NextResponse.json({ok:true,id:result[0].id},{headers:noStore})}catch{return fail('Falha ao atualizar o relatório.',503)}
}
