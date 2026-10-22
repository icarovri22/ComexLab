'use client';
import {accountFetch} from '../../lib/account-fetch';
import {useEffect,useState,type FormEvent} from 'react';
import Link from 'next/link';
import {CheckCircle2,Copy,KeyRound,Mail,ShieldCheck} from 'lucide-react';
export default function RecoveryPage(){
 const [method,setMethod]=useState<'email'|'code'>('email');const [enabled,setEnabled]=useState<boolean|null>(null);
 const [email,setEmail]=useState('');const [sent,setSent]=useState(false);
 const [identity,setIdentity]=useState('');const [code,setCode]=useState('');const [password,setPassword]=useState('');const [repeat,setRepeat]=useState('');
 const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [newCode,setNewCode]=useState('');
 useEffect(()=>{accountFetch('/api/email-recovery',{cache:'no-store'}).then(r=>r.json()).then(d=>{setEnabled(d.emailRecoveryEnabled===true);if(!d.emailRecoveryEnabled)setMethod('code')}).catch(()=>{setEnabled(false);setMethod('code')})},[]);
 async function requestEmail(e:FormEvent){e.preventDefault();setError('');setBusy(true);try{
  const r=await accountFetch('/api/email-recovery',{method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',body:JSON.stringify({mode:'request',email})});
  const d=await r.json();if(!r.ok)throw Error(d.error||'Não foi possível processar sua solicitação.');setSent(true);
 }catch(err){setError(err instanceof Error?err.message:'Falha ao solicitar recuperação.')}finally{setBusy(false)}}
 async function submitCode(e:FormEvent){e.preventDefault();setError('');if(password!==repeat){setError('As senhas não coincidem.');return;}setBusy(true);
  try{const res=await accountFetch('/api/recovery',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({identity,code,password})});const data=await res.json();if(!res.ok)throw Error(data.error||'Falha na redefinição.');setNewCode(String(data.recoveryCode));setPassword('');setRepeat('');setCode('');}
  catch(err){setError(err instanceof Error?err.message:'Erro inesperado.')}finally{setBusy(false)}
 }
 return <div className="security-standalone"><main className="security-card"><span className="auth-eyebrow"><ShieldCheck size={16}/> COMEXHUB · RECUPERAÇÃO</span>
  <h1>Esqueceu sua senha?</h1>
  {newCode?<><p>Senha alterada. As sessões anteriores foram invalidadas. <strong>Guarde seu novo código de recuperação:</strong></p><div className="security-secret">{newCode}</div><button type="button" className="auth-outline" onClick={()=>navigator.clipboard.writeText(newCode)}><Copy size={16}/> Copiar código</button><p className="security-warning">O código aparece uma única vez. Não compartilhe.</p><Link className="auth-action" href="/login">Ir para o login</Link></>:
  <>
   <div className="auth-switch" role="group" aria-label="Método de recuperação" style={{marginBottom:20}}>
    <button type="button" aria-pressed={method==='email'} className={method==='email'?'is-active':''} onClick={()=>{setMethod('email');setError('')}}>Por e-mail</button>
    <button type="button" aria-pressed={method==='code'} className={method==='code'?'is-active':''} onClick={()=>{setMethod('code');setError('')}}>Código pessoal</button>
   </div>
   {method==='email'?(enabled===null?<p>Verificando disponibilidade da recuperação por e-mail...</p>:
     enabled?sent?<><p className="security-status"><CheckCircle2 size={18}/> Se houver uma conta com esse e-mail, enviamos um link de recuperação.</p><p>Verifique a caixa de entrada e a pasta de spam. O link expira em 15 minutos. Você pode solicitar outro depois de alguns minutos.</p></>:
    <><p>Informe seu e-mail cadastrado para receber um link de redefinição de senha. Não é necessário saber a senha anterior.</p><form onSubmit={requestEmail}>
      <label className="auth-field">E-mail cadastrado<input type="email" autoComplete="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@exemplo.com"/></label>
      {error&&<div className="auth-notice" role="alert">{error}</div>}
      <button className="auth-action" type="submit" disabled={busy}><Mail size={17}/>{busy?'Enviando...':'Enviar link de recuperação'}</button>
    </form><p className="security-warning">O link é válido por 15 minutos, só pode ser usado uma vez e funciona mesmo que você esteja desconectado.</p></>:
    <><p className="security-warning">A recuperação por e-mail ainda não está configurada. Continue com seu código pessoal de recuperação.</p><button type="button" className="auth-outline" onClick={()=>setMethod('code')}>Usar código pessoal</button></>)
   :<><p>Informe seu usuário ou e-mail e o <strong>código pessoal de recuperação</strong> salvo anteriormente. Não é necessário saber sua senha atual.</p><form onSubmit={submitCode}>
    <label className="auth-field">Usuário ou e-mail<input autoComplete="username" required value={identity} onChange={e=>setIdentity(e.target.value)}/></label>
    <label className="auth-field">Código pessoal<input autoComplete="off" required placeholder="XXXXXX-XXXXXX-XXXXXX-XXXXXX" value={code} onChange={e=>setCode(e.target.value)}/></label>
    <label className="auth-field">Nova senha<input type="password" autoComplete="new-password" required minLength={10} value={password} onChange={e=>setPassword(e.target.value)}/></label>
    <label className="auth-field">Confirme a senha<input type="password" autoComplete="new-password" required minLength={10} value={repeat} onChange={e=>setRepeat(e.target.value)}/></label>
    {error&&<div className="auth-notice" role="alert">{error}</div>}
    <button className="auth-action" disabled={busy}><KeyRound size={17}/>{busy?'Aguarde...':'Redefinir senha'}</button>
   </form><p className="security-warning">Sem o código de recuperação ou acesso ao e-mail cadastrado, a senha não poderá ser redefinida automaticamente.</p></>}
   <div className="security-links"><Link href="/login">Voltar ao login</Link></div>
  </>}
 </main></div>;
}
