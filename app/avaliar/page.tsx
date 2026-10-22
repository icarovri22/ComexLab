'use client';
import {accountFetch} from '../../lib/account-fetch';
import {useCallback,useEffect,useState} from 'react';
import {CheckCircle2,MessageSquareHeart,Send,Star,RotateCcw} from 'lucide-react';
import {MAX_FEEDBACK_LENGTH} from '../../lib/feedback';

type Entry={id:string;rating:number|null;suggestion:string;status:'new'|'reviewed';created_at:string};
const formatDate=(value:string)=>new Date(value).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'});
export default function AvaliarPage(){
 const [rating,setRating]=useState<number|null>(null);
 const [suggestion,setSuggestion]=useState('');
 const [entries,setEntries]=useState<Entry[]>([]);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [success,setSuccess]=useState(false);
 const load=useCallback(async()=>{
  try{const res=await accountFetch('/api/feedback',{cache:'no-store'});const body=await res.json();if(!res.ok)throw Error(body?.error||'Falha ao carregar.');setEntries(Array.isArray(body?.feedback)?body.feedback:[])}
  catch(e){setError(e instanceof Error?e.message:'Falha ao consultar envios.')}finally{setLoading(false)}
 },[]);
 useEffect(()=>{void load()},[load]);
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setError('');setSuccess(false);
  if(!rating&&!suggestion.trim()){setError('Escolha uma nota ou escreva uma sugestão.');return}
  setBusy(true);
  try{
   const r=await accountFetch('/api/feedback',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({rating,suggestion})});
   const data=await r.json();if(!r.ok)throw Error(data?.error||'Falha ao enviar.');
   setSuccess(true);setRating(null);setSuggestion('');await load();
  }catch(e){setError(e instanceof Error?e.message:'Falha no envio.')}
  finally{setBusy(false)}
 }
 return <div className="feedback-page">
  <div className="feedback-hero"><span className="eyebrow">SUA OPINIÃO IMPORTA</span><h1>Avalie o ComexHub</h1><p>Conte o que está funcionando e o que podemos melhorar. Sua avaliação será enviada para a equipe responsável, no painel administrativo.</p></div>
  <div className="feedback-columns">
   <section className="panel feedback-form-panel"><div className="feedback-panel-title"><MessageSquareHeart size={24}/><div><h2>Deixe sua avaliação ou sugestão</h2><p>Você pode dar uma nota, escrever uma sugestão ou fazer as duas coisas.</p></div></div>
    <form onSubmit={e=>void submit(e)}>
     <fieldset className="feedback-rating"><legend>Como você avalia o aplicativo?</legend><div className="feedback-stars" aria-label="Nota de 1 a 5 estrelas">{[1,2,3,4,5].map(v=><button type="button" key={v} aria-label={`${v} ${v===1?'estrela':'estrelas'}`} aria-pressed={rating===v} onClick={()=>{setRating(v);setSuccess(false)}} className={rating!==null&&v<=rating?'selected':''}><Star size={29} fill={rating!==null&&v<=rating?'currentColor':'none'}/></button>)}</div><p className="feedback-rating-label">{rating?`${rating} de 5 estrelas`:'A nota é opcional se você enviar uma sugestão.'}</p>{rating!==null&&<button type="button" className="feedback-clear" onClick={()=>setRating(null)}>Limpar nota</button>}</fieldset>
     <label className="field feedback-message"><span className="label">Sugestão ou comentário (opcional se já houver nota)</span><textarea className="input" maxLength={MAX_FEEDBACK_LENGTH} rows={6} placeholder="O que podemos melhorar? O que você mais gostou?" value={suggestion} onChange={e=>{setSuggestion(e.target.value);setSuccess(false)}}/></label>
     <div className="feedback-submit-row"><span className="help">{suggestion.length}/{MAX_FEEDBACK_LENGTH} caracteres</span><button className="btn" type="submit" disabled={busy||(!rating&&!suggestion.trim())}><Send size={16}/>{busy?'Enviando...':'Enviar feedback'}</button></div>
     {error&&<div className="alert" role="alert">{error}</div>}{success&&<div className="success" role="status"><CheckCircle2 size={18}/>Sua mensagem foi recebida e está disponível para a administração.</div>}
     <p className="help">Sua opinião fica vinculada à sua conta e será vista apenas pela equipe administrativa. Limite de 5 envios por 24 horas e intervalo mínimo de 1 minuto.</p>
    </form>
   </section>
   <section className="panel feedback-history"><div className="flex-head"><div><h2>Seus envios</h2><p className="muted">Acompanhe suas últimas mensagens.</p></div><button type="button" className="btn secondary" onClick={()=>{setLoading(true);void load()}} disabled={loading}><RotateCcw size={16}/>Atualizar</button></div>
    {loading?<p className="muted">Carregando...</p>:entries.length?<div className="feedback-history-list">{entries.map(entry=><article key={entry.id} className="feedback-history-entry"><div className="feedback-history-meta"><small>{formatDate(entry.created_at)}</small><span className={entry.status==='reviewed'?'admin-pill active':'admin-pill'}>{entry.status==='reviewed'?'Analisado':'Recebido'}</span></div>{entry.rating!==null&&<div className="feedback-history-stars" aria-label={`${entry.rating} de 5 estrelas`}>{'★'.repeat(entry.rating)}<span>{'☆'.repeat(5-entry.rating)}</span></div>}{entry.suggestion&&<p>{entry.suggestion}</p>}</article>)}</div>:<p className="muted">Você ainda não enviou nenhuma avaliação ou sugestão.</p>}
   </section>
  </div>
 </div>;
}
