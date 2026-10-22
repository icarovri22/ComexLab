'use client';
import {accountFetch} from '../lib/account-fetch';
import {useEffect,useMemo,useRef,useState} from 'react';
import {ExternalLink,TrendingUp} from 'lucide-react';
import {NEWS_CATEGORIES,type NewsArticle} from '../lib/comex-news';
import {EXCHANGE_CURRENCIES,type ExchangePoint} from '../lib/news-indicators';
function ExchangeChart({currency,refreshKey}:{currency:'USD'|'EUR';refreshKey:string}){
 const config=EXCHANGE_CURRENCIES[currency];
 const [points,setPoints]=useState<ExchangePoint[]>([]);const [error,setError]=useState('');const [loading,setLoading]=useState(true);const [active,setActive]=useState<number|null>(null);
 const host=useRef<HTMLDivElement>(null);const [width,setWidth]=useState(520);
 useEffect(()=>{const node=host.current;if(!node)return;const observer=new ResizeObserver(entries=>setWidth(Math.max(240,entries[0].contentRect.width)));observer.observe(node);return()=>observer.disconnect();},[]);
 useEffect(()=>{
  let controller:AbortController|undefined;
  const refresh=async()=>{
   controller?.abort();const request=new AbortController();controller=request;
   setLoading(true);setError('');
   try{
    const response=await accountFetch('/api/news/indicators?currency='+currency,{cache:'no-store',signal:request.signal});const data=await response.json();
    if(!response.ok)throw Error(data.error||'Indicador indisponível');
    if(!Array.isArray(data.points)||data.points.length<2)throw Error('Sem dados suficientes');
    if(!request.signal.aborted){setPoints(data.points);setActive(null);}
   }catch(e){if(!request.signal.aborted)setError(e instanceof Error?e.message:'Indicador indisponível');}
   finally{if(!request.signal.aborted)setLoading(false);}
  };
  const visible=()=>{if(document.visibilityState==='visible')void refresh();};
  void refresh();const timer=setInterval(visible,15*60*1000);document.addEventListener('visibilitychange',visible);
  return()=>{controller?.abort();clearInterval(timer);document.removeEventListener('visibilitychange',visible);};
 },[currency,refreshKey]);
 const values=points.map(p=>p.value);const min=Math.min(...values),max=Math.max(...values);const pad=Math.max((max-min)*.15,.01);const low=min-pad,high=max+pad;
 const left=56,right=width-15,top=20,bottom=178;const x=(i:number)=>left+(right-left)*i/Math.max(1,points.length-1);const y=(value:number)=>bottom-(value-low)/(high-low)*(bottom-top);
 const selected=points[active??points.length-1];const day=(date:string)=>date.slice(8,10)+'/'+date.slice(5,7);const money=(value:number)=>value.toLocaleString('pt-BR',{minimumFractionDigits:4,maximumFractionDigits:4});
 return <article className="news-chart-panel"><div className="news-chart-title"><span className="eyebrow">BANCO CENTRAL · SGS {config.series}</span><h2><TrendingUp size={19}/> {config.name} em perspectiva</h2></div><p>PTAX de venda · até 30 observações disponíveis</p><div ref={host} className="news-fx-chart">{loading?<p role="status">Consultando o Banco Central…</p>:error?<p role="status">{error}</p>:<><div className="news-fx-value" aria-live="polite"><strong>R$ {selected?money(selected.value):'—'}</strong><span>{selected?day(selected.date)+'/'+selected.date.slice(0,4):''} · por {config.symbol} 1</span></div><svg width="100%" height="220" viewBox={`0 0 ${width} 220`} role="img" aria-label={`Evolução da PTAX de venda em reais por ${config.name}. Consulte os valores na tabela abaixo.`}>{[0,.5,1].map(ratio=>{const value=low+(high-low)*ratio;return <g key={ratio}><line x1={left} x2={right} y1={y(value)} y2={y(value)} className="news-chart-grid"/><text x={left-8} y={y(value)+4} textAnchor="end">{value.toFixed(2).replace('.',',')}</text></g>})}<text x={left} y={12}>{`R$/${config.symbol}`}</text><polyline points={points.map((p,i)=>`${x(i)},${y(p.value)}`).join(' ')} className="news-chart-line"/>{[...new Set([0,Math.floor((points.length-1)/2),points.length-1])].map(i=><text key={i} x={x(i)} y={203} textAnchor={i===0?'start':i===points.length-1?'end':'middle'}>{day(points[i].date)}</text>)}{points.map((p,i)=><circle key={p.date} cx={x(i)} cy={y(p.value)} r={i===(active??points.length-1)?5:3} className="news-chart-point" onMouseEnter={()=>setActive(i)}><title>{p.date}: R$ {money(p.value)}</title></circle>)}</svg><details className="news-data-table"><summary>Ver valores e datas</summary><table><caption>PTAX de venda · reais por {config.name}</caption><thead><tr><th>Data</th><th>{`R$/${config.symbol}`}</th></tr></thead><tbody>{points.map(p=><tr key={p.date}><td>{day(p.date)+'/'+p.date.slice(0,4)}</td><td>{money(p.value)}</td></tr>)}</tbody></table></details></>}</div><a href={config.source} target="_blank" rel="noopener noreferrer">Fonte e metodologia: Banco Central <ExternalLink size={13}/></a><small>Atualização automática da consulta a cada 15 minutos enquanto a página estiver visível. Referência diária, sem cotação em tempo real. Fins de semana e feriados podem não ter observações. A taxa da sua operação pode ser diferente.</small></article>;
}
export default function NewsDashboard({items,refreshKey}:{items:NewsArticle[];refreshKey:string}){
 const categories=useMemo(()=>Object.entries(NEWS_CATEGORIES).map(([key,label])=>({key,label,count:items.filter(item=>item.category===key).length})).filter(x=>x.count>0).sort((a,b)=>b.count-a.count),[items]);
 const maxCount=Math.max(1,...categories.map(x=>x.count));
 return <section className="news-dashboard" aria-label="Indicadores e cobertura"><ExchangeChart currency="USD" refreshKey={refreshKey}/><ExchangeChart currency="EUR" refreshKey={refreshKey}/><article className="news-chart-panel news-coverage-panel"><span className="eyebrow">PANORAMA DA SELEÇÃO</span><h2>Assuntos em evidência</h2><p>Quantidade de notícias por categoria nos resultados exibidos.</p>{categories.length?<div className="news-category-chart">{categories.map(item=><div key={item.key}><div><span>{item.label}</span><strong>{item.count}</strong></div><div className="news-category-track" role="img" aria-label={`${item.label}: ${item.count} notícias`}><div style={{width:`${item.count/maxCount*100}%`}}/></div></div>)}</div>:<p>O gráfico será preenchido quando houver notícias nesta seleção.</p>}<small>Base: até 80 publicações que atendem aos filtros. A contagem mede cobertura editorial, sem representar o tamanho ou o desempenho de um mercado.</small></article></section>;
}
