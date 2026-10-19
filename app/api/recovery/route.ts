import {NextRequest,NextResponse} from 'next/server';
import {hash} from 'bcryptjs';
import {queryDB,noStore} from '../../../lib/admin-auth';
import {canAuth,randomRecoveryCode,recoveryHash} from '../../../lib/security';
export const runtime='nodejs';
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:noStore});
export async function POST(req:NextRequest){
 const origin=req.headers.get('origin');
 if(!origin)return fail('Origem obrigatória.',403);
 try{if(new URL(origin).host!==req.nextUrl.host)return fail('Origem não autorizada.',403)}catch{return fail('Origem inválida.',403)}
 if(!canAuth())return fail('Serviço indisponível.',503);
 let b:Record<string,unknown>;
 try{const raw=await req.text();if(raw.length>2500)return fail('Requisição muito grande.',413);b=JSON.parse(raw)}catch{return fail('Requisição inválida.',400)}
 const identity=typeof b?.identity==='string'?b.identity.trim().toLowerCase():'';
 const code=typeof b?.code==='string'?b.code.trim():'';
 const password=typeof b?.password==='string'?b.password:'';
 if(identity.length<3||identity.length>254||!(/^[a-z0-9._-]{3,24}$/.test(identity)||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identity)))return fail('Informe usuário ou e-mail válido.',400);
 if(!/^[A-Fa-f0-9\-]{24,35}$/.test(code))return fail('Código de recuperação inválido.',400);
 if(password.length<10||Buffer.byteLength(password,'utf8')>72)return fail('Nova senha deve ter no mínimo 10 caracteres e até 72 bytes.',400);
 const sql=queryDB();const attempt=`recover:${identity}`;
 try{
  const seen=await sql`SELECT COUNT(*)::int AS attempts FROM comexlab_login_attempts WHERE username=${attempt} AND created_at>NOW()-INTERVAL '15 minutes'`;
  if(Number(seen[0]?.attempts||0)>=6)return fail('Muitas tentativas. Aguarde 15 minutos.',429);
  const users=await sql`SELECT id::text,recovery_code_hash,is_active FROM comexlab_users WHERE username=${identity} OR email=${identity} LIMIT 1`;
  const ok=users.length>0&&users[0].is_active===true&&typeof users[0].recovery_code_hash==='string'&&recoveryHash(String(users[0].id),code)===String(users[0].recovery_code_hash);
  if(!ok){await sql`INSERT INTO comexlab_login_attempts(username) VALUES(${attempt})`;return fail('Identificação ou código de recuperação incorreto.',401)}
  const newHash=await hash(password,12);const nextCode=randomRecoveryCode();const userId=String(users[0].id);
  const updated=await sql`UPDATE comexlab_users SET password_hash=${newHash},recovery_code_hash=${recoveryHash(userId,nextCode)},session_version=session_version+1 WHERE id=${userId} AND recovery_code_hash=${String(users[0].recovery_code_hash)} RETURNING id`;
  if(!updated.length)return fail('Código já utilizado. Inicie novamente.',409);
  await sql`DELETE FROM comexlab_login_attempts WHERE username=${attempt}`;
  return NextResponse.json({ok:true,recoveryCode:nextCode,message:'Senha redefinida. Salve seu novo código de recuperação.'},{headers:noStore});
 }catch(error){console.error('Recovery failed:',error instanceof Error?error.message:'unknown');return fail('Não foi possível redefinir a senha no momento.',503)}
}
