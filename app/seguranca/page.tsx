'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {ShieldCheck,Copy,KeyRound,CheckCircle2,LockKeyhole,Mail,Info} from 'lucide-react';

type Status={username:string;isAdminAccount:boolean;recoveryEnabled:boolean;email:string|null;showSecurityReminder:boolean};
export default function SecurityPage(){
 const reminderDialog=useRef<HTMLDialogElement>(null);
 const [status,setStatus]=useState<Status|null>(null);
 const [loading,setLoading]=useState(false);
 const [password,setPassword]=useState('');
 const [newPassword,setNewPassword]=useState('');
 const [recovery,setRecovery]=useState('');
 const [email,setEmail]=useState('');
 const [message,setMessage]=useState('');
 const [error,setError]=useState('');
 const refresh=()=>fetch('/api/security',{cache:'no-store'}).then(async r=>{
  const data=await r.json();if(!r.ok)throw Error(data.error||'Acesso negado');setStatus(data);
  if(data.showSecurityReminder===true){
   const response=await fetch('/api/security',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'reminder.claim'})});
   const result=await response.json();
   if(response.ok&&result.show===true&&reminderDialog.current&&!reminderDialog.current.open)reminderDialog.current.showModal();
  }
 }).catch(e=>setError(e instanceof Error?e.message:'Falha ao consultar conta'));
 useEffect(()=>{void refresh()},[]);
 async function action(mode:'recovery.rotate'|'password.change'|'email.add'){
  setLoading(true);setError('');setMessage('');
  try{
   const r=await fetch('/api/security',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode,password,newPassword,email})});
   const data=await r.json();if(!r.ok)throw Error(data.error||'Não foi possível concluir a operação.');
   if(mode==='recovery.rotate'){setRecovery(data.recoveryCode);setMessage('Novo código de recuperação gerado. O anterior foi invalidado.');}
   if(mode==='password.change'){setMessage('Senha atualizada. Sessões antigas invalidadas.');}
   if(mode==='email.add'){setMessage('E-mail vinculado. Confira que o endereço está correto para a futura recuperação por e-mail.');setEmail('');}
   setPassword('');setNewPassword('');await refresh();
  }catch(e){setError(e instanceof Error?e.message:'Erro inesperado')}
  finally{setLoading(false)}
 }
 const copy=(s:string)=>navigator.clipboard.writeText(s);
 return <div className="security-layout">
 <dialog ref={reminderDialog} className="security-reminder-dialog" aria-labelledby="security-reminder-title" aria-describedby="security-reminder-description">
  <div className="security-reminder-icon"><ShieldCheck aria-hidden="true" size={28}/></div>
  <h2 id="security-reminder-title">Atenção ao seu código de recuperação</h2>
  <div id="security-reminder-description">
   <p><strong>Guarde seu código de recuperação de senha em local seguro.</strong> Ele é mostrado somente quando gerado e poderá ser necessário se você esquecer a senha. Não compartilhe o código com outras pessoas.</p>
   <p className="security-reminder-email"><Info aria-hidden="true" size={18}/><span><strong>Recuperação por e-mail ainda em desenvolvimento.</strong> O envio de links por e-mail não está disponível no momento. Não dependa dessa opção para recuperar o acesso.</span></p>
   <p>Se ainda não possui o código, gere um nesta página enquanto consegue acessar a sua conta.</p>
  </div>
  <button type="button" className="security-reminder-acknowledge" onClick={()=>reminderDialog.current?.close()}>Entendi, continuar</button>
 </dialog>
 <div className="security-card security-wide"><span className="auth-eyebrow"><ShieldCheck size={16}/> PROTEÇÃO DE CONTA</span><h1>Segurança da sua conta</h1><p>Proteja sua conta com uma senha exclusiva, gerencie seus códigos de recuperação e altere sua senha quando necessário.</p>
 {status&&<p className="security-status">Conta: <strong>{status.username}</strong> · {status.isAdminAccount?'Administrador':'Estudante'} {status.isAdminAccount&&<strong> · Acesso administrativo com senha</strong>}</p>}
 {error&&<div className="auth-notice" role="alert">{error}</div>}{message&&<div className="auth-tip"><CheckCircle2 size={16}/>{message}</div>}
 {recovery&&<div className="security-highlight"><strong>Seu novo código de recuperação de senha:</strong><div className="security-secret">{recovery}</div><button className="auth-outline" onClick={()=>void copy(recovery)}><Copy size={16}/> Copiar código</button><p>Guarde em local seguro. Ele é mostrado apenas uma vez e permite redefinir a senha sem confirmação de e-mail.</p></div>}
 <section className="security-section"><h2><Mail size={20}/> E-mail para recuperação</h2>{status?.email?<p>E-mail da conta: <strong>{status.email}</strong></p>:<><p>Sua conta foi criada antes do cadastro obrigatório de e-mail. Vincule um endereço ao qual você tenha acesso. Digite sua senha atual para autorizar a mudança.</p><label className="auth-field">Seu e-mail<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label><label className="auth-field">Senha atual<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="auth-outline" disabled={loading||!password||!email.includes('@')} onClick={()=>void action('email.add')}>Vincular e-mail à conta</button><p className="security-warning">A recuperação por e-mail ainda está em desenvolvimento e não envia links neste momento. Confira o endereço cadastrado para uso futuro e guarde seu código de recuperação.</p></>}</section>
 <section className="security-section"><h2><KeyRound size={20}/> Código de recuperação da senha</h2><p>Gere um código para usar caso esqueça sua senha. Guarde-o fora do ComexHub. Ao gerar outro, o anterior deixa de funcionar.</p><label className="auth-field">Senha atual<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="auth-outline" disabled={loading||!password} onClick={()=>void action('recovery.rotate')}>Gerar novo código de recuperação</button></section>
 <section className="security-section"><h2><LockKeyhole size={20}/> Alterar senha</h2><label className="auth-field">Senha atual<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><label className="auth-field">Nova senha<input type="password" autoComplete="new-password" minLength={10} value={newPassword} onChange={e=>setNewPassword(e.target.value)}/></label><button className="auth-outline" disabled={loading||!password||newPassword.length<10} onClick={()=>void action('password.change')}>Alterar senha</button></section>
 <div className="security-links"><Link href="/">Voltar à plataforma</Link>{status?.isAdminAccount&&<Link href="/admin">Abrir painel administrativo</Link>}</div>
 </div></div>;
}
