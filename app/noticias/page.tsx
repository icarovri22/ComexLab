'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import NewsDashboard from '../../components/NewsDashboard';
import './news-upgrade.css';
import {Newspaper,Globe2,Search,ExternalLink,RefreshCcw,CalendarDays,ShieldCheck,ArrowRight,TrendingUp} from 'lucide-react';
import {COUNTRY_LABELS,NEWS_CATEGORIES,type NewsArticle} from '../../lib/comex-news';

const formatDate=(value:string|null)=>value?new Date(value).toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'}):'Data não informada';
export default function NewsPage(){
 const requestVersion=useRef(0);
 const [days,setDays]=useState('30');
 const [sources,setSources]=useState<{slug:string;name:string;website_url:string;last_success_at:string|null;last_error:string|null}[]>([]);
 const [category,setCategory]=useState('all');const [country,setCountry]=useState('all');const [term,setTerm]=useState('');const [search,setSearch]=useState('');
 const [items,setItems]=useState<NewsArticle[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [lastSync,setLastSync]=useState<{completed_at:string;status:string}|null>(null);
 const load=useCallback(async(signal?:AbortSignal)=>{
  const ticket=++requestVersion.current;
  setLoading(true);setError('');
  try{
   const p=new URLSearchParams({category,country,q:search,days});const response=await fetch('/api/news?'+p.toString(),{cache:'no-store',credentials:'same-origin',signal});
   const result=await response.json();if(!response.ok)throw new Error(result.error||'Não foi possível consultar notícias.');
   if(!Array.isArray(result.news))throw new Error('Resposta inválida do servidor.');
   if(!signal?.aborted&&ticket===requestVersion.current){setItems(result.news);setLastSync(result.lastSync||null);setSources(Array.isArray(result.sources)?result.sources:[])}
  }catch(e){if(!signal?.aborted&&ticket===requestVersion.current)setError(e instanceof Error?e.message:'Falha inesperada.')}finally{if(!signal?.aborted&&ticket===requestVersion.current)setLoading(false)}
 },[category,country,search,days]);
 useEffect(()=>{const controller=new AbortController();void load(controller.signal);return()=>controller.abort()},[load]);
 useEffect(()=>{const timer=setInterval(()=>{if(document.visibilityState==='visible')void load()},15*60*1000);const refresh=()=>{if(document.visibilityState==='visible')void load()};document.addEventListener('visibilitychange',refresh);return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',refresh)}},[load]);
 const syncDate=lastSync?.completed_at?new Date(lastSync.completed_at):null;
 const syncProblem=!syncDate||Date.now()-syncDate.getTime()>36*3600000||lastSync?.status==='error';
 return <div className="news-page">
  <section className="news-hero"><div className="news-hero-intro"><span className="eyebrow">INTELIGÊNCIA COMERCIAL • FONTES OFICIAIS</span><h1>Comex News</h1><p>Sua leitura diária de comércio internacional: publicações oficiais, contexto para os estudos e indicadores para acompanhar o mercado.</p><div className="news-hero-tags"><span><Globe2 size={16}/> Países e mercados</span><span><TrendingUp size={16}/> Impactos no Comex</span></div></div><div className="news-hero-icon"><Newspaper size={72} strokeWidth={1.3}/></div></section>
  <section className="news-update-strip" aria-label="Situação da atualização"><div><strong>Atualização automática diária</strong><span>Consulta programada a partir das 08h · horário de Fortaleza</span></div><div><strong>{syncProblem?'Verificação das fontes pendente':lastSync?.status==='partial'?'Última consulta com falha em parte das fontes':'Fontes consultadas'}</strong><span>{syncDate?syncDate.toLocaleString('pt-BR',{timeZone:'America/Fortaleza',dateStyle:'short',timeStyle:'short'}):'Aguardando a primeira sincronização'} · Fortaleza</span></div></section>
  <section className="news-filter-panel" aria-label="Pesquisar notícias">
   <form onSubmit={e=>{e.preventDefault();setSearch(term.trim().slice(0,80))}} className="news-search-form"><label className="field"><span className="label">Pesquisar por assunto</span><div className="news-search-input"><Search size={18}/><input className="input" placeholder="Ex.: tarifas, exportações, portos..." maxLength={80} value={term} onChange={e=>setTerm(e.target.value)}/></div></label><button className="btn" type="submit">Buscar</button></form>
   <div className="news-filters"><label className="field"><span className="label">Período de publicação</span><select className="select" value={days} onChange={e=>setDays(e.target.value)}><option value="7">Últimos 7 dias</option><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option></select></label><label className="field"><span className="label">País ou região</span><select className="select" value={country} onChange={e=>setCountry(e.target.value)}><option value="all">Todos os países</option>{Object.entries(COUNTRY_LABELS).sort((a,b)=>a[1].localeCompare(b[1],'pt-BR')).map(([code,name])=><option key={code} value={code}>{name}</option>)}</select></label><label className="field"><span className="label">Categoria</span><select className="select" value={category} onChange={e=>setCategory(e.target.value)}><option value="all">Todos os assuntos</option>{Object.entries(NEWS_CATEGORIES).map(([code,name])=><option value={code} key={code}>{name}</option>)}</select></label><button className="btn secondary news-refresh" type="button" disabled={loading} onClick={()=>void load()}><RefreshCcw size={15}/> Recarregar notícias</button></div>
  </section>
  <NewsDashboard items={loading||error?[]:items} refreshKey={lastSync?.completed_at||''}/>
  <div className="news-section-heading"><div><h2>Notícias do comércio internacional</h2><p>{loading?'Carregando notícias oficiais...':`${items.length} ${items.length===1?'publicação encontrada':'publicações encontradas'} · últimos ${days} dias${items.length===80?' · exibindo as 80 mais recentes':''}`}</p></div>{lastSync?.completed_at&&<small>Última consulta de fontes: {new Date(lastSync.completed_at).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})}</small>}</div>
  {error&&<div className="alert" role="alert">{error} <button type="button" onClick={()=>void load()} className="btn secondary">Tentar novamente</button></div>}
  {!error&&loading&&<div className="panel" role="status">Consultando a base de notícias...</div>}
  {!error&&!loading&&!items.length&&<section className="news-empty"><Newspaper size={38}/><h2>Nenhuma notícia encontrada</h2><p>Não há publicações disponíveis para esta seleção. Amplie o período ou limpe os filtros. As fontes podem não publicar novidades todos os dias.</p><button className="btn secondary" type="button" onClick={()=>{setCategory('all');setCountry('all');setSearch('');setTerm('');setDays('90')}}>Limpar filtros</button></section>}
  {!error&&!loading&&!!items.length&&<div className="news-grid">{items.map(item=><article key={item.id} className={'news-card'+(item.featured?' news-featured':'')}>
   <div className="news-card-top"><span className="news-category">{NEWS_CATEGORIES[item.category]||'Comércio global'}</span>{item.featured&&<span className="news-featured-tag">Destaque</span>}</div>
   <h3 lang="pt-BR"><a href={item.source_url} target="_blank" rel="noopener noreferrer">{item.title}</a></h3><p className="news-summary" lang="pt-BR">{item.summary||'Consulte a publicação original para conhecer os detalhes.'}</p>{item.translation_provider==='mymemory'&&<span className="news-translation-label">Tradução automática para português · confira a fonte original</span>}
   <details className="news-impact"><summary>Entenda o contexto no Comex</summary><strong><TrendingUp size={15}/> Como isso pode afetar o Comex?</strong><p>{item.impact||'Analise possíveis efeitos de acordo com país, produto e tipo de operação.'}</p><small>Análise educacional — não é orientação fiscal ou confirmação de impacto real.</small></details>
   <div className="news-country-tags">{(Array.isArray(item.countries)?item.countries:[]).slice(0,5).map(code=><span key={code}>{COUNTRY_LABELS[code]||code}</span>)}</div>
   <div className="news-card-footer"><div className="news-card-source"><strong><ShieldCheck size={14}/>{item.source_name}</strong><span><CalendarDays size={13}/>{formatDate(item.published_at)}</span></div><a href={item.source_url} target="_blank" rel="noopener noreferrer" className="news-source-link">Ler na fonte <ExternalLink size={15}/></a></div>
  </article>)}</div>}
  <section className="news-official-sources"><h2>Direto das fontes oficiais</h2><p>Publicações consultadas automaticamente. O botão “Recarregar notícias” atualiza a lista já coletada.</p><div>{sources.map(source=><article key={source.slug}><strong>{source.name}</strong><span>{source.last_error?'Última tentativa indisponível':source.last_success_at?'Consulta disponível':'Aguardando consulta'}</span><a href={source.website_url} target="_blank" rel="noopener noreferrer">Abrir portal oficial <ExternalLink size={13}/></a></article>)}</div></section>
  <section className="news-disclaimer"><ShieldCheck size={20}/><div><strong>Informação com responsabilidade</strong><p>Os títulos e resumos são exibidos em português. Traduções automáticas podem conter imprecisões: confirme os detalhes na fonte original. Os possíveis impactos são explicações gerais e não confirmam que uma medida já esteja em vigor. Antes de negociar, classificar produtos ou calcular tributos, consulte as regras oficiais atualizadas.</p></div><ArrowRight size={18}/></section>
 </div>
}
