import {selectedSession} from '../../../lib/account-session';
import {NextRequest,NextResponse} from 'next/server';
import {compare,hash} from 'bcryptjs';
import {queryDB,verifiedAccount,noStore} from '../../../lib/admin-auth';
import {canAuth,randomRecoveryCode,recoveryHash,setSession,signSession} from '../../../lib/security';
import {normalizeEmail,validEmail} from '../../../lib/email-reset';

export const runtime='nodejs';
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:noStore});
const validateOrigin=(req:NextRequest)=>{const origin=req.headers.get('origin');if(!origin)return false;try{return new URL(origin).host===req.nextUrl.host}catch{return false}};
const getActor=(req:NextRequest)=>verifiedAccount(selectedSession(req));

export async function GET(req:NextRequest){
 const account=await getActor(req);if(!account)return fail('Entre na sua conta.',401);
 const sql=queryDB();
 try{
  const recovery=await sql`SELECT recovery_code_hash IS NOT NULL AS configured,email, security_reminder_seen_on IS DISTINCT FROM (NOW() AT TIME ZONE 'America/Fortaleza')::date AS show_security_reminder FROM comexlab_users WHERE id=${account.id}`;
  return NextResponse.json({username:account.username,isAdminAccount:account.role==='admin',recoveryEnabled:recovery[0]?.configured===true,email:recovery[0]?.email||null,showSecurityReminder:recovery[0]?.show_security_reminder===true},{headers:noStore});
 }catch{return fail('Falha ao carregar a segurança da conta.',503)}
}
export async function POST(req:NextRequest){
 if(!validateOrigin(req))return fail('Origem não autorizada.',403);
 if(!canAuth())return fail('Serviço indisponível.',503);
 const account=await getActor(req);if(!account)return fail('Entre na sua conta novamente.',401);
 let b:Record<string,unknown>;
 try{const raw=await req.text();if(raw.length>6000)return fail('Dados acima do limite.',413);b=JSON.parse(raw)}catch{return fail('Solicitação inválida.',400)}
 if(!b||typeof b!=='object')return fail('Solicitação inválida.',400);
 const mode=b.mode;
 if(mode!=='recovery.rotate'&&mode!=='password.change'&&mode!=='email.add'&&mode!=='reminder.claim')return fail('Ação desconhecida.',400);
 const sql=queryDB();
 try{
  if(mode==='reminder.claim'){
   // Atomically claim the daily warning for this account, independent of browser/device.
   const updated=await sql`UPDATE comexlab_users SET security_reminder_seen_on=(NOW() AT TIME ZONE 'America/Fortaleza')::date WHERE id=${account.id} AND security_reminder_seen_on IS DISTINCT FROM (NOW() AT TIME ZONE 'America/Fortaleza')::date RETURNING id`;
   return NextResponse.json({show:updated.length>0},{headers:noStore});
  }
  const password=typeof b.password==='string'?b.password:'';
  const users=await sql`SELECT password_hash FROM comexlab_users WHERE id=${account.id} LIMIT 1`;
  if(!users.length||!await compare(password,String(users[0].password_hash)))return fail('Senha atual incorreta.',401);
  if(mode==='email.add'){
   const email=normalizeEmail(typeof b.email==='string'?b.email:'');
   if(!validEmail(email))return fail('Informe um e-mail válido.',400);
   const existing=await sql`SELECT email FROM comexlab_users WHERE id=${account.id} LIMIT 1`;
   if(existing[0]?.email)return fail('Esta conta já possui um e-mail. Para alterá-lo, será necessária uma verificação específica.',409);
   const updated=await sql`UPDATE comexlab_users SET email=${email} WHERE id=${account.id} AND email IS NULL RETURNING id`;
   if(!updated.length)return fail('Não foi possível vincular o endereço.',409);
   return NextResponse.json({ok:true,message:'E-mail vinculado. Confirme que foi digitado corretamente.'},{headers:noStore});
  }
  if(mode==='recovery.rotate'){
   const recoveryCode=randomRecoveryCode();await sql`UPDATE comexlab_users SET recovery_code_hash=${recoveryHash(account.id,recoveryCode)} WHERE id=${account.id}`;
   return NextResponse.json({ok:true,recoveryCode},{headers:noStore});
  }
  const replacement=typeof b.newPassword==='string'?b.newPassword:'';
  if(replacement.length<10||Buffer.byteLength(replacement,'utf8')>72)return fail('A nova senha deve ter pelo menos 10 caracteres e até 72 bytes.',400);
  if(replacement===password)return fail('Escolha uma senha diferente da anterior.',400);
  const passwordHash=await hash(replacement,12);
  const saved=await sql`UPDATE comexlab_users SET password_hash=${passwordHash},session_version=session_version+1 WHERE id=${account.id} RETURNING session_version`;
  const session=await signSession(account.id,account.username,Number(saved[0].session_version),false,account.role==='admin');
  const r=NextResponse.json({ok:true},{headers:noStore});setSession(r,session,req);return r;
 }catch(error){console.error('Security update failed:',error instanceof Error?error.message:'unknown');return fail('Não foi possível concluir a operação.',503)}
}
