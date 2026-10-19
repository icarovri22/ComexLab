import {neon} from '@neondatabase/serverless';
import {verifyJwt} from './security';

export type AccountIdentity={id:string;username:string;role:string;is_active:true;session_version:number};
export type AdminIdentity=AccountIdentity & {role:'admin'};
export const queryDB=()=>neon(process.env.DATABASE_URL!);

export async function verifiedAccount(session:string|undefined):Promise<AccountIdentity|null>{
 const payload=await verifyJwt(session);
 if(!payload||payload.purpose||!process.env.DATABASE_URL)return null;
 try{
  const result=await queryDB()`SELECT id::text,username,role,is_active,session_version FROM comexlab_users WHERE id=${payload.sub} LIMIT 1`;
  if(result.length===0||result[0].is_active!==true||Number(result[0].session_version)!==Number(payload.sv??0))return null;
  return {id:String(result[0].id),username:String(result[0].username),role:String(result[0].role),is_active:true,session_version:Number(result[0].session_version)};
 }catch{return null;}
}
export async function verifiedAdmin(session:string|undefined):Promise<AdminIdentity|null>{
 const account=await verifiedAccount(session);
 return account?.role==='admin'?{...account,role:'admin'}:null;
}
export const noStore={'Cache-Control':'no-store'};
