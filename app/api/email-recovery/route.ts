import {NextRequest,NextResponse} from 'next/server';
import {hash} from 'bcryptjs';
import {queryDB,noStore} from '../../../lib/admin-auth';
import {randomRecoveryCode,recoveryHash,canAuth} from '../../../lib/security';
import {anonymousLimiterKey,CANONICAL_APP_ORIGIN,emailDeliveryReady,GENERIC_REQUEST_MESSAGE,hashEmailToken,isValidToken,newEmailToken,normalizeEmail,recoveryLink,RESET_TTL_MINUTES,sendRecoveryEmail,validEmail} from '../../../lib/email-reset';

export const runtime='nodejs';
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:noStore});
const validOrigin=(req:NextRequest)=>{const origin=req.headers.get('origin');if(!origin)return false;try{return new URL(origin).origin===req.nextUrl.origin}catch{return false}};
export async function GET(){return NextResponse.json({emailRecoveryEnabled:emailDeliveryReady(),passwordResetUrl:`${CANONICAL_APP_ORIGIN}/redefinir`},{headers:noStore})}
export async function POST(req:NextRequest){
 if(!validOrigin(req))return fail('Origem inválida.',403);
 if(!canAuth())return fail('Serviço indisponível.',503);
 let b:Record<string,unknown>;
 try{const raw=await req.text();if(raw.length>2500)return fail('Dados acima do limite.',413);b=JSON.parse(raw)}catch{return fail('Solicitação inválida.',400)}
 if(!b||typeof b!=='object')return fail('Solicitação inválida.',400);
 const mode=b.mode;
 if(mode==='request'){
  if(!emailDeliveryReady())return fail('Recuperação por e-mail ainda não está disponível. Use seu código pessoal de recuperação.',503);
  const email=normalizeEmail(typeof b.email==='string'?b.email:'');
  if(!validEmail(email))return fail('Informe um e-mail válido.',400);
  const ip=(req.headers.get('x-vercel-forwarded-for')||req.headers.get('x-real-ip')||'unknown').split(',')[0].trim();
  const secret=process.env.AUTH_SECRET!;
  const perEmail=anonymousLimiterKey('recover-mail',email,secret),perIP=anonymousLimiterKey('recover-ip',ip,secret);
  const sql=queryDB();
  try{
   const limits=await sql`SELECT username,COUNT(*)::int AS n FROM comexlab_login_attempts WHERE username IN (${perEmail},${perIP}) AND created_at > NOW() - INTERVAL '1 hour' GROUP BY username`;
   const map=new Map(limits.map(row=>[String(row.username),Number(row.n)]));
   if((map.get(perEmail)||0)>=3||(map.get(perIP)||0)>=12)return NextResponse.json({ok:true,message:GENERIC_REQUEST_MESSAGE},{headers:noStore});
   await sql`INSERT INTO comexlab_login_attempts (username) VALUES (${perEmail}),(${perIP})`;
   const users=await sql`SELECT id::text,email FROM comexlab_users WHERE email=${email} AND is_active=true LIMIT 1`;
   if(!users.length)return NextResponse.json({ok:true,message:GENERIC_REQUEST_MESSAGE},{headers:noStore});
   const userId=String(users[0].id),token=newEmailToken(),tokenHash=hashEmailToken(token,secret);
   await sql`INSERT INTO comexlab_email_reset_tokens (user_id,token_hash,expires_at) VALUES (${userId},${tokenHash},NOW()+INTERVAL '15 minutes')`;
   try{await sendRecoveryEmail(email,recoveryLink(token));}
   catch(error){await sql`DELETE FROM comexlab_email_reset_tokens WHERE token_hash=${tokenHash}`;
    console.error('Reset email delivery failed:',error instanceof Error?error.message:'unknown');
   }
   return NextResponse.json({ok:true,message:GENERIC_REQUEST_MESSAGE},{headers:noStore});
  }catch(error){console.error('Password reset email request failed:',error instanceof Error?error.message:'unknown');return fail('Não foi possível processar sua solicitação agora.',503)}
 }
 const token=typeof b.token==='string'?b.token:'';
 if(!isValidToken(token))return fail('Link inválido ou incompleto. Solicite outro e-mail.',400);
 const secret=process.env.AUTH_SECRET!,tokenHash=hashEmailToken(token,secret);
 const sql=queryDB();
 if(mode==='validate'){
  try{const rows=await sql`SELECT 1 FROM comexlab_email_reset_tokens t JOIN comexlab_users u ON u.id=t.user_id WHERE t.token_hash=${tokenHash} AND t.used_at IS NULL AND t.expires_at>NOW() AND u.is_active=true LIMIT 1`;
   return NextResponse.json({valid:rows.length>0},{headers:noStore})}
  catch{return fail('Não foi possível verificar o link.',503)}
 }
 if(mode==='reset'){
  const password=typeof b.password==='string'?b.password:'';
  if(password.length<10||Buffer.byteLength(password,'utf8')>72)return fail('Sua nova senha precisa ter entre 10 caracteres e 72 bytes.',400);
  try{
   const hashed=await hash(password,12);
   const rows=await sql`WITH consumed AS (
     UPDATE comexlab_email_reset_tokens t SET used_at=NOW()
     WHERE t.token_hash=${tokenHash} AND t.used_at IS NULL AND t.expires_at>NOW()
       AND EXISTS (SELECT 1 FROM comexlab_users u WHERE u.id=t.user_id AND u.is_active=true)
     RETURNING t.user_id
    ), changed AS (
     UPDATE comexlab_users u SET password_hash=${hashed}, session_version=u.session_version+1,
       recovery_code_hash=NULL
     FROM consumed c WHERE u.id=c.user_id RETURNING u.id::text
    ) SELECT id FROM changed`;
   if(!rows.length)return fail('Este link expirou ou já foi utilizado. Solicite outro e-mail.',410);
   const userId=String(rows[0].id);
   await sql`UPDATE comexlab_email_reset_tokens SET used_at=NOW() WHERE user_id=${userId} AND used_at IS NULL`;
   // Existing personal recovery codes are revoked when the password changes by e-mail.
   return NextResponse.json({ok:true,message:'Senha alterada. Agora você pode entrar com sua nova senha.'},{headers:noStore});
  }catch(error){console.error('Password reset by email failed:',error instanceof Error?error.message:'unknown');return fail('Não foi possível redefinir a senha.',503)}
 }
 return fail('Ação desconhecida.',400);
}
