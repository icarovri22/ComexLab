import {NextRequest,NextResponse} from 'next/server';
import {queryDB,noStore,verifiedAccount} from '../../../lib/admin-auth';
import {NEWS_CATEGORIES,COUNTRY_LABELS} from '../../../lib/comex-news';
export const runtime='nodejs';
export async function GET(req:NextRequest){
 const user=await verifiedAccount(req.cookies.get('comexlab_session')?.value);
 if(!user)return NextResponse.json({error:'Acesse sua conta para ler notícias.'},{status:401,headers:noStore});
 const params=req.nextUrl.searchParams;
 const category=params.get('category')||'all';const country=params.get('country')||'all';const term=(params.get('q')||'').trim().slice(0,80);
 if(category!=='all'&&!(category in NEWS_CATEGORIES))return NextResponse.json({error:'Categoria inválida.'},{status:400,headers:noStore});
 if(country!=='all'&&!(country in COUNTRY_LABELS))return NextResponse.json({error:'País inválido.'},{status:400,headers:noStore});
 try{
  const db=queryDB();
  const [news,lastSync]=await Promise.all([
   db`SELECT id::text,title_pt AS title,summary_pt AS summary,impact,category,countries,source_name,source_url,published_at,featured,translation_provider FROM comexlab_news
    WHERE status='published' AND translation_status='ready' AND title_pt IS NOT NULL AND (${category}='all' OR category=${category})
      AND (${country}='all' OR ${country}=ANY(countries))
      AND (${term}='' OR title_pt ILIKE ${'%'+term+'%'} OR summary_pt ILIKE ${'%'+term+'%'})
    ORDER BY featured DESC,published_at DESC NULLS LAST,id DESC LIMIT 80`,
   db`SELECT completed_at,status FROM comexlab_news_sync_runs WHERE completed_at IS NOT NULL ORDER BY id DESC LIMIT 1`
  ]);
  return NextResponse.json({news,lastSync:lastSync[0]||null},{headers:noStore});
 }catch(e){console.error('Public news read error',e instanceof Error?e.message:'unknown');return NextResponse.json({error:'Notícias temporariamente indisponíveis.'},{status:503,headers:noStore})}
}
