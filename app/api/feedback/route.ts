import {NextRequest,NextResponse} from 'next/server';
import {verifiedAccount,queryDB,noStore} from '../../../lib/admin-auth';
import {validateFeedback} from '../../../lib/feedback';

export const runtime='nodejs';
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:noStore});
function sameOrigin(req:NextRequest){
 const origin=req.headers.get('origin');
 if(!origin)return false;
 try{return new URL(origin).host===req.nextUrl.host}catch{return false}
}
const authenticated=(req:NextRequest)=>verifiedAccount(req.cookies.get('comexlab_session')?.value);

export async function GET(req:NextRequest){
 const account=await authenticated(req);
 if(!account)return fail('Entre na sua conta para consultar suas avaliações.',401);
 try{
  const sql=queryDB();
  const feedback=await sql`SELECT id::text,rating,suggestion,status,created_at FROM comexlab_feedback WHERE user_id=${account.id} ORDER BY created_at DESC LIMIT 15`;
  return NextResponse.json({feedback},{headers:noStore});
 }catch(e){console.error('My feedback read failed',e instanceof Error?e.message:'unknown');return fail('Não foi possível carregar suas avaliações.',503)}
}

export async function POST(req:NextRequest){
 if(!sameOrigin(req))return fail('Origem da requisição não autorizada.',403);
 const account=await authenticated(req);
 if(!account)return fail('Entre na sua conta para enviar sua avaliação.',401);
 let body:unknown;
 try{const raw=await req.text();if(raw.length>4000)return fail('Mensagem muito longa.',413);body=JSON.parse(raw)}catch{return fail('Dados da avaliação inválidos.',400)}
 const parsed=validateFeedback(body);
 if(!parsed.ok)return fail(parsed.error,400);
 const sql=queryDB();
 const {rating,suggestion}=parsed.value;
 try{
  // A quota e o intervalo mínimo são conferidos no servidor para reduzir spam.
  // Não expomos o histórico de outros usuários nesta rota.
  const inserted=await sql`INSERT INTO comexlab_feedback(user_id,rating,suggestion)
   SELECT ${account.id},${rating},${suggestion}
   WHERE (SELECT COUNT(*) FROM comexlab_feedback WHERE user_id=${account.id} AND created_at>NOW()-INTERVAL '24 hours') < 5
     AND NOT EXISTS(SELECT 1 FROM comexlab_feedback WHERE user_id=${account.id} AND created_at>NOW()-INTERVAL '60 seconds')
   RETURNING id::text,created_at`;
  if(!inserted.length)return fail('Aguarde pelo menos um minuto entre envios. São permitidas até 5 mensagens a cada 24 horas.',429);
  return NextResponse.json({ok:true,id:inserted[0].id},{status:201,headers:noStore});
 }catch(e){console.error('Feedback save failed',e instanceof Error?e.message:'unknown');return fail('Não foi possível salvar sua avaliação. Tente novamente.',503)}
}
