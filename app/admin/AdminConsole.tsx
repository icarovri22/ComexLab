'use client';
import {accountFetch} from '../../lib/account-fetch';
import {useCallback,useEffect,useRef,useState} from 'react';
import {BookOpen,CheckCircle2,ChevronRight,ClipboardList,LayoutDashboard,LoaderCircle,Save,Settings,ShieldCheck,ShieldX,Users,RotateCcw,MessageSquareHeart,Star,ArrowUpRight,Newspaper} from 'lucide-react';
import type {Lesson} from '../../lib/lessons';
import {currentAdminTabData,type AdminTabResponse} from '../../lib/admin-tab-data';
import {isProtectedAdministrator} from '../../lib/protected-admin';
import NewsAdmin,{type NewsAdminData} from './NewsAdmin';

type Tab='overview'|'users'|'studies'|'feedback'|'news'|'ai'|'settings';
type User={id:string;username:string;email:string|null;role:'user'|'admin';is_active:boolean;created_at:string};
type FeedbackEntry={id:string;username:string;rating:number|null;suggestion:string;status:'new'|'reviewed';created_at:string;reviewed_at:string|null};
type FeedbackMetrics={total:number;pending:number;ratings:number;average_rating:number};
type StudyRow={slug:string;defaultLesson:Lesson;content:Partial<Lesson>|null;published:boolean;updatedAt:string|null};
type Edit=Pick<Lesson,'title'|'subtitle'|'intro'|'sections'|'exercise'>;
const menu:[Tab,string,typeof Users][]=[['overview','Visão geral',LayoutDashboard],['users','Usuários',Users],['studies','Estudos',BookOpen],['feedback','Avaliações',MessageSquareHeart],['news','Notícias',Newspaper],['settings','Configurações',Settings]];
const asEdit=(row:StudyRow):Edit=>{
 const base=row.defaultLesson,content=row.content;
 return {
  title:content?.title||base.title, subtitle:content?.subtitle||base.subtitle,intro:content?.intro||base.intro,
  sections:(content?.sections||base.sections).map(s=>({title:s.title,points:[...s.points]})),
  exercise:{...base.exercise,...content?.exercise,options:[...(content?.exercise?.options||base.exercise.options)]}
 };
};
const date=(v:string)=>new Date(v).toLocaleDateString('pt-BR');

export default function AdminConsole({username}:{username:string}){
 const [tab,setTab]=useState<Tab>('overview');
 const [loaded,setLoaded]=useState<AdminTabResponse<Tab,Record<string,any>>|null>(null);
 const [loading,setLoading]=useState(false);
 const [busy,setBusy]=useState(false);
 const [status,setStatus]=useState('');
 const [failure,setFailure]=useState('');
 const [selected,setSelected]=useState('');
 const [draft,setDraft]=useState<Edit|null>(null);
 const [notice,setNotice]=useState('');
 const [aiDailyLimit,setAiDailyLimit]=useState(10);
 const [aiEnabled,setAiEnabled]=useState(true);
 const [feedbackFilter,setFeedbackFilter]=useState<'all'|'new'|'reviewed'>('all');
 const lastRequest=useRef(0);
 const refresh=useCallback(async(target:Tab,signal?:AbortSignal)=>{
  const request=++lastRequest.current;
  setLoading(true);setFailure('');setLoaded(null);
  try{
   const r=await accountFetch(`/api/admin?view=${target}`,{cache:'no-store',signal,credentials:'same-origin'});
   const body=await r.json();
   if(!r.ok)throw new Error(body?.error||'Não foi possível carregar os dados.');
   if(target==='users'&&!Array.isArray(body?.users))throw new Error('A lista de usuários retornou dados inválidos. Tente atualizar.');
   if(target==='overview'&&(!body?.summary||!Array.isArray(body?.audit)))throw new Error('Os dados do painel não foram carregados corretamente.');
   if(target==='feedback'&&(!Array.isArray(body?.feedback)||!body?.metrics))throw new Error('As avaliações não foram carregadas corretamente.');
   if(target==='news'&&(!Array.isArray(body?.news)||!Array.isArray(body?.sources)||!body?.metrics))throw new Error('As notícias não foram carregadas corretamente.');
   if(target==='ai'&&!body?.metrics)throw new Error('Os dados da IA não foram carregados.');
   if(target==='studies'&&!Array.isArray(body?.lessons))throw new Error('Os módulos não foram carregados corretamente.');
   if(request!==lastRequest.current||signal?.aborted)return;
   setLoaded({tab:target,payload:body});
   if(target==='settings')setNotice(String(body.announcement||''));
   if(target==='ai'){setAiDailyLimit(Number(body.dailyLimit)||10);setAiEnabled(body.enabled===true)}
  }catch(e){
   if(request===lastRequest.current&&!signal?.aborted){setLoaded(null);setFailure(e instanceof Error?e.message:'Erro inesperado.');}
  }finally{if(request===lastRequest.current&&!signal?.aborted)setLoading(false)}
 },[]);
 useEffect(()=>{
  const controller=new AbortController();
  setStatus('');setSelected('');setDraft(null);
  void refresh(tab,controller.signal);
  return ()=>{controller.abort();lastRequest.current++};
 },[tab,refresh]);
 async function submit(payload:Record<string,unknown>){
  setBusy(true);setStatus('');setFailure('');
  try{const r=await accountFetch('/api/admin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const body=await r.json();if(!r.ok)throw new Error(body.error||'Falha ao salvar.');setStatus('Alteração salva com sucesso.');await refresh(tab);return true}
  catch(e){setFailure(e instanceof Error?e.message:'Erro ao salvar.');return false}
  finally{setBusy(false)}
 }
 // Never render another tab's payload: effects clear stale data only after the first render.
 const data=currentAdminTabData(tab,loaded);
 const studies=(data?.lessons||[]) as StudyRow[];
 const editStudy=(slug:string)=>{const entry=studies.find(s=>s.slug===slug);if(entry){setSelected(slug);setDraft(asEdit(entry));setStatus('');setFailure('')}};
 const updateDraft=(patch:Partial<Edit>)=>setDraft(prev=>prev?{...prev,...patch}:null);
 const changeSection=(idx:number,patch:Partial<Edit['sections'][number]>)=>setDraft(prev=>prev?{...prev,sections:prev.sections.map((s,i)=>i===idx?{...s,...patch}:s)}:null);
 const entry=studies.find(s=>s.slug===selected);
 return <div className="admin-area">
  <div className="admin-heading"><div><span className="eyebrow">CONTROLE DA PLATAFORMA</span><h1>Painel administrativo</h1><p className="page-lead">Gerencie o ComexHub com segurança. Você entrou como <strong>{username}</strong>.</p></div><span className="admin-security"><ShieldCheck size={16}/> Acesso restrito</span></div>
  <nav className="admin-menu" aria-label="Seções administrativas">{menu.map(([id,label,Icon])=><button key={id} type="button" className={tab===id?'active':''} onClick={()=>setTab(id)}><Icon size={17}/>{label}</button>)}</nav>
  {loading&&<div className="panel"><LoaderCircle className="ncm-spin" size={18}/> Carregando informações...</div>}
  {failure&&<div className="alert" role="alert">{failure} <button type="button" className="btn secondary" onClick={()=>void refresh(tab)}>Tentar novamente</button></div>}
  {!loading&&!data&&!failure&&<section className="panel" aria-live="polite"><h2>Informações ainda não carregadas</h2><p className="muted">Selecione uma seção ou tente carregar os dados novamente.</p><button type="button" className="btn secondary" onClick={()=>void refresh(tab)}><RotateCcw size={16}/> Carregar dados</button></section>}
  {status&&<div className="success" role="status"><CheckCircle2 size={16}/> {status}</div>}
  {!loading&&data&&tab==='overview'&&<>
    <div className="admin-stats">
     {[[data.summary.users,'Contas cadastradas'],[data.summary.admins,'Administradores'],[data.summary.disabled,'Acessos bloqueados'],[data.summary.recent,'Novos usuários (30 dias)']].map(([value,label])=><article className="admin-stat" key={String(label)}><strong>{value}</strong><span>{label}</span></article>)}
    </div>
    <div className="admin-columns"><section className="panel"><h2>Conteúdo educacional</h2><div className="subline"><span>Módulos da trilha</span><strong>14</strong></div><div className="subline"><span>Com edição publicada</span><strong>{data.studies.published}</strong></div><div className="subline"><span>Rascunhos salvos</span><strong>{data.studies.drafts}</strong></div><button className="btn secondary" onClick={()=>setTab('studies')}>Gerenciar estudos <ChevronRight size={15}/></button></section>
    <section className="panel"><h2>Funcionamento da plataforma</h2><p className="muted">Os simuladores, a consulta NCM e os demais conteúdos continuam disponíveis. Dados fiscais devem ser conferidos em fontes oficiais.</p><p className="info">Ainda não há registro centralizado de simulações nem de progresso dos estudantes. Os indicadores acima referem-se somente a contas e conteúdos.</p></section></div>
    <section className="panel"><h2>Histórico de alterações</h2>{data.audit.length?<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Data</th><th>Administrador</th><th>Ação</th><th>Alvo</th></tr></thead><tbody>{data.audit.map((a:{action:string;target:string;created_at:string;actor:string|null},i:number)=><tr key={i}><td>{date(a.created_at)}</td><td>{a.actor||'Conta removida'}</td><td>{a.action}</td><td>{a.target}</td></tr>)}</tbody></table></div>:<p className="muted">Nenhuma alteração administrativa registrada até agora.</p>}</section>
  </>}
  {!loading&&data&&tab==='users'&&<section className="panel"><div className="flex-head"><div><h2>Gerenciar usuários</h2><p className="muted">Até 100 contas recentes. Senhas não são exibidas e não podem ser consultadas.</p></div><button className="btn secondary" onClick={()=>void refresh(tab)}><RotateCcw size={15}/> Atualizar</button></div>
   <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Usuário</th><th>E-mail</th><th>Perfil</th><th>Situação</th><th>Cadastro</th><th>Ações</th></tr></thead><tbody>{((Array.isArray(data.users)?data.users:[]) as User[]).map(u=><tr key={u.id}><td><strong>{u.username}</strong>{u.username===username&&<small> (você)</small>}</td><td>{u.email||'Conta anterior ao cadastro por e-mail'}</td><td>{u.role==='admin'?'Administrador':'Usuário'}{isProtectedAdministrator(u)&&<span className="admin-protected-label"><ShieldCheck size={13}/> Protegida</span>}</td><td><span className={u.is_active?'admin-pill active':'admin-pill inactive'}>{u.is_active?'Ativa':'Bloqueada'}</span></td><td>{date(u.created_at)}</td><td>{isProtectedAdministrator(u)?<span className="admin-protected-action" title="Esta conta não pode ser bloqueada ou ter o perfil revogado pelo painel."><ShieldCheck size={15}/> Administração protegida</span>:u.username===username?<span className="muted">Conta atual</span>:<div className="admin-row-actions"><button type="button" disabled={busy} onClick={()=>{if(window.confirm(`${u.is_active?'Bloquear':'Reativar'} o usuário ${u.username}?`))void submit({action:'user.status',userId:u.id,active:!u.is_active})}}>{u.is_active?'Bloquear':'Reativar'}</button><button type="button" disabled={busy||!u.is_active&&u.role==='user'} onClick={()=>{if(window.confirm(`${u.role==='admin'?'Retirar administração de':'Conceder acesso administrativo a'} ${u.username}? Esta permissão permite modificar contas e conteúdos.`))void submit({action:'user.role',userId:u.id,role:u.role==='admin'?'user':'admin'})}}>{u.role==='admin'?'Retirar admin':'Tornar admin'}</button></div>}</td></tr>)}</tbody></table></div>
   <p className="help">Ao bloquear uma conta, novas autenticações e operações protegidas pela API são impedidas. A revogação de sessões já abertas ocorre quando o servidor verifica novamente a conta. As contas icaro_pinheiro e hanna_lr possuem administração protegida: seus perfis não podem ser revogados nem suas contas bloqueadas por este painel.</p>
  </section>}
  {!loading&&data&&tab==='studies'&&<div className="admin-study-grid"><aside className="panel"><h2>Módulos</h2><p className="help">Selecione um módulo para editar a aula e o exercício.</p><div className="admin-lesson-list">{studies.map(s=><button className={selected===s.slug?'active':''} type="button" key={s.slug} onClick={()=>editStudy(s.slug)}><span>{s.defaultLesson.title}</span>{s.content?<small>{s.published?'Publicado':'Rascunho'}</small>:<small>Original</small>}</button>)}</div></aside>
   <section className="panel">{!draft||!entry?<div className="admin-select-prompt"><BookOpen size={35}/><h2>Selecione um módulo</h2><p>Você poderá editar título, resumo, explicações, tópicos e a questão principal. Para aparecer aos estudantes, a alteração precisa ser publicada.</p></div>:<>
     <div className="flex-head"><h2>Editando: {entry.defaultLesson.title}</h2><span className={entry.published?'admin-pill active':'admin-pill'}>{entry.content?(entry.published?'Publicado':'Rascunho'):'Conteúdo original'}</span></div>
     <label className="field"><span className="label">Título</span><input className="input" maxLength={120} value={draft.title} onChange={e=>updateDraft({title:e.target.value})}/></label>
     <label className="field"><span className="label">Subtítulo</span><input className="input" maxLength={220} value={draft.subtitle} onChange={e=>updateDraft({subtitle:e.target.value})}/></label>
     <label className="field"><span className="label">Introdução</span><textarea className="input admin-textarea" rows={4} maxLength={4000} value={draft.intro} onChange={e=>updateDraft({intro:e.target.value})}/></label>
     <h3>Seções da aula</h3>{draft.sections.map((s,i)=><div className="admin-section-edit" key={i}><div className="flex-head"><strong>Seção {i+1}</strong><button type="button" className="admin-danger" disabled={draft.sections.length===1} onClick={()=>updateDraft({sections:draft.sections.filter((_,j)=>j!==i)})}>Remover</button></div><label className="field"><span className="label">Título da seção</span><input className="input" value={s.title} maxLength={140} onChange={e=>changeSection(i,{title:e.target.value})}/></label><label className="field"><span className="label">Tópicos (um por linha)</span><textarea className="input admin-textarea" rows={5} value={s.points.join('\n')} onChange={e=>changeSection(i,{points:e.target.value.split('\n')})}/></label></div>)}
     <button type="button" className="btn secondary" disabled={draft.sections.length>=12} onClick={()=>updateDraft({sections:[...draft.sections,{title:'Nova seção',points:['Novo tópico']} ]})}>Adicionar seção</button>
     <div className="admin-quiz-edit"><h3><ClipboardList size={18}/> Questão principal</h3><label className="field"><span className="label">Enunciado</span><textarea className="input admin-textarea" value={draft.exercise.question} onChange={e=>updateDraft({exercise:{...draft.exercise,question:e.target.value}})}/></label>{draft.exercise.options.map((opt,i)=><label className="field" key={i}><span className="label">Alternativa {String.fromCharCode(65+i)}</span><input className="input" maxLength={500} value={opt} onChange={e=>updateDraft({exercise:{...draft.exercise,options:draft.exercise.options.map((value,j)=>i===j?e.target.value:value)}})}/></label>)}<label className="field"><span className="label">Resposta correta</span><select className="select" value={draft.exercise.answer} onChange={e=>updateDraft({exercise:{...draft.exercise,answer:Number(e.target.value)}})}>{draft.exercise.options.map((_,i)=><option key={i} value={i}>Alternativa {String.fromCharCode(65+i)}</option>)}</select></label><label className="field"><span className="label">Explicação da resposta</span><textarea className="input admin-textarea" rows={3} value={draft.exercise.explanation} onChange={e=>updateDraft({exercise:{...draft.exercise,explanation:e.target.value}})}/></label></div>
     <div className="admin-actions"><button className="btn secondary" type="button" disabled={busy} onClick={()=>void submit({action:'study.save',slug:entry.slug,content:draft,publish:false})}><Save size={15}/> Salvar rascunho</button><button className="btn" type="button" disabled={busy} onClick={()=>{if(window.confirm('Publicar a edição para os estudantes?'))void submit({action:'study.save',slug:entry.slug,content:draft,publish:true})}}><CheckCircle2 size={15}/> Publicar módulo</button>{entry.content&&<button type="button" className="admin-danger" disabled={busy} onClick={()=>{if(window.confirm('Restaurar conteúdo original? As alterações deste módulo serão removidas.'))void submit({action:'study.restore',slug:entry.slug}).then(ok=>{if(ok){setDraft(null);setSelected('')}})}}>Restaurar original</button>}</div>
     <p className="help">Os demais exercícios complementares, glossário e casos resolvidos continuam na versão original; esta edição controla o corpo da aula e a questão principal.</p>
   </>}</section></div>}
  {!loading&&data&&tab==='feedback'&&<div className="admin-feedback">
   <div className="admin-stats">{[[data.metrics.total,'Mensagens recebidas'],[data.metrics.pending,'Pendentes de análise'],[data.metrics.ratings,'Avaliações com nota'],[data.metrics.ratings?`${Number(data.metrics.average_rating).toFixed(1)} / 5`:'—','Nota média']].map(([value,label])=><article className="admin-stat" key={String(label)}><strong>{value}</strong><span>{label}</span></article>)}</div>
   <section className="panel"><div className="flex-head"><div><h2>Avaliações e sugestões</h2><p className="muted">Mensagens enviadas pelos usuários, até 200 registros. Somente administradores podem consultar esta lista.</p></div><button type="button" className="btn secondary" onClick={()=>void refresh(tab)}><RotateCcw size={16}/> Atualizar</button></div>
    <div className="feedback-admin-filters" aria-label="Filtrar avaliações">{([['all','Todas'],['new','Pendentes'],['reviewed','Analisadas']] as const).map(([filter,label])=><button type="button" className={feedbackFilter===filter?'active':''} key={filter} onClick={()=>setFeedbackFilter(filter)}>{label}</button>)}</div>
    <div className="feedback-admin-list">{((data.feedback||[]) as FeedbackEntry[]).filter(item=>feedbackFilter==='all'||item.status===feedbackFilter).length?((data.feedback||[]) as FeedbackEntry[]).filter(item=>feedbackFilter==='all'||item.status===feedbackFilter).map(item=><article key={item.id} className={`feedback-admin-entry ${item.status==='new'?'pending':'reviewed'}`}><div className="feedback-admin-entry-head"><div><h3>{item.username}</h3><small>{new Date(item.created_at).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})}</small></div><span className={item.status==='reviewed'?'admin-pill active':'admin-pill'}>{item.status==='reviewed'?'Analisada':'Pendente'}</span></div>{item.rating!==null&&<div className="feedback-admin-stars" aria-label={`${item.rating} de 5 estrelas`}>{'★'.repeat(item.rating)}{'☆'.repeat(5-item.rating)} <span className="muted">({item.rating}/5)</span></div>}{item.suggestion&&<p className="feedback-admin-entry-body">{item.suggestion}</p>}<div className="feedback-admin-actions"><span className="help">{item.rating!==null?'Avaliação':'Sugestão sem nota'}</span><button type="button" disabled={busy} className="btn secondary" onClick={()=>void submit({action:'feedback.status',feedbackId:item.id,status:item.status==='new'?'reviewed':'new'})}>{item.status==='new'?'Marcar como analisada':'Marcar como pendente'}</button></div></article>):<div className="feedback-admin-empty" role="status"><MessageSquareHeart size={30} aria-hidden="true"/><h3>{data.metrics.total===0?'Nenhuma avaliação recebida até agora':'Nenhuma mensagem neste filtro'}</h3><p>{data.metrics.total===0?'A lista começa vazia e será preenchida quando algum usuário enviar uma nota ou sugestão pelo formulário. Nenhuma avaliação é criada automaticamente.':'Experimente selecionar “Todas” para consultar as mensagens já recebidas.'}</p>{data.metrics.total===0?<a className="btn secondary" href="/avaliar" target="_blank" rel="noopener noreferrer">Abrir formulário de avaliação <ArrowUpRight size={16}/></a>:<button type="button" className="btn secondary" onClick={()=>setFeedbackFilter('all')}>Mostrar todas</button>}<button type="button" className="btn secondary" onClick={()=>void refresh(tab)}><RotateCcw size={16}/> Atualizar lista</button></div>}</div>
   </section>
  </div>}
  {!loading&&data&&tab==='news'&&<NewsAdmin data={data as NewsAdminData} busy={busy} onAction={submit} onRefresh={()=>void refresh('news')}/>}
  {!loading&&data&&tab==='ai'&&<div className="admin-feedback">
   <div className="admin-stats">{[[data.metrics.total,'Perguntas respondidas'],[data.metrics.today,'Perguntas hoje (UTC)'],[data.metrics.users_today,'Alunos hoje'],[Number(data.metrics.positive||0)+Number(data.metrics.negative||0)?Math.round(100*Number(data.metrics.positive||0)/(Number(data.metrics.positive||0)+Number(data.metrics.negative||0)))+'%':'—','Respostas avaliadas como úteis']].map(([value,label])=><article className="admin-stat" key={String(label)}><strong>{value}</strong><span>{label}</span></article>)}</div>
   <div className="admin-columns"><section className="panel"><h2>Configurações da IA</h2><p className="muted">A chave da API é guardada exclusivamente na Vercel. Nunca a informe neste painel.</p>
    <p className="info"><strong>Serviço:</strong> {data.configured?'Chave cadastrada':'Aguardando OPENAI_API_KEY na Vercel'} · Modelo: {data.model}</p>
    <label className="field"><span className="label">Limite diário por usuário (1 a 30)</span><input className="input" type="number" min={1} max={30} value={aiDailyLimit} onChange={e=>setAiDailyLimit(Number(e.target.value))}/></label>
    <label className="field" style={{display:'flex',alignItems:'center',gap:9}}><input type="checkbox" checked={aiEnabled} onChange={e=>setAiEnabled(e.target.checked)}/> Permitir uso quando a chave estiver configurada</label>
    <div className="admin-actions"><button className="btn" type="button" disabled={busy||aiDailyLimit<1||aiDailyLimit>30} onClick={()=>void submit({action:'ai.settings',dailyLimit:aiDailyLimit,enabled:aiEnabled})}><Save size={16}/> Salvar configurações</button></div>
   </section><section className="panel"><h2>Qualidade e consumo</h2><div className="subline"><span>Avaliações positivas</span><strong>{data.metrics.positive||0}</strong></div><div className="subline"><span>Avaliações negativas</span><strong>{data.metrics.negative||0}</strong></div><div className="subline"><span>Tokens de entrada</span><strong>{Number(data.metrics.input_tokens||0).toLocaleString('pt-BR')}</strong></div><div className="subline"><span>Tokens de saída</span><strong>{Number(data.metrics.output_tokens||0).toLocaleString('pt-BR')}</strong></div><p className="help">Os totais são indicadores técnicos, não valores cobrados. O custo depende do modelo e do preço da API.</p></section></div>
  </div>}
  {!loading&&data&&tab==='settings'&&<section className="panel" style={{maxWidth:760}}><div className="flex-head"><h2>Avisos da plataforma</h2><Settings size={20}/></div><p className="muted">Publique uma mensagem informativa que ficará visível no topo das páginas do ComexHub. Deixe em branco para desativar.</p><label className="field"><span className="label">Mensagem para os usuários</span><textarea className="input admin-textarea" rows={4} maxLength={240} value={notice} onChange={e=>setNotice(e.target.value)}/></label><div className="flex-head"><span className="help">{notice.length}/240 caracteres</span><button className="btn" disabled={busy} onClick={()=>void submit({action:'settings.announcement',announcement:notice})}><Save size={15}/> Salvar aviso</button></div><div className="info">Parâmetros fiscais dos simuladores continuam definidos pelo usuário durante a simulação. Não existem alíquotas oficiais globais automáticas nesta versão.</div></section>}
  <div className="admin-bottom"><ShieldX size={17}/> Alterações administrativas são registradas. Não compartilhe sua senha ou seus dados de acesso.</div>
 </div>;
}
