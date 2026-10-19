import {NextRequest,NextResponse} from 'next/server';
import {compare,hash} from 'bcryptjs';
import {queryDB,verifiedAccount,noStore} from '../../../lib/admin-auth';
import {canAuth,clearSessions,cookieName,randomRecoveryCode,recoveryHash,setSession,signSession} from '../../../lib/security';

export const runtime='nodejs';
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:noStore});
const usernameOk=(s:string)=>/^[a-z0-9._-]{3,24}$/.test(s);
const emailOk=(s:string)=>s.length<=254&&s.length>=5&&/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
const readIP=(req:NextRequest)=>req.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()||req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'anonymous';
async function allowedAttempt(label:string,limit:number,minutes:number){const sql=queryDB();const rows=await sql`SELECT COUNT(*)::int AS count FROM comexlab_login_attempts WHERE username=${label} AND created_at>NOW()-(${minutes}::int * INTERVAL '1 minute')`;return Number(rows[0]?.count||0)<limit;}
async function logAttempt(label:string){const sql=queryDB();await sql`INSERT INTO comexlab_login_attempts(username) VALUES (${label})`;}
async function clearAttempts(label:string){const sql=queryDB();await sql`DELETE FROM comexlab_login_attempts WHERE username=${label}`;}

export async function GET(req:NextRequest){
 if(!canAuth())return NextResponse.json({ready:false,loggedIn:false,emailConfirmation:false},{headers:noStore});
 const me=await verifiedAccount(req.cookies.get(cookieName)?.value);
 return NextResponse.json({ready:true,loggedIn:Boolean(me),username:me?.username,isAdmin:me?.role==='admin',emailConfirmation:false},{headers:noStore});
}
export async function POST(req:NextRequest){
 const origin=req.headers.get('origin');
 if(!origin)return fail('Origem da requisição obrigatória.',403);
 try{if(new URL(origin).host!==req.nextUrl.host)return fail('Origem não autorizada.',403)}catch{return fail('Origem inválida.',403)}
 let body:Record<string,unknown>;
 try{const raw=await req.text();if(raw.length>5000)return fail('Requisição muito grande.',413);body=JSON.parse(raw);}catch{return fail('Requisição inválida.',400)}
 if(!body||typeof body!=='object')return fail('Requisição inválida.',400);
 if(body.mode==='logout'){const r=NextResponse.json({ok:true},{headers:noStore});clearSessions(r);return r;}
 if(!canAuth())return fail('Serviço de contas indisponível.',503);
 const sql=queryDB();
 if(body.mode!=='register'&&body.mode!=='login')return fail('Operação inválida.',400);
 const identity=typeof body.username==='string'?body.username.trim().toLowerCase():'';
 const password=typeof body.password==='string'?body.password:'';
 if(password.length<10||Buffer.byteLength(password,'utf8')>72)return fail('A senha deve ter ao menos 10 caracteres e até 72 bytes.',400);
 try{
  if(body.mode==='register'){
   const email=typeof body.email==='string'?body.email.trim().toLowerCase():'';
   if(!usernameOk(identity))return fail('O usuário deve ter 3 a 24 caracteres, sem espaços.',400);
   if(!emailOk(email))return fail('Informe um e-mail válido.',400);
   const ipKey=`register:${readIP(req)}`;
   if(!await allowedAttempt(ipKey,5,30))return fail('Muitos cadastros. Tente novamente mais tarde.',429);
   await logAttempt(ipKey);
   const passwordHash=await hash(password,12);
   const created=await sql`INSERT INTO comexlab_users(username,email,password_hash) VALUES(${identity},${email},${passwordHash}) ON CONFLICT DO NOTHING RETURNING id::text,session_version`;
   if(!created.length)return fail('Nome de usuário ou e-mail já cadastrado.',409);
   const id=String(created[0].id);const recoveryCode=randomRecoveryCode();
   await sql`UPDATE comexlab_users SET recovery_code_hash=${recoveryHash(id,recoveryCode)} WHERE id=${id}`;
   const session=await signSession(id,identity,0,false,false);
   const r=NextResponse.json({ok:true,username:identity,recoveryCode,emailConfirmation:false},{headers:noStore});setSession(r,session);return r;
  }
  if(!(usernameOk(identity)||emailOk(identity)))return fail('Informe seu usuário ou e-mail.',400);
  const identityKey=`login:${identity}`,ipKey=`login-ip:${readIP(req)}`;
  if(!await allowedAttempt(identityKey,6,15)||!await allowedAttempt(ipKey,40,15))return fail('Muitas tentativas. Aguarde 15 minutos.',429);
  const users=await sql`SELECT id::text,username,password_hash,role,is_active,session_version FROM comexlab_users WHERE username=${identity} OR email=${identity} LIMIT 1`;
  const accepted=users.length>0&&await compare(password,String(users[0].password_hash));
  if(!accepted){await logAttempt(identityKey);await logAttempt(ipKey);return fail('Usuário, e-mail ou senha incorretos.',401)}
  if(users[0].is_active!==true)return fail('Esta conta está desativada.',403);
  await clearAttempts(identityKey);
  const session=await signSession(String(users[0].id),String(users[0].username),Number(users[0].session_version),false,users[0].role==='admin');
  const r=NextResponse.json({ok:true,username:users[0].username},{headers:noStore});setSession(r,session);return r;
 }catch(error){console.error('Authentication unavailable:',error instanceof Error?error.message:'unknown');return fail('Não foi possível concluir o acesso.',503)}
}
