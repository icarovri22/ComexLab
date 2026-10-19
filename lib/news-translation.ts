/** Public official-feed excerpts translated to Brazilian Portuguese with a bounded provider quota.
 * The original title/summary are never overwritten. No API credential is stored client-side.
 * Untranslated foreign news remain hidden publicly until reviewed or translated.
 */
import {plainText} from './comex-news';

export const MAX_DAILY_TRANSLATION_CHARS = 4300;
export const MAX_TRANSLATIONS_PER_SYNC = 6;
export const TRANSLATION_REQUEST_TIMEOUT_MS = 4200;

export function translationInput(input: string, maxBytes = 470): string {
  const cleaned=plainText(input,700).replace(/&nbsp;/gi,' ').trim();
  let result='';
  for(const char of cleaned){
    if(Buffer.byteLength(result+char,'utf8')>maxBytes)break;
    result+=char;
  }
  // Prefer a word boundary so the automatic translation is not cut midword.
  return result.length<cleaned.length?result.replace(/\s+\S*$/,'').trim()||result:result;
}

export function validTranslation(original:string,translated:unknown):translated is string {
  if(typeof translated!=='string')return false;
  const cleaned=plainText(translated,750);
  if(cleaned.length<5||cleaned.length>700||/MYMEMORY WARNING|TRANSLATED\.NET QUOTA|QUOTA EXCEEDED|REQUEST LIMIT/i.test(cleaned))return false;
  // A response that simply repeats the English excerpt is not a translation.
  return cleaned.toLocaleLowerCase('en')!==original.trim().toLocaleLowerCase('en');
}

export async function translateToPortuguese(input:string,providerFetch:typeof fetch=fetch):Promise<string>{
  const source=translationInput(input);
  if(!source)throw new Error('Texto vazio');
  const url=new URL('https://api.mymemory.translated.net/get');
  url.searchParams.set('q',source);
  url.searchParams.set('langpair','en|pt-BR');
  const response=await providerFetch(url.toString(),{
    headers:{'Accept':'application/json','User-Agent':'ComexHub-News/1.7.1'},
    cache:'no-store',signal:AbortSignal.timeout(TRANSLATION_REQUEST_TIMEOUT_MS)
  });
  if(!response.ok)throw new Error('Serviço de tradução indisponível (HTTP '+response.status+')');
  const length=Number(response.headers.get('content-length')||0);
  if(length>80_000)throw new Error('Resposta de tradução fora do limite');
  const data=await response.json() as {responseStatus?:number|string;responseData?:{translatedText?:unknown}};
  if(Number(data.responseStatus)!==200||!validTranslation(source,data.responseData?.translatedText))throw new Error('Tradução não foi confirmada');
  return plainText(data.responseData?.translatedText as string,700);
}

// Uses the same tagged-query connection as the existing news module.
export async function translatePendingNews(sql:ReturnType<typeof import('./admin-auth').queryDB>,deadline=Date.now()+45_000){
  const rows=await sql`SELECT id::text,title,summary FROM comexlab_news
    WHERE translation_status='pending' AND source_slug IN ('ec','wto')
      AND (translation_attempted_at IS NULL OR translation_attempted_at<NOW()-INTERVAL '45 minutes')
    ORDER BY published_at DESC NULLS LAST,id DESC LIMIT ${MAX_TRANSLATIONS_PER_SYNC}`;
  let translated=0,failed=0,quotaExhausted=false;
  for(const row of rows){
    if(Date.now()+2*TRANSLATION_REQUEST_TIMEOUT_MS+1500>deadline)break;
    const title=translationInput(String(row.title),470);
    const summary=translationInput(String(row.summary||''),465);
    const units=title.length+summary.length;
    const reserved=await sql`INSERT INTO comexlab_news_translation_quota(quota_day,chars_used)
      VALUES((NOW() AT TIME ZONE 'UTC')::date,${units})
      ON CONFLICT(quota_day) DO UPDATE SET chars_used=comexlab_news_translation_quota.chars_used+EXCLUDED.chars_used
       WHERE comexlab_news_translation_quota.chars_used+EXCLUDED.chars_used<=${MAX_DAILY_TRANSLATION_CHARS}
      RETURNING chars_used`;
    if(!reserved.length){quotaExhausted=true;break}
    await sql`UPDATE comexlab_news SET translation_attempted_at=NOW() WHERE id=${String(row.id)}`;
    try{
      const translatedTitle=await translateToPortuguese(title);
      const translatedSummary=summary?await translateToPortuguese(summary):'Leia os detalhes no site oficial da fonte.';
      // Published records become visible only once both fields were translated successfully.
      const saved=await sql`UPDATE comexlab_news SET title_pt=${translatedTitle.slice(0,240)},summary_pt=${translatedSummary.slice(0,700)},
       translation_status='ready',translation_provider='mymemory',translated_at=NOW(),updated_at=NOW()
       WHERE id=${String(row.id)} AND translation_status='pending' RETURNING id`;
      if(saved.length)translated++;
    }catch(err){
      failed++;
      console.warn('News translation delayed: '+(err instanceof Error?err.message:'unknown'));
    }
  }
  return {translated,failed,quotaExhausted};
}
