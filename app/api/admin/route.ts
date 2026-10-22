import {selectedSession} from '../../../lib/account-session';
import {NextRequest,NextResponse} from 'next/server';
import {verifiedAdmin,queryDB,noStore} from '../../../lib/admin-auth';
import {isProtectedAdministrator,PROTECTED_ADMIN_ID,PROTECTED_ADMIN_USERNAME,PROTECTED_OWNER_ID,PROTECTED_OWNER_USERNAME,protectedAdminMessage} from '../../../lib/protected-admin';
import {LESSONS,type Lesson} from '../../../lib/lessons';
import {EXTRA_LESSONS} from '../../../lib/study-plus';
import {validateManualNews} from '../../../lib/comex-news';

export const runtime='nodejs';
const baseLessons=[...LESSONS,...EXTRA_LESSONS];
const bySlug=new Map(baseLessons.map(x=>[x.slug,x]));
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:noStore});
const isString=(s:unknown,max:number)=>typeof s==='string'&&s.trim().length>0&&s.length<=max;

async function getActor(req:NextRequest){return verifiedAdmin(selectedSession(req))}

export async function GET(req:NextRequest){
 const actor=await getActor(req);
 if(!actor)return fail('Acesso administrativo não autorizado.',403);
 const view=req.nextUrl.searchParams.get('view')||'overview';
 const db=queryDB();
 try{
  if(view==='overview'){
   const [summary,settings,audit]=await Promise.all([
    db`SELECT COUNT(*)::int AS users,
      COUNT(*) FILTER(WHERE role='admin')::int AS admins,
      COUNT(*) FILTER(WHERE is_active=false)::int AS disabled,
      COUNT(*) FILTER(WHERE created_at>=NOW()-interval '30 days')::int AS recent FROM comexlab_users`,
    db`SELECT (SELECT COUNT(*)::int FROM comexlab_study_overrides WHERE is_published=true) AS published,
      (SELECT COUNT(*)::int FROM comexlab_study_overrides WHERE is_published=false) AS drafts`,
    db`SELECT a.action,a.target,a.created_at,u.username AS actor FROM comexlab_admin_audit a LEFT JOIN comexlab_users u ON u.id=a.actor_id ORDER BY a.created_at DESC LIMIT 12`
   ]);
   return NextResponse.json({summary:summary[0],studies:settings[0],audit},{headers:noStore});
  }
  if(view==='feedback'){
   const [feedback,metrics]=await Promise.all([
    db`SELECT f.id::text,u.username,f.rating,f.suggestion,f.status,f.created_at,f.reviewed_at
       FROM comexlab_feedback f JOIN comexlab_users u ON u.id=f.user_id
       ORDER BY (f.status='new') DESC,f.created_at DESC LIMIT 200`,
    db`SELECT COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE status='new')::int AS pending,
       COUNT(rating)::int AS ratings,
       COALESCE(ROUND(AVG(rating)::numeric,1),0)::float8 AS average_rating
       FROM comexlab_feedback`
   ]);
   return NextResponse.json({feedback,metrics:metrics[0]},{headers:noStore});
  }
  if(view==='news'){
   const [news,sources,runs,metrics]=await Promise.all([
    db`SELECT id::text,title,summary,title_pt,summary_pt,translation_status,translation_provider,impact,source_name,source_url,countries,category,status,featured,is_manual,published_at,created_at FROM comexlab_news ORDER BY created_at DESC,id DESC LIMIT 200`,
    db`SELECT slug,name,feed_url,website_url,is_enabled,last_checked_at,last_success_at,last_error FROM comexlab_news_sources ORDER BY slug`,
    db`SELECT id::text,started_at,completed_at,status,sources_checked,items_added,details FROM comexlab_news_sync_runs ORDER BY id DESC LIMIT 6`,
    db`SELECT COUNT(*)::int AS total,COUNT(*) FILTER(WHERE status='published')::int AS published,COUNT(*) FILTER(WHERE status='pending')::int AS pending,COUNT(*) FILTER(WHERE status='hidden')::int AS hidden FROM comexlab_news`
   ]);
   return NextResponse.json({news,sources,runs,metrics:metrics[0]},{headers:noStore});
  }
  if(view==='users'){
   const users=await db`SELECT id::text,username,email,role,is_active,created_at FROM comexlab_users ORDER BY created_at DESC LIMIT 100`;
   return NextResponse.json({users},{headers:noStore});
  }
  if(view==='studies'){
   const rows=await db`SELECT slug,content,is_published,updated_at FROM comexlab_study_overrides`;
   const map=new Map<string,{content:unknown;is_published:boolean;updated_at:string}>(rows.map(r=>[String(r.slug),{content:r.content,is_published:r.is_published===true,updated_at:String(r.updated_at)}]));
   const lessons=baseLessons.map(lesson=>({slug:lesson.slug,defaultLesson:lesson,content:map.get(lesson.slug)?.content||null,published:map.get(lesson.slug)?.is_published===true,updatedAt:map.get(lesson.slug)?.updated_at||null}));
   return NextResponse.json({lessons},{headers:noStore});
  }
  if(view==='ai'){
   const [metrics,settings]=await Promise.all([
    db`SELECT COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE day_utc=(NOW() AT TIME ZONE 'UTC')::date)::int AS today,
      COUNT(DISTINCT user_id) FILTER (WHERE day_utc=(NOW() AT TIME ZONE 'UTC')::date)::int AS users_today,
      COUNT(*) FILTER (WHERE rating='up')::int AS positive,
      COUNT(*) FILTER (WHERE rating='down')::int AS negative,
      COALESCE(SUM(input_tokens),0)::int AS input_tokens,
      COALESCE(SUM(output_tokens),0)::int AS output_tokens
      FROM comexlab_ai_questions WHERE status='complete'`,
    db`SELECT key,value FROM comexlab_settings WHERE key IN ('ai_enabled','ai_daily_limit')`
   ]);
   const options=new Map(settings.map(x=>[String(x.key),String(x.value)]));
   return NextResponse.json({metrics:metrics[0],enabled:options.get('ai_enabled')!=='false',dailyLimit:Number(options.get('ai_daily_limit')||10),configured:Boolean(process.env.OPENAI_API_KEY),model:process.env.OPENAI_MODEL||'gpt-6-luna'},{headers:noStore});
  }
  if(view==='settings'){
   const rows=await db`SELECT key,value,updated_at FROM comexlab_settings WHERE key='announcement'`;
   return NextResponse.json({announcement:String(rows[0]?.value||'')},{headers:noStore});
  }
  return fail('Seção administrativa inexistente.',404);
 }catch(e){console.error('Admin read failed',e instanceof Error?e.message:'unknown');return fail('Não foi possível obter os dados administrativos.',503)}
}

type LessonEdit=Pick<Lesson,'title'|'subtitle'|'intro'|'sections'|'exercise'>;
function parseContent(value:unknown):LessonEdit|null{
 if(!value||typeof value!=='object')return null;
 const v=value as Record<string,unknown>;
 if(!isString(v.title,120)||!isString(v.subtitle,220)||!isString(v.intro,4000))return null;
 if(!Array.isArray(v.sections)||!v.sections.length||v.sections.length>12)return null;
 const sections=[] as Lesson['sections'];
 for(const s of v.sections){
  if(!s||typeof s!=='object')return null;
  const obj=s as Record<string,unknown>;
  if(!isString(obj.title,140)||!Array.isArray(obj.points)||obj.points.length<1||obj.points.length>12||!obj.points.every(point=>isString(point,1200)))return null;
  sections.push({title:String(obj.title).trim(),points:obj.points.map(point=>String(point).trim())});
 }
 if(!v.exercise||typeof v.exercise!=='object')return null;
 const q=v.exercise as Record<string,unknown>;
 if(!isString(q.question,600)||!isString(q.explanation,2000)||!Array.isArray(q.options)||q.options.length!==3||!q.options.every(item=>isString(item,500))||(typeof q.answer!=='number'||!Number.isInteger(q.answer))||Number(q.answer)<0||Number(q.answer)>2)return null;
 return {title:String(v.title).trim(),subtitle:String(v.subtitle).trim(),intro:String(v.intro).trim(),sections,
   exercise:{question:String(q.question).trim(),options:q.options.map(o=>String(o).trim()),answer:Number(q.answer),explanation:String(q.explanation).trim()}};
}

export async function POST(req:NextRequest){
 const actor=await getActor(req);
 if(!actor)return fail('Acesso administrativo não autorizado.',403);
 const origin=req.headers.get('origin');
 if(!origin)return fail('Origem da requisição obrigatória.',403);
 try{if(new URL(origin).host!==req.nextUrl.host)return fail('Origem não autorizada.',403)}catch{return fail('Origem inválida.',403)}
 const bodyText=await req.text();
 if(bodyText.length>45000)return fail('Dados acima do limite permitido.',413);
 let fields:Record<string,unknown>;
 try{fields=JSON.parse(bodyText)}catch{return fail('Solicitação inválida.',400)}
 if(!fields||typeof fields!=='object'||typeof fields.action!=='string')return fail('Ação administrativa inválida.',400);
 const sql=queryDB();
 try{
  if(fields.action==='ai.settings'){
   const dailyLimit=Number(fields.dailyLimit);
   if(!Number.isInteger(dailyLimit)||dailyLimit<1||dailyLimit>30||typeof fields.enabled!=='boolean')return fail('Configure um limite de 1 a 30 perguntas por dia.',400);
   const enabled=fields.enabled?'true':'false';
   await sql`INSERT INTO comexlab_settings(key,value,updated_by) VALUES('ai_daily_limit',${String(dailyLimit)},${actor.id}) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_by=EXCLUDED.updated_by`;
   await sql`INSERT INTO comexlab_settings(key,value,updated_by) VALUES('ai_enabled',${enabled},${actor.id}) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_by=EXCLUDED.updated_by`;
   await sql`INSERT INTO comexlab_admin_audit(actor_id,action,target) VALUES(${actor.id},'ai.settings','ComexHub IA')`;
   return NextResponse.json({ok:true},{headers:noStore});
  }
  if(fields.action==='news.create'){
   const check=validateManualNews(fields);
   if(!('value' in check)||!check.value)return fail(check.error||'Dados inválidos.',400);
   const item=check.value;
   const countries=item.countries.join(',');
   const url=new URL(item.sourceUrl);
   if(['localhost','127.0.0.1','0.0.0.0','::1'].includes(url.hostname))return fail('Endereço não permitido.',400);
   const validUrl=url.toString();
   const title=item.title,summary=item.summary,impact=item.impact,category=item.category,name=item.sourceName,status=item.status,featured=item.featured;
   const inserted=await sql`INSERT INTO comexlab_news(source_name,source_url,title,summary,title_pt,summary_pt,translation_status,translation_provider,translated_at,impact,category,countries,status,featured,is_manual,created_by,published_at)
     VALUES(${name},${validUrl},${title},${summary},${title},${summary},'ready','manual-pt',NOW(),${impact},${category},string_to_array(${countries},','),${status},${featured},true,${actor.id},NOW())
     ON CONFLICT(source_url) DO NOTHING RETURNING id::text`;
   if(!inserted.length)return fail('Já existe uma publicação com este endereço.',409);
   await sql`INSERT INTO comexlab_admin_audit(actor_id,action,target) VALUES(${actor.id},'news.create',${inserted[0].id})`;
   return NextResponse.json({ok:true},{headers:noStore});
  }
  if(fields.action==='news.translation'){
   const id=String(fields.id||'');
   if(!/^\d{1,22}$/.test(id))return fail('Notícia inválida.',400);
   const title=typeof fields.title_pt==='string'?fields.title_pt.trim():'';
   const summary=typeof fields.summary_pt==='string'?fields.summary_pt.trim():'';
   if(title.length<8||title.length>240||/<[^>]+>/.test(title))return fail('O título em português deve ter 8 a 240 caracteres e não conter HTML.',400);
   if(summary.length<18||summary.length>700||/<[^>]+>/.test(summary))return fail('O resumo em português deve ter 18 a 700 caracteres e não conter HTML.',400);
   const changed=await sql`UPDATE comexlab_news SET title_pt=${title},summary_pt=${summary},translation_status='ready',translation_provider='revisao-admin',translated_at=NOW(),updated_at=NOW(),updated_by=${actor.id} WHERE id=${id} RETURNING id`;
   if(!changed.length)return fail('Notícia não encontrada.',404);
   await sql`INSERT INTO comexlab_admin_audit(actor_id,action,target) VALUES(${actor.id},'news.translation.edit',${id})`;
   return NextResponse.json({ok:true},{headers:noStore});
  }
  if(fields.action==='news.status'||fields.action==='news.feature'){
   const id=String(fields.id||'');if(!/^\d{1,22}$/.test(id))return fail('Notícia inválida.',400);
   if(fields.action==='news.status'){
    const status=fields.status;if(status!=='pending'&&status!=='published'&&status!=='hidden')return fail('Situação inválida.',400);
    const changed=await sql`UPDATE comexlab_news SET status=${status},updated_at=NOW(),updated_by=${actor.id} WHERE id=${id} RETURNING id`;
    if(!changed.length)return fail('Notícia não encontrada.',404);
    await sql`INSERT INTO comexlab_admin_audit(actor_id,action,target) VALUES(${actor.id},${'news.status.'+status},${id})`;
   }else{
    if(typeof fields.featured!=='boolean')return fail('Destaque inválido.',400);
    const changed=await sql`UPDATE comexlab_news SET featured=${fields.featured},updated_at=NOW(),updated_by=${actor.id} WHERE id=${id} RETURNING id`;
    if(!changed.length)return fail('Notícia não encontrada.',404);
    await sql`INSERT INTO comexlab_admin_audit(actor_id,action,target) VALUES(${actor.id},${fields.featured?'news.feature':'news.unfeature'},${id})`;
   }
   return NextResponse.json({ok:true},{headers:noStore});
  }
  if(fields.action==='news.source'){
   const slug=String(fields.slug||'');if(!['mdic','wto','ec'].includes(slug)||typeof fields.enabled!=='boolean')return fail('Fonte inválida.',400);
   await sql`UPDATE comexlab_news_sources SET is_enabled=${fields.enabled},updated_at=NOW() WHERE slug=${slug}`;
   await sql`INSERT INTO comexlab_admin_audit(actor_id,action,target) VALUES(${actor.id},${fields.enabled?'news.source.enable':'news.source.disable'},${slug})`;
   return NextResponse.json({ok:true},{headers:noStore});
  }
  if(fields.action==='feedback.status'){
   const id=String(fields.feedbackId||'');
   const status=fields.status;
   if(!/^\d+$/.test(id)||id.length>22)return fail('Mensagem inválida.',400);
   if(status!=='new'&&status!=='reviewed')return fail('Situação inválida.',400);
   const changed=await sql`UPDATE comexlab_feedback SET status=${status},reviewed_by=${status==='reviewed'?actor.id:null},reviewed_at=${status==='reviewed'?new Date().toISOString():null} WHERE id=${id} RETURNING id`;
   if(!changed.length)return fail('Mensagem não encontrada.',404);
   await sql`INSERT INTO comexlab_admin_audit(actor_id,action,target) VALUES (${actor.id},${status==='reviewed'?'feedback.review':'feedback.reopen'},${id})`;
   return NextResponse.json({ok:true},{headers:noStore});
  }
  if(fields.action==='user.status'||fields.action==='user.role'){
   const userId=String(fields.userId||'');
   if(!/^\d+$/.test(userId))return fail('Usuário inválido.',400);
   if(userId===actor.id)return fail('Não é permitido modificar as próprias permissões ou bloquear a própria conta.',409);
   const rows=await sql`SELECT id::text,username,role,is_active FROM comexlab_users WHERE id=${userId} LIMIT 1`;
   if(!rows.length)return fail('Conta não encontrada.',404);
   if(isProtectedAdministrator({id:String(rows[0].id),username:String(rows[0].username)}))return fail(protectedAdminMessage,409);
   if(fields.action==='user.status'){
    if(typeof fields.active!=='boolean')return fail('Estado inválido.',400);
    if(rows[0].role==='admin'&&fields.active===false)return fail('Para bloquear um administrador, primeiro remova sua permissão administrativa.',409);
    const changed=await sql`UPDATE comexlab_users SET is_active=${fields.active} WHERE id=${userId} AND role='user' AND id::text<>${PROTECTED_ADMIN_ID} AND username<>${PROTECTED_ADMIN_USERNAME} AND id::text<>${PROTECTED_OWNER_ID} AND username<>${PROTECTED_OWNER_USERNAME} RETURNING id`;
    if(!changed.length)return fail('Não foi possível alterar o estado desta conta.',409);
    await sql`INSERT INTO comexlab_admin_audit(actor_id,action,target) VALUES (${actor.id},${fields.active?'user.activate':'user.deactivate'},${userId})`;
    return NextResponse.json({ok:true},{headers:noStore});
   }
   if(fields.role!=='user'&&fields.role!=='admin')return fail('Perfil inválido.',400);
   if(rows[0].is_active!==true&&fields.role==='admin')return fail('Ative a conta antes de conceder acesso administrativo.',409);
   const changed=await sql`UPDATE comexlab_users SET role=${fields.role} WHERE id=${userId} AND id::text<>${PROTECTED_ADMIN_ID} AND username<>${PROTECTED_ADMIN_USERNAME} AND id::text<>${PROTECTED_OWNER_ID} AND username<>${PROTECTED_OWNER_USERNAME} RETURNING id`;
   if(!changed.length)return fail(protectedAdminMessage,409);
   await sql`INSERT INTO comexlab_admin_audit(actor_id,action,target) VALUES (${actor.id},${fields.role==='admin'?'admin.grant':'admin.revoke'},${userId})`;
   return NextResponse.json({ok:true},{headers:noStore});
  }
  if(fields.action==='study.save'){
   const slug=String(fields.slug||'');
   if(!bySlug.has(slug))return fail('Módulo desconhecido.',404);
   const edit=parseContent(fields.content);
   if(!edit)return fail('Revise os campos, as seções e a questão do módulo.',400);
   if(typeof fields.publish!=='boolean')return fail('Estado de publicação inválido.',400);
   const json=JSON.stringify(edit);
   await sql`INSERT INTO comexlab_study_overrides(slug,content,is_published,updated_by)
     VALUES (${slug},${json}::jsonb,${fields.publish},${actor.id})
     ON CONFLICT(slug) DO UPDATE SET content=EXCLUDED.content,is_published=EXCLUDED.is_published,updated_at=NOW(),updated_by=EXCLUDED.updated_by`;
   await sql`INSERT INTO comexlab_admin_audit(actor_id,action,target) VALUES (${actor.id},${fields.publish?'study.publish':'study.draft'},${slug})`;
   return NextResponse.json({ok:true},{headers:noStore});
  }
  if(fields.action==='study.restore'){
   const slug=String(fields.slug||'');
   if(!bySlug.has(slug))return fail('Módulo desconhecido.',404);
   await sql`DELETE FROM comexlab_study_overrides WHERE slug=${slug}`;
   await sql`INSERT INTO comexlab_admin_audit(actor_id,action,target) VALUES (${actor.id},'study.restore',${slug})`;
   return NextResponse.json({ok:true},{headers:noStore});
  }
  if(fields.action==='settings.announcement'){
   if(typeof fields.announcement!=='string'||fields.announcement.length>240)return fail('O aviso deve ter no máximo 240 caracteres.',400);
   const notice=fields.announcement.trim();
   await sql`INSERT INTO comexlab_settings(key,value,updated_by) VALUES ('announcement',${notice},${actor.id})
     ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW(),updated_by=EXCLUDED.updated_by`;
   await sql`INSERT INTO comexlab_admin_audit(actor_id,action,target) VALUES (${actor.id},'settings.notice','announcement')`;
   return NextResponse.json({ok:true},{headers:noStore});
  }
  return fail('Ação não encontrada.',400);
 }catch(e){console.error('Admin update failed',e instanceof Error?e.message:'unknown');return fail('Falha ao salvar a alteração. Tente novamente.',503)}
}
