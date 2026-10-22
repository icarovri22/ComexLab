import {sessionCookieName} from './account-session';
import {createCipheriv,createDecipheriv,createHmac,createHash,randomBytes,timingSafeEqual} from 'node:crypto';
import {SignJWT,jwtVerify} from 'jose';
import {NextResponse} from 'next/server';

export const cookieName='comexlab_session';
export const challengeCookie='comexlab_mfa_challenge';
export const cookieOptions=(age:number)=>({httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax' as const,path:'/',maxAge:age});
const key=()=>new TextEncoder().encode(process.env.AUTH_SECRET!);
const sealedKey=()=>createHash('sha256').update('comexlab-totp-key-v1:').update(process.env.AUTH_SECRET!).digest();
export const canAuth=()=>Boolean(process.env.DATABASE_URL&&process.env.AUTH_SECRET&&process.env.AUTH_SECRET.length>=32);

export async function signSession(id:string,username:string,version:number,mfa:boolean,admin:boolean){
 const age=admin?12*3600:7*24*3600;
 return {token:await new SignJWT({username,sv:version,mfa}).setProtectedHeader({alg:'HS256'}).setSubject(id).setIssuedAt().setExpirationTime(`${age}s`).sign(key()),age};
}
export async function signChallenge(id:string,username:string,version:number){
 return new SignJWT({purpose:'mfa',username,sv:version}).setProtectedHeader({alg:'HS256'}).setSubject(id).setIssuedAt().setExpirationTime('5m').sign(key());
}
export async function verifyJwt(token:string|undefined){
 if(!token||!canAuth())return null;
 try{const {payload}=await jwtVerify(token,key(),{algorithms:['HS256']});
  if(typeof payload.sub!=='string'||!/^\d+$/.test(payload.sub))return null;
  return payload;
 }catch{return null}
}
export function setSession(res:NextResponse,session:{token:string;age:number},req?:Parameters<typeof sessionCookieName>[0]){
 const name=req?sessionCookieName(req):cookieName;if(!name)throw Error('Sessão de aba inválida.');
 res.cookies.set(name,session.token,cookieOptions(session.age));
 res.cookies.set(challengeCookie,'',cookieOptions(0));
}
export function clearSessions(res:NextResponse,req?:Parameters<typeof sessionCookieName>[0]){const name=req?sessionCookieName(req):cookieName;if(name)res.cookies.set(name,'',cookieOptions(0));res.cookies.set(challengeCookie,'',cookieOptions(0));}
export function randomRecoveryCode(){const s=randomBytes(12).toString('hex').toUpperCase();return s.match(/.{1,6}/g)!.join('-');}
export function randomMfaBackupCode(){return randomBytes(9).toString('hex').toUpperCase().match(/.{1,6}/g)!.join('-');}
export function normalizeCode(code:string){return code.toUpperCase().replace(/[^A-Z0-9]/g,'');}
export function recoveryHash(id:string,code:string,purpose:'recovery'|'backup'='recovery'){
 return createHmac('sha256',process.env.AUTH_SECRET!).update(`${purpose}:${id}:${normalizeCode(code)}`).digest('hex');
}
export function compareDigest(a:string,b:string){const x=Buffer.from(a,'hex'),y=Buffer.from(b,'hex');return x.length===y.length&&timingSafeEqual(x,y);}
const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export function toBase32(bytes:Buffer){let bits=0,value=0,result='';for(const b of bytes){value=(value<<8)|b;bits+=8;while(bits>=5){result+=alphabet[(value>>>(bits-=5))&31]}}if(bits>0)result+=alphabet[(value<<(5-bits))&31];return result;}
function fromBase32(value:string){let bits=0,acc=0;const out:number[]=[];for(const c of value.toUpperCase().replace(/\s|=|-/g,'')){const n=alphabet.indexOf(c);if(n<0)throw Error('Secret inválido');acc=(acc<<5)|n;bits+=5;if(bits>=8){out.push((acc>>>(bits-=8))&255)}}return Buffer.from(out);}
export function newTotpSecret(){return toBase32(randomBytes(20));}
export function encryptSecret(secret:string){const iv=randomBytes(12);const enc=createCipheriv('aes-256-gcm',sealedKey(),iv);const ciphertext=Buffer.concat([enc.update(secret,'utf8'),enc.final()]);return [iv,enc.getAuthTag(),ciphertext].map(x=>x.toString('base64url')).join('.');}
export function decryptSecret(sealed:string){const [iv,tag,data]=sealed.split('.');if(!iv||!tag||!data)throw Error('Segredo TOTP inválido');const dec=createDecipheriv('aes-256-gcm',sealedKey(),Buffer.from(iv,'base64url'));dec.setAuthTag(Buffer.from(tag,'base64url'));return Buffer.concat([dec.update(Buffer.from(data,'base64url')),dec.final()]).toString('utf8');}
export function totpForStep(secret:string,step:number){const input=Buffer.alloc(8);input.writeBigUInt64BE(BigInt(step));const output=createHmac('sha1',fromBase32(secret)).update(input).digest();const offset=output[19]&15;const value=(output.readUInt32BE(offset)&0x7fffffff)%1000000;return String(value).padStart(6,'0');}
export function verifyTotp(secret:string,code:string,previousStep=-1){if(!/^\d{6}$/.test(code))return null;const now=Math.floor(Date.now()/30000);for(let delta=-1;delta<=1;delta++){const step=now+delta;if(step>previousStep&&totpForStep(secret,step)===code)return step;}return null;}
