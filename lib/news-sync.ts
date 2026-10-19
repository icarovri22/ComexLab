import {queryDB} from './admin-auth';
import {classifyNews,parseOfficialFeed,cleanArticleUrl} from './comex-news';
import {translatePendingNews} from './news-translation';

const ALLOWED_FEEDS:Record<string,{url:string;allowedHosts:string[]}>= {
 mdic:{url:'https://www.gov.br/mdic/pt-br/assuntos/noticias/RSS',allowedHosts:['gov.br']},
 wto:{url:'https://www.wto.org/library/rss/latest_news_e.xml',allowedHosts:['wto.org']},
 ec:{url:'https://policy.trade.ec.europa.eu/node/2/rss_en',allowedHosts:['europa.eu']}
};
export async function synchronizeNews(){
 const sql=queryDB();
 const deadline=Date.now()+48_000;
 // Atomic lease avoids overlapping cron and admin runs, even from different workers.
 const acquired=await sql`UPDATE comexlab_news_sync_lock SET leased_until=NOW()+INTERVAL '4 minutes' WHERE id=1 AND leased_until<NOW() RETURNING id`;
 if(!acquired.length)return {alreadyRunning:true,added:0,checked:0,failures:0};
 let runId:string|undefined;
 let checked=0,added=0,failures=0;
 const errors:string[]=[];
 try{
  const run=await sql`INSERT INTO comexlab_news_sync_runs(status) VALUES('running') RETURNING id::text`;
  runId=String(run[0].id);
  const sources=await sql`SELECT slug,name FROM comexlab_news_sources WHERE is_enabled=true ORDER BY slug`;
  for(const source of sources){
   const slug=String(source.slug);const safe=ALLOWED_FEEDS[slug];if(!safe)continue;
   checked++;
   try{
    // Follow only approved HTTPS redirects, never arbitrary hosts or private networks.
    let target=safe.url;
    let response:Response|undefined;
    for(let hop=0;hop<=3;hop++){
     const remaining=deadline-Date.now();if(remaining<1500)throw Error('Consulta adiada para respeitar o tempo máximo');
     response=await fetch(target,{headers:{'Accept':'application/rss+xml,application/atom+xml,application/xml,text/xml;q=0.9','User-Agent':'ComexHub-News/1.7 (+https://comexhub-app.vercel.app/noticias)'},redirect:'manual',signal:AbortSignal.timeout(Math.min(9000,deadline-Date.now())),cache:'no-store'});
     if(![301,302,303,307,308].includes(response.status))break;
     const location=response.headers.get('location');
     if(hop===3||!location)throw Error('Redirecionamento não permitido');
     const next=new URL(location,target).toString();
     if(!cleanArticleUrl(next,safe.allowedHosts))throw Error('Redirecionamento para fonte não autorizada');
     target=next;
    }
    if(!response?.ok)throw Error('Resposta HTTP '+(response?.status||0));
    const length=Number(response.headers.get('content-length')||'0');if(length>900_000)throw Error('Feed excede tamanho máximo');
    const xml=await response.text();
    const items=parseOfficialFeed(xml,safe.allowedHosts);
    if(!items.length)throw Error('Nenhum item recente e válido no feed');
    for(const article of items){
     if(Date.now()>deadline-4000)break;
     const metadata=classifyNews(article.title,article.description,slug);
     const countries=metadata.countries.join(',');
     const inPortuguese=slug==='mdic';
     const inserted=await sql`INSERT INTO comexlab_news(source_slug,source_name,source_url,title,summary,impact,category,countries,published_at,status,title_pt,summary_pt,translation_status,translation_provider,translated_at)
       VALUES(${slug},${source.name},${article.url},${article.title},${article.description},${metadata.impact},${metadata.category},string_to_array(${countries},','),${article.publishedAt},'published',${inPortuguese?article.title:null},${inPortuguese?article.description:null},${inPortuguese?'ready':'pending'},${inPortuguese?'original-pt':null},${inPortuguese?new Date().toISOString():null})
       ON CONFLICT(source_url) DO NOTHING RETURNING id`;
     if(inserted.length)added++;
    }
    await sql`UPDATE comexlab_news_sources SET last_checked_at=NOW(),last_success_at=NOW(),last_error=NULL WHERE slug=${slug}`;
   }catch(err){
    failures++;const error=err instanceof Error?err.message:'Falha desconhecida';errors.push(slug+': '+error.slice(0,135));
    await sql`UPDATE comexlab_news_sources SET last_checked_at=NOW(),last_error=${error.slice(0,220)} WHERE slug=${slug}`;
   }
  }
  let translations={translated:0,failed:0,quotaExhausted:false};
  try{translations=await translatePendingNews(sql,deadline)}catch(err){errors.push('Tradução: '+(err instanceof Error?err.message:'erro desconhecido').slice(0,125));}
  const state=failures===0?'ok':failures===checked?'error':'partial';
  const translationNote=`Traduções para português: ${translations.translated}; aguardando: ${translations.failed}${translations.quotaExhausted?' (limite diário atingido)':''}`;
  await sql`UPDATE comexlab_news_sync_runs SET completed_at=NOW(),status=${state},sources_checked=${checked},items_added=${added},details=${[...errors,translationNote].join(' | ').slice(0,1200)} WHERE id=${runId}`;
  return {added,checked,failures,errors,...translations};
 }catch(e){
  if(runId)await sql`UPDATE comexlab_news_sync_runs SET completed_at=NOW(),status='error',sources_checked=${checked},items_added=${added},details=${String(e).slice(0,800)} WHERE id=${runId}`;
  throw e;
 }finally{
  await sql`UPDATE comexlab_news_sync_lock SET leased_until=NOW() WHERE id=1`;
 }
}
