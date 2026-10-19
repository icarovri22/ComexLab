import {createHash,createHmac,randomBytes,timingSafeEqual} from 'node:crypto';

export const RESET_TTL_MINUTES=15;
export const CANONICAL_APP_ORIGIN='https://comexhub-app.vercel.app';
export const GENERIC_REQUEST_MESSAGE='Se houver uma conta com esse e-mail, enviaremos um link de recuperação. Confira também a pasta de spam.';
const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const normalizeEmail=(value:string)=>value.trim().toLowerCase();
export const validEmail=(email:string)=>email.length>=5&&email.length<=254&&emailPattern.test(email);
export const newEmailToken=()=>randomBytes(32).toString('hex');
export const hashEmailToken=(token:string,secret:string)=>createHmac('sha256',secret).update('email-reset-v1:'+token).digest('hex');
export const isValidToken=(token:string)=>/^[0-9a-f]{64}$/.test(token);
export const secureEqualHex=(a:string,b:string)=>{if(!/^[0-9a-f]{64}$/.test(a)||!/^[0-9a-f]{64}$/.test(b))return false;return timingSafeEqual(Buffer.from(a,'hex'),Buffer.from(b,'hex'));};
export const anonymousLimiterKey=(type:string,value:string,secret:string)=>`${type}:${createHmac('sha256',secret).update(value).digest('hex')}`;
export function recoveryLink(token:string,origin=CANONICAL_APP_ORIGIN){
 if(!isValidToken(token))throw new Error('Invalid email recovery token');
 const u=new URL(origin);
 if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash||u.pathname!=='/'||!u.hostname)throw new Error('Invalid application origin');
 return `${u.origin}/redefinir?token=${encodeURIComponent(token)}`;
}
export const emailDeliveryReady=()=>Boolean(process.env.RESEND_API_KEY?.startsWith('re_')&&process.env.EMAIL_FROM&&/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(process.env.EMAIL_FROM)&&process.env.AUTH_SECRET);
export function emailBody(link:string){
 const txt=`Você solicitou a recuperação da senha do ComexHub.\n\nAbra este link para criar uma nova senha:\n${link}\n\nO link vence em 15 minutos e só pode ser utilizado uma vez. Se não solicitou a alteração, ignore esta mensagem.\n\nComexHub · Hanna Roncel e Ícaro Pinheiro`;
 const html=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"></head><body style="font-family:Arial,sans-serif;background:#f3f8ff;padding:26px"><main style="max-width:520px;margin:auto;padding:26px;background:#fff;border-radius:12px"><h1 style="color:#123b73">Recuperação de senha · ComexHub</h1><p>Recebemos uma solicitação para redefinir sua senha.</p><p><a href="${link}" style="display:inline-block;background:#1769b5;color:#fff;padding:13px 20px;text-decoration:none;border-radius:8px">Criar uma nova senha</a></p><p>O link é válido por <strong>15 minutos</strong> e pode ser usado apenas uma vez.</p><p>Se não fez a solicitação, ignore este e-mail.</p><small>ComexHub · Hanna Roncel e Ícaro Pinheiro</small></main></body></html>`;
 return {text:txt,html};
}
export async function sendRecoveryEmail(to:string,link:string,fetcher:typeof fetch=fetch){
 if(!emailDeliveryReady())throw new Error('Transactional e-mail is not configured');
 const {text,html}=emailBody(link);
 const response=await fetcher('https://api.resend.com/emails',{
  method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},
  body:JSON.stringify({from:`ComexHub <${process.env.EMAIL_FROM}>`,to:[to],subject:'Redefinição de senha — ComexHub',text,html}),
  cache:'no-store',signal:AbortSignal.timeout(10000)
 });
 if(!response.ok)throw new Error(`E-mail service returned HTTP ${response.status}`);
 const result:unknown=await response.json();
 if(!result||typeof result!=='object'||!('id' in result)||typeof result.id!=='string')throw new Error('E-mail service did not confirm message acceptance');
 return result.id;
}
