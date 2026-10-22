'use client';
import {accountFetch} from '../../lib/account-fetch';
import {useEffect,useState,type FormEvent} from 'react';
import Link from 'next/link';
import {CheckCircle2,KeyRound,ShieldCheck} from 'lucide-react';

export default function ResetFromEmail(){
 const [token,setToken]=useState('');const [valid,setValid]=useState<boolean|null>(null);const [message,setMessage]=useState('');const [newPassword,setNewPassword]=useState('');const [repeat,setRepeat]=useState('');const [saving,setSaving]=useState(false);const [done,setDone]=useState(false);
 useEffect(()=>{
  const raw=new URLSearchParams(window.location.search).get('token')||'';
  if(!/^[a-f0-9]{64}$/.test(raw)){setValid(false);return;}
  setToken(raw);
  // Remove sensitive token from address bar / browser history after capturing it.
  window.history.replaceState(null,'',window.location.pathname);
  accountFetch('/api/email-recovery',{method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',body:JSON.stringify({mode:'validate',token:raw})})
   .then(async r=>{const data=await r.json();if(!r.ok)throw Error(data.error||'Não foi possível validar o link.');setValid(data.valid===true)})
   .catch(error=>{setValid(false);setMessage(error instanceof Error?error.message:'Falha ao validar link.')});
 },[]);
 async function submit(e:FormEvent){e.preventDefault();setMessage('');if(newPassword!==repeat){setMessage('As senhas não coincidem.');return;}setSaving(true);
  try{const r=await accountFetch('/api/email-recovery',{method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',body:JSON.stringify({mode:'reset',token,password:newPassword})});const d=await r.json();if(!r.ok)throw Error(d.error||'Não foi possível alterar sua senha.');setDone(true);setToken('');setNewPassword('');setRepeat('');}
  catch(error){setMessage(error instanceof Error?error.message:'Falha ao alterar senha.')}finally{setSaving(false)}
 }
 return <div className="security-standalone"><main className="security-card"><span className="auth-eyebrow"><ShieldCheck size={15}/> COMEXHUB · RECUPERAÇÃO POR E-MAIL</span><h1>Crie sua nova senha</h1>
  {done?<><p className="security-status"><CheckCircle2 size={17}/> Sua senha foi atualizada. As sessões antigas não poderão ser utilizadas.</p><Link href="/login" className="auth-action">Entrar no ComexHub</Link></>:
   valid===null?<p>Validando seu link de recuperação...</p>:
   !valid?<><p className="security-warning">{message||'Este link não é válido ou expirou.'}</p><Link href="/recuperar" className="auth-action">Solicitar novo link</Link></>:
   <><p>Seu link foi validado. Informe uma nova senha para concluir a recuperação.</p><form onSubmit={submit}>
    <label className="auth-field">Nova senha<input type="password" autoComplete="new-password" required minLength={10} maxLength={72} value={newPassword} onChange={e=>setNewPassword(e.target.value)}/></label>
    <label className="auth-field">Confirme a nova senha<input type="password" autoComplete="new-password" required minLength={10} maxLength={72} value={repeat} onChange={e=>setRepeat(e.target.value)}/></label>
    {message&&<p role="alert" className="auth-notice">{message}</p>}
    <button type="submit" disabled={saving} className="auth-action"><KeyRound size={17}/>{saving?'Aguarde...':'Salvar nova senha'}</button>
   </form><p className="security-warning">O link vence em 15 minutos e só pode ser utilizado uma vez. Ele não exige estar conectado.</p></>}
 </main></div>;
}
