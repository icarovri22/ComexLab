import {selectedSession} from '../../../lib/account-session';
import {NextRequest,NextResponse} from 'next/server';
import {verifiedAccount,queryDB,noStore} from '../../../lib/admin-auth';
import {AI_INSTRUCTIONS,AI_MODEL_DEFAULT,answerFromResponse,clampDailyLimit,validateQuestion,validRating} from '../../../lib/comex-ai';

export const runtime='nodejs';
export const maxDuration=60;
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:noStore});
// Keep AI disabled in this release, regardless of deployment environment.
const AI_UNDER_MAINTENANCE = true;
const sameOrigin=(req:NextRequest)=>{const o=req.headers.get('origin');if(!o)return false;try{return new URL(o).host===req.nextUrl.host}catch{return false}};
async function settings(){const db=queryDB();const rows=await db`SELECT key,value FROM comexlab_settings WHERE key IN ('ai_enabled','ai_daily_limit')`;const vals=new Map(rows.map(r=>[String(r.key),String(r.value)]));return {enabled:vals.get('ai_enabled')!=='false',dailyLimit:clampDailyLimit(vals.get('ai_daily_limit')||10),configured:Boolean(process.env.OPENAI_API_KEY?.trim())};}

export async function GET(req:NextRequest){
 if(AI_UNDER_MAINTENANCE)return fail('ComexHub IA temporariamente indisponível para manutenção.',503);
 const me=await verifiedAccount(selectedSession(req));if(!me)return fail('Faça login para usar a ComexHub IA.',401);
 try{
  const db=queryDB();const [cfg,history,usage]=await Promise.all([settings(),
   db`SELECT id::text,prompt,answer,rating,created_at FROM comexlab_ai_questions WHERE user_id=${me.id} AND status='complete' ORDER BY created_at DESC LIMIT 25`,
   db`SELECT COUNT(*)::int AS used FROM comexlab_ai_questions WHERE user_id=${me.id} AND day_utc=(NOW() AT TIME ZONE 'UTC')::date`]);
  return NextResponse.json({enabled:cfg.enabled,configured:cfg.configured,available:cfg.enabled&&cfg.configured,dailyLimit:cfg.dailyLimit,used:Number(usage[0]?.used||0),reset:'00:00 UTC',history:[...history].reverse()},{headers:noStore});
 }catch(e){console.error('AI status error',e instanceof Error?e.message:'unknown');return fail('Serviço temporariamente indisponível.',503)}
}
export async function POST(req:NextRequest){
 if(AI_UNDER_MAINTENANCE)return fail('ComexHub IA temporariamente indisponível para manutenção.',503);
 if(!sameOrigin(req))return fail('Origem da solicitação inválida.',403);
 const me=await verifiedAccount(selectedSession(req));if(!me)return fail('Faça login para conversar com a IA.',401);
 let data:Record<string,unknown>;try{const raw=await req.text();if(raw.length>3200)return fail('Mensagem acima do limite.',413);data=JSON.parse(raw);}catch{return fail('Mensagem inválida.',400)}
 if(!data||typeof data!=='object')return fail('Dados inválidos.',400);
 const db=queryDB();
 if(data.action==='rate'){
  const id=String(data.id||'');if(!/^\d{1,22}$/.test(id)||!validRating(data.rating))return fail('Avaliação inválida.',400);
  const rating=data.rating;
  try{const rows=await db`UPDATE comexlab_ai_questions SET rating=${rating} WHERE id=${id} AND user_id=${me.id} AND status='complete' RETURNING id`;
   if(!rows.length)return fail('Resposta não encontrada.',404);return NextResponse.json({ok:true},{headers:noStore});
  }catch{return fail('Não foi possível salvar a avaliação.',503)}
 }
 if(data.action!=='ask')return fail('Ação inválida.',400);
 const question=validateQuestion(data.question);if(!question)return fail('Digite uma pergunta entre 3 e 1.800 caracteres.',400);
 let cfg;
 try{cfg=await settings()}catch{return fail('Não foi possível consultar as configurações da IA.',503)}
 if(!cfg.enabled)return fail('A ComexHub IA foi temporariamente desativada pela administração.',503);
 if(!cfg.configured)return fail('Aguardando a configuração segura da chave da API de IA.',503);
 // Atomic per-user-per-UTC-day quota: unique slot allocations prevent exceeding the configured daily limit.
 let reserved;
 try{const rows=await db`INSERT INTO comexlab_ai_questions(user_id,day_utc,daily_slot,prompt)
  SELECT ${me.id},(NOW() AT TIME ZONE 'UTC')::date,s.slot,${question}
  FROM generate_series(1,${cfg.dailyLimit}) AS s(slot)
  WHERE NOT EXISTS (SELECT 1 FROM comexlab_ai_questions q WHERE q.user_id=${me.id} AND q.day_utc=(NOW() AT TIME ZONE 'UTC')::date AND q.daily_slot=s.slot)
  ORDER BY s.slot LIMIT 1 ON CONFLICT(user_id,day_utc,daily_slot) DO NOTHING RETURNING id::text`;
  reserved=rows[0]?.id as string|undefined;
  if(!reserved)return fail('Seu limite diário foi atingido. Novas perguntas estarão disponíveis após 00h UTC.',429);
 }catch(e){console.error('AI quota error',e instanceof Error?e.message:'unknown');return fail('Não foi possível reservar sua pergunta. Tente novamente.',503)}
 const id=reserved;
 try{
  const prior=await db`SELECT prompt,answer FROM comexlab_ai_questions WHERE user_id=${me.id} AND status='complete' AND id<>${id} ORDER BY created_at DESC LIMIT 4`;
  const input=[...prior].reverse().flatMap(x=>[{role:'user',content:String(x.prompt).slice(0,1800)},{role:'assistant',content:String(x.answer||'').slice(0,3200)}]).concat([{role:'user',content:question}]);
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),40000);
  let response:Response;
  try{response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Authorization':`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_MODEL||AI_MODEL_DEFAULT,instructions:AI_INSTRUCTIONS,input,max_output_tokens:750,store:false,reasoning:{effort:'none'}}),signal:controller.signal,cache:'no-store'});}finally{clearTimeout(timeout)}
  if(!response.ok){console.error('AI provider HTTP',response.status);throw new Error('provider_unavailable')}
  const parsed=await response.json();const answer=answerFromResponse(parsed);
  if(!answer)throw new Error('empty_model_response');
  const inputTokens=Math.max(0,Number(parsed.usage?.input_tokens)||0),outputTokens=Math.max(0,Number(parsed.usage?.output_tokens)||0);
  await db`UPDATE comexlab_ai_questions SET answer=${answer},status='complete',input_tokens=${inputTokens},output_tokens=${outputTokens} WHERE id=${id} AND user_id=${me.id}`;
  const usage=await db`SELECT COUNT(*)::int AS used FROM comexlab_ai_questions WHERE user_id=${me.id} AND day_utc=(NOW() AT TIME ZONE 'UTC')::date`;
  return NextResponse.json({ok:true,id,answer,used:Number(usage[0]?.used||0),dailyLimit:cfg.dailyLimit},{headers:noStore});
 }catch(e){console.error('AI response error',e instanceof Error?e.message:'unknown');
  try{await db`DELETE FROM comexlab_ai_questions WHERE id=${id} AND user_id=${me.id} AND status='pending'`}catch{};
  return fail('A IA não conseguiu responder agora. A pergunta não será descontada caso a solicitação tenha falhado. Tente novamente.',503)}
}
