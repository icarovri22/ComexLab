import {NextResponse} from 'next/server';
import {queryDB,noStore} from '../../../lib/admin-auth';
export const runtime='nodejs';
export async function GET(){
 try{
  const data=await queryDB()`SELECT value FROM comexlab_settings WHERE key='announcement' LIMIT 1`;
  return NextResponse.json({announcement:String(data[0]?.value||'')},{headers:noStore});
 }catch{return NextResponse.json({announcement:''},{headers:noStore});}
}
