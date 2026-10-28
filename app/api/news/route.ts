import {selectedSession} from '../../../lib/account-session';
import {NextRequest,NextResponse} from 'next/server';
import {queryDB,noStore,verifiedAccount} from '../../../lib/admin-auth';
import {newsMonth} from '../../../lib/news-period';
import {NEWS_CATEGORIES,COUNTRY_LABELS,isRelevantNews,plainText} from '../../../lib/comex-news';
import {synchronizeNews} from '../../../lib/news-sync';
export const runtime='nodejs';
export const maxDuration=60;
export async function GET(req:NextRequest){
 const user=await verifiedAccount(selectedSession(req));
 if(!user)return NextResponse.json({error:'Acesse sua conta para ler notícias.'},{status:401,headers:noStore});
 const params=req.nextUrl.searchParams;
 const category=params.get('category')||'all';const country=params.get('country')||'all';const term=(params.get('q')||'').trim().slice(0,80);
 const month=newsMonth();
 if(category!=='all'&&!(category in NEWS_CATEGORIES))return NextResponse.json({error:'Categoria inválida.'},{status:400,headers:noStore});
 if(country!=='all'&&!(country in COUNTRY_LABELS))return NextResponse.json({error:'País inválido.'},{status:400,headers:noStore});
 try{
  const db=queryDB();
  // Refresh on demand when the scheduled collection is older than six hours.
  const recent=await db`SELECT completed_at FROM comexlab_news_sync_runs WHERE completed_at IS NOT NULL ORDER BY id DESC LIMIT 1`;
  const last=recent[0]?.completed_at?new Date(String(recent[0].completed_at)).getTime():0;
  const newSources=await db`SELECT slug FROM comexlab_news_sources WHERE slug='ebc'`;
  if(!newSources.length||!Number.isFinite(last)||Date.now()-last>6*3600000){
   try{await synchronizeNews()}catch(error){console.error('News refresh unavailable',error instanceof Error?error.message:'unknown')}
  }
  const [news,lastSync,sources]=await Promise.all([
   db`SELECT id::text,title_pt AS title,summary_pt AS summary,title AS original_title,summary AS original_summary,source_slug,impact,category,countries,source_name,source_url,published_at,featured,translation_provider FROM comexlab_news
    WHERE status='published' AND source_slug IN ('mdic','ec','wto','ebc','ecb') AND published_at>=${month.start}::timestamptz AND published_at<${month.end}::timestamptz AND published_at<=NOW() AND translation_status='ready' AND title_pt IS NOT NULL AND (${category}='all' OR category=${category})
      AND (${country}='all' OR ${country}=ANY(countries))
      AND (${term}='' OR title_pt ILIKE ${'%'+term+'%'} OR summary_pt ILIKE ${'%'+term+'%'})
    ORDER BY published_at DESC,featured DESC NULLS LAST,id DESC LIMIT 300`,
   db`SELECT completed_at,status FROM comexlab_news_sync_runs WHERE completed_at IS NOT NULL ORDER BY id DESC LIMIT 1`,
   db`SELECT slug,name,website_url,last_success_at,last_checked_at,last_error FROM comexlab_news_sources WHERE is_enabled=true ORDER BY slug`
  ]);
  const relevant=news.filter(row=>isRelevantNews(String(row.original_title||''),String(row.original_summary||''),String(row.source_slug||''))).slice(0,80).map(({original_title,original_summary,source_slug,...row})=>({...row,title:plainText(String(row.title||''),240),summary:plainText(String(row.summary||''),700),impact:plainText(String(row.impact||''),1000)}));
  return NextResponse.json({news:relevant,lastSync:lastSync[0]||null,sources,month,limit:80},{headers:noStore});
 }catch(e){console.error('Public news read error',e instanceof Error?e.message:'unknown');return NextResponse.json({error:'Notícias temporariamente indisponíveis.'},{status:503,headers:noStore})}
}
