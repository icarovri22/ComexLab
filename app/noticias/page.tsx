'use client';
import {useCallback,useEffect,useState} from 'react';
import {Newspaper,Globe2,Search,ExternalLink,RefreshCcw,CalendarDays,ShieldCheck,ArrowRight,TrendingUp} from 'lucide-react';
import {COUNTRY_LABELS,NEWS_CATEGORIES,type NewsArticle} from '../../lib/comex-news';

const formatDate=(value:string|null)=>value?new Date(value).toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'}):'Data não informada';
export default function NewsPage(){
 const [category,setCategory]=useState('all');const [country,setCountry]=useState('all');const [term,setTerm]=useState('');const [search,setSearch]=useState('');
 const [items,setItems]=useState<NewsArticle[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [lastSync,setLastSync]=useState<{completed_at:string;status:string}|null>(null);
 const load=useCallback(async(signal?:AbortSignal)=>{
  setLoading(true);setError('');
  try{
   const p=new URLSearchParams({category,country,q:search});const response=await fetch('/api/news?'+p.toString(),{cache:'no-store',credentials:'same-origin',signal});
   const result=await response.json();if(!response.ok)throw new Error(result.error||'Não foi possível consultar notícias.');
   if(!Array.isArray(result.news))throw new Error('Resposta inválida do servidor.');
   if(!signal?.aborted){setItems(result.news);setLastSync(result.lastSync||null)}
  }catch(e){if(!signal?.aborted)setError(e instanceof Error?e.message:'Falha inesperada.')}finally{if(!signal?.aborted)setLoading(false)}
 },[category,country,search]);
 useEffect(()=>{const controller=new AbortController();void load(controller.signal);return()=>controller.abort()},[load]);
 return <div className="news-page">
  <section className="news-hero"><div className="news-hero-intro"><span className="eyebrow">INTELIGÊNCIA COMERCIAL • FONTES OFICIAIS</span><h1>Comex News</h1><p>O que acontece no mundo pode transformar uma operação internacional. Acompanhe acontecimentos comerciais com fontes verificáveis e explicações educacionais.</p><div className="news-hero-tags"><span><Globe2 size={16}/> Países e mercados</span><span><TrendingUp size={16}/> Impactos no Comex</span></div></div><div className="news-hero-icon"><Newspaper size={72} strokeWidth={1.3}/></div></section>
  <section className="news-filter-panel" aria-label="Pesquisar notícias">
   <form onSubmit={e=>{e.preventDefault();setSearch(term.trim().slice(0,80))}} className="news-search-form"><label className="field"><span className="label">Pesquisar por assunto</span><div className="news-search-input"><Search size={18}/><input className="input" placeholder="Ex.: tarifas, exportações, portos..." maxLength={80} value={term} onChange={e=>setTerm(e.target.value)}/></div></label><button className="btn" type="submit">Buscar</button></form>
   <div className="news-filters"><label className="field"><span className="label">País ou região</span><select className="select" value={country} onChange={e=>setCountry(e.target.value)}><option value="all">Todos os países</option>{Object.entries(COUNTRY_LABELS).sort((a,b)=>a[1].localeCompare(b[1],'pt-BR')).map(([code,name])=><option key={code} value={code}>{name}</option>)}</select></label><label className="field"><span className="label">Categoria</span><select className="select" value={category} onChange={e=>setCategory(e.target.value)}><option value="all">Todos os assuntos</option>{Object.entries(NEWS_CATEGORIES).map(([code,name])=><option value={code} key={code}>{name}</option>)}</select></label><button className="btn secondary news-refresh" type="button" disabled={loading} onClick={()=>void load()}><RefreshCcw size={15}/> Atualizar</button></div>
  </section>
  <div className="news-section-heading"><div><h2>Notícias do comércio internacional</h2><p>{loading?'Carregando notícias oficiais...':`${items.length} ${items.length===1?'publicação encontrada':'publicações encontradas'}`}</p></div>{lastSync?.completed_at&&<small>Última consulta de fontes: {new Date(lastSync.completed_at).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})}</small>}</div>
  {error&&<div className="alert" role="alert">{error} <button type="button" onClick={()=>void load()} className="btn secondary">Tentar novamente</button></div>}
  {!error&&loading&&<div className="panel" role="status">Consultando a base de notícias...</div>}
  {!error&&!loading&&!items.length&&<section className="news-empty"><Newspaper size={38}/><h2>Nenhuma notícia encontrada</h2><p>Se os feeds ainda não foram atualizados, novas publicações aparecerão depois da primeira sincronização. Experimente também selecionar todos os países e assuntos.</p><button className="btn secondary" type="button" onClick={()=>{setCategory('all');setCountry('all');setSearch('');setTerm('')}}>Limpar filtros</button></section>}
  {!error&&!loading&&!!items.length&&<div className="news-grid">{items.map(item=><article key={item.id} className={'news-card'+(item.featured?' news-featured':'')}>
   <div className="news-card-top"><span className="news-category">{NEWS_CATEGORIES[item.category]||'Comércio global'}</span>{item.featured&&<span className="news-featured-tag">Destaque</span>}</div>
   <h3 lang="pt-BR">{item.title}</h3><p className="news-summary" lang="pt-BR">{item.summary||'Consulte a publicação original para conhecer os detalhes.'}</p>{item.translation_provider==='mymemory'&&<span className="news-translation-label">Tradução automática para português · confira a fonte original</span>}
   <div className="news-impact"><strong><TrendingUp size={15}/> Como isso pode afetar o Comex?</strong><p>{item.impact||'Analise possíveis efeitos de acordo com país, produto e tipo de operação.'}</p><small>Análise educacional — não é orientação fiscal ou confirmação de impacto real.</small></div>
   <div className="news-country-tags">{(Array.isArray(item.countries)?item.countries:[]).slice(0,5).map(code=><span key={code}>{COUNTRY_LABELS[code]||code}</span>)}</div>
   <div className="news-card-footer"><div className="news-card-source"><strong><ShieldCheck size={14}/>{item.source_name}</strong><span><CalendarDays size={13}/>{formatDate(item.published_at)}</span></div><a href={item.source_url} target="_blank" rel="noopener noreferrer" className="news-source-link">Ler na fonte <ExternalLink size={15}/></a></div>
  </article>)}</div>}
  <section className="news-disclaimer"><ShieldCheck size={20}/><div><strong>Informação com responsabilidade</strong><p>Os títulos e resumos são exibidos em português. Traduções automáticas podem conter imprecisões: confirme os detalhes na fonte original. Os possíveis impactos são explicações gerais e não confirmam que uma medida já esteja em vigor. Antes de negociar, classificar produtos ou calcular tributos, consulte as regras oficiais atualizadas.</p></div><ArrowRight size={18}/></section>
 </div>
}
