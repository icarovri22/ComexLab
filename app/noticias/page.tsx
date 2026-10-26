'use client';
import {accountFetch} from '../../lib/account-fetch';
import {useCallback,useEffect,useRef,useState} from 'react';
import {newsMonth} from '../../lib/news-period';
import NewsDashboard from '../../components/NewsDashboard';
import './news-upgrade.css';
import {Newspaper,Globe2,Search,ExternalLink,RefreshCcw,CalendarDays,ShieldCheck,ArrowRight,TrendingUp} from 'lucide-react';
import {COUNTRY_LABELS,NEWS_CATEGORIES,type NewsArticle} from '../../lib/comex-news';

const formatDate=(value:string|null)=>value?new Date(value).toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'}):'Data não informada';
export default function NewsPage(){
 const requestVersion=useRef(0);
 const [view,setView]=useState<'news'|'indicators'>('news');
 const [monthKey,setMonthKey]=useState(()=>newsMonth().key);
 const [monthLabel,setMonthLabel]=useState(()=>newsMonth().label);
 useEffect(()=>{const check=()=>setMonthKey(newsMonth().key);const timer=setInterval(check,60_000);return()=>clearInterval(timer)},[]);
 const [sources,setSources]=useState<{slug:string;name:string;website_url:string;last_success_at:string|null;last_error:string|null}[]>([]);
 const [category,setCategory]=useState('all');const [country,setCountry]=useState('all');const [term,setTerm]=useState('');const [search,setSearch]=useState('');
 const [items,setItems]=useState<NewsArticle[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [lastSync,setLastSync]=useState<{completed_at:string;status:string}|null>(null);
 const load=useCallback(async(signal?:AbortSignal)=>{
  const ticket=++requestVersion.current;
  setLoading(true);setError('');
  try{
   const p=new URLSearchParams({category,country,q:search});const response=await accountFetch('/api/news?'+p.toString(),{cache:'no-store',credentials:'same-origin',signal});
   const result=await response.json();if(!response.ok)throw new Error(result.error||'Não foi possível consultar notícias.');
   if(!Array.isArray(result.news))throw new Error('Resposta inválida do servidor.');
   if(!signal?.aborted&&ticket===requestVersion.current){setMonthLabel(result.month?.label||newsMonth().label);setItems(result.news);setLastSync(result.lastSync||null);setSources(Array.isArray(result.sources)?result.sources:[])}
  }catch(e){if(!signal?.aborted&&ticket===requestVersion.current)setError(e instanceof Error?e.message:'Falha inesperada.')}finally{if(!signal?.aborted&&ticket===requestVersion.current)setLoading(false)}
 },[category,country,search,monthKey]);
 useEffect(()=>{const controller=new AbortController();void load(controller.signal);return()=>controller.abort()},[load]);
 useEffect(()=>{const timer=setInterval(()=>{if(document.visibilityState==='visible')void load()},15*60*1000);const refresh=()=>{if(document.visibilityState==='visible')void load()};document.addEventListener('visibilitychange',refresh);return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',refresh)}},[load]);
 const syncDate=lastSync?.completed_at?new Date(lastSync.completed_at):null;
 const syncProblem=!syncDate||Date.now()-syncDate.getTime()>36*3600000||lastSync?.status==='error';
 return <div className="news-page">
  <header className="page-heading"><span className="eyebrow">APRENDIZAGEM · COMEX NEWS</span><h1>Acompanhe o que importa.</h1><p className="page-lead">Notícias do mês e câmbio, cada um no seu espaço.</p></header><div className="minimal-tabs" role="group" aria-label="Conteúdo do Comex News"><button type="button" aria-pressed={view==='news'} onClick={()=>setView('news')}>Notícias</button><button type="button" aria-pressed={view==='indicators'} onClick={()=>setView('indicators')}>Câmbio e indicadores</button></div>
  <section className="news-update-strip" aria-label="Situação da atualização"><div><strong>Atualização automática</strong><span>Consulta diária e nova verificação ao acessar, quando necessário</span></div><div><strong>{syncProblem?'Verificação das fontes pendente':lastSync?.status==='partial'?'Última consulta com falha em parte das fontes':'Fontes consultadas'}</strong><span>{syncDate?syncDate.toLocaleString('pt-BR',{timeZone:'America/Fortaleza',dateStyle:'short',timeStyle:'short'}):'Aguardando a primeira sincronização'} · Fortaleza</span></div></section>
  <div hidden={view!=='news'}>
  <section className="news-filter-panel" aria-label="Pesquisar notícias">
   <form onSubmit={e=>{e.preventDefault();setSearch(term.trim().slice(0,80))}} className="news-search-form"><label className="field"><span className="label">Pesquisar por assunto</span><div className="news-search-input"><Search size={18}/><input className="input" placeholder="Ex.: tarifas, exportações, portos..." maxLength={80} value={term} onChange={e=>setTerm(e.target.value)}/></div></label><button className="btn" type="submit">Buscar</button></form>
   <details className="minimal-disclosure news-filters-disclosure" open={country!=='all'||category!=='all'}><summary>Filtrar por país ou assunto{country!=='all'||category!=='all'?' · filtros ativos':''}</summary><div className="news-filters"><div className="field"><span className="label">Mês de publicação</span><strong className="news-current-month">{monthLabel}</strong></div><label className="field"><span className="label">País ou região</span><select className="select" value={country} onChange={e=>setCountry(e.target.value)}><option value="all">Todos os países</option>{Object.entries(COUNTRY_LABELS).sort((a,b)=>a[1].localeCompare(b[1],'pt-BR')).map(([code,name])=><option key={code} value={code}>{name}</option>)}</select></label><label className="field"><span className="label">Categoria</span><select className="select" value={category} onChange={e=>setCategory(e.target.value)}><option value="all">Todos os assuntos</option>{Object.entries(NEWS_CATEGORIES).map(([code,name])=><option value={code} key={code}>{name}</option>)}</select></label><button className="btn secondary news-refresh" type="button" disabled={loading} onClick={()=>void load()}><RefreshCcw size={15}/> Recarregar notícias</button></div></details>
  </section>
  <div className="news-section-heading"><div><h2>Notícias do comércio internacional</h2><p>{loading?'Carregando notícias oficiais...':`${items.length} ${items.length===1?'publicação encontrada':'publicações encontradas'} · ${monthLabel}${items.length===80?' · exibindo as 80 mais recentes':''}`}</p></div>{lastSync?.completed_at&&<small>Última consulta de fontes: {new Date(lastSync.completed_at).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})}</small>}</div>
  {error&&<div className="alert" role="alert">{error} <button type="button" onClick={()=>void load()} className="btn secondary">Tentar novamente</button></div>}
  {!error&&loading&&<div className="panel" role="status">Consultando a base de notícias...</div>}
  {!error&&!loading&&!items.length&&<section className="news-empty"><Newspaper size={38}/><h2>Nenhuma notícia encontrada</h2><p>Não há publicações disponíveis para esta seleção. Limpe os filtros para conferir todas as notícias do mês. A lista muda automaticamente no início de cada mês. As fontes podem não publicar novidades todos os dias.</p><button className="btn secondary" type="button" onClick={()=>{setCategory('all');setCountry('all');setSearch('');setTerm('')}}>Limpar filtros</button></section>}
  {!error&&!loading&&!!items.length&&<div className="news-grid">{items.map(item=><article key={item.id} className={'news-card'+(item.featured?' news-featured':'')}>
   <div className="news-card-top"><span className="news-category">{NEWS_CATEGORIES[item.category]||'Comércio global'}</span>{item.featured&&<span className="news-featured-tag">Destaque</span>}</div>
   <h3 lang="pt-BR"><a href={item.source_url} target="_blank" rel="noopener noreferrer">{item.title}</a></h3><p className="news-summary" lang="pt-BR">{item.summary||'Consulte a publicação original para conhecer os detalhes.'}</p>{item.translation_provider==='mymemory'&&<span className="news-translation-label">Tradução automática para português · confira a fonte original</span>}
   <details className="news-impact"><summary>Entenda o contexto no Comex</summary><strong><TrendingUp size={15}/> Como isso pode afetar o Comex?</strong><p>{item.impact||'Analise possíveis efeitos de acordo com país, produto e tipo de operação.'}</p><small>Análise educacional — não é orientação fiscal ou confirmação de impacto real.</small></details>
   <div className="news-country-tags">{(Array.isArray(item.countries)?item.countries:[]).slice(0,5).map(code=><span key={code}>{COUNTRY_LABELS[code]||code}</span>)}</div>
   <div className="news-card-footer"><div className="news-card-source"><strong><ShieldCheck size={14}/>{item.source_name}</strong><span><CalendarDays size={13}/>{formatDate(item.published_at)}</span></div><a href={item.source_url} target="_blank" rel="noopener noreferrer" className="news-source-link">Ler na fonte <ExternalLink size={15}/></a></div>
  </article>)}</div>}
  </div>
  {view==='indicators'&&<NewsDashboard items={loading||error?[]:items} refreshKey={lastSync?.completed_at||''}/>}
  <details className="news-official-sources minimal-disclosure"><summary>Fontes oficiais consultadas</summary><p>Publicações consultadas automaticamente. O botão “Recarregar notícias” atualiza a lista já coletada.</p><div>{sources.map(source=><article key={source.slug}><strong>{source.name}</strong><span>{source.last_error?'Última tentativa indisponível':source.last_success_at?'Consulta disponível':'Aguardando consulta'}</span><a href={source.website_url} target="_blank" rel="noopener noreferrer">Abrir portal oficial <ExternalLink size={13}/></a></article>)}</div></details>
  <section className="news-disclaimer"><ShieldCheck size={20}/><div><strong>Informação com responsabilidade</strong><p>Os títulos e resumos são exibidos em português. Traduções automáticas podem conter imprecisões: confirme os detalhes na fonte original. Os possíveis impactos são explicações gerais e não confirmam que uma medida já esteja em vigor. Antes de negociar, classificar produtos ou calcular tributos, consulte as regras oficiais atualizadas.</p></div><ArrowRight size={18}/></section>
 </div>
}
