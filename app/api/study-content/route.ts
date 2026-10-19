import {NextResponse} from 'next/server';
import {queryDB,noStore} from '../../../lib/admin-auth';
export const runtime='nodejs';
export async function GET(){
 try{
  const rows=await queryDB()`SELECT slug,content FROM comexlab_study_overrides WHERE is_published=true`;
  const overrides:Record<string,unknown>={};
  for(const row of rows)overrides[String(row.slug)]=row.content;
  return NextResponse.json({overrides},{headers:noStore});
 }catch{return NextResponse.json({overrides:{},unavailable:true},{headers:noStore});}
}
