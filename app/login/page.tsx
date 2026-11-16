'use client';
import {useLanguage} from '../../components/LanguageProvider';
import {accountFetch} from '../../lib/account-fetch';

import {useEffect,useState,type FormEvent} from 'react';
import Link from 'next/link';
import {readLoginPalette,loginPaletteKey} from '../../lib/appearance';
import BrandLogo from '../../components/BrandLogo';
import {ArrowRight,BookOpen,CheckCircle2,Eye,EyeOff,Globe2,LockKeyhole,LogOut,ShieldCheck,UserRound,UserPlus} from 'lucide-react';

type Mode='login'|'register';
type Session={ready:boolean;loggedIn:boolean;username?:string;emailConfirmation?:boolean};

function returnPath(){
  const next=new URLSearchParams(window.location.search).get('next');
  return next&&next.startsWith('/')&&!next.startsWith('//')&&!next.startsWith('/login')&&!next.includes('\\')?next:'/';
}

export default function Login(){
 const {t,language,setLanguage}=useLanguage();
  const [mode,setMode]=useState<Mode>('login');
  const [username,setUsername]=useState('');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [repeat,setRepeat]=useState('');
  const [showPassword,setShowPassword]=useState(false);
  const [loading,setLoading]=useState(false);
  const [me,setMe]=useState<Session|null>(null);
  const [message,setMessage]=useState('');
  const [recoveryCode,setRecoveryCode]=useState('');

  useEffect(()=>{
    accountFetch('/api/auth',{cache:'no-store',credentials:'same-origin'})
      .then(r=>{if(!r.ok)throw Error('Falha na conexão.');return r.json()})
      .then(setMe)
      .catch(()=>setMe({ready:false,loggedIn:false}));
  },[]);

  useEffect(()=>{
    const apply=()=>{try{document.documentElement.dataset.palette=readLoginPalette(window.localStorage)}catch{}};
    const sync=(event:StorageEvent)=>{if(event.key===loginPaletteKey||event.key===null)apply()};
    apply();window.addEventListener('storage',sync);
    return ()=>{window.removeEventListener('storage',sync);document.documentElement.dataset.palette='original'};
  },[]);

  async function send(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setMessage('');
    if(mode==='register'&&password!==repeat){setMessage('As senhas não coincidem.');return;}
    setLoading(true);
    try{
      const response=await accountFetch('/api/auth',{
        method:'POST',credentials:'same-origin',cache:'no-store',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({mode,username,email:mode==='register'?email:undefined,password})
      });
      const body=await response.json();
      if(!response.ok)throw new Error(body.error||'Não foi possível autenticar.');
      if(body.recoveryCode){setRecoveryCode(String(body.recoveryCode));setPassword('');setRepeat('');return;}
      const check=await accountFetch('/api/auth',{cache:'no-store',credentials:'same-origin'});
      const session:Session|null=check.ok?await check.json():null;
      setPassword('');setRepeat('');
      if(!session?.loggedIn){
        setMode('login');setMe({ready:true,loggedIn:false});
        setMessage('Cadastro realizado, mas a sessão não foi confirmada. Verifique se os cookies estão habilitados e entre com a conta criada.');
        return;
      }
      setMe(session);
      window.location.replace(returnPath());
    }catch(error){setMessage(error instanceof Error?error.message:'Erro inesperado.');}
    finally{setLoading(false);}
  }

  async function logout(){
    setLoading(true);setMessage('');
    try{
      const response=await accountFetch('/api/auth',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'logout'})});
      if(!response.ok)throw Error('Não foi possível encerrar a sessão.');
      setMe({ready:true,loggedIn:false});setPassword('');setMessage('Sessão encerrada com sucesso.');
    }catch(error){setMessage(error instanceof Error?error.message:'Falha ao sair.');}
    finally{setLoading(false);}
  }

  return <div className="auth-page">
    <header className="auth-header">
      <Link href="/" className="auth-logo" aria-label="ComexHub — início"><BrandLogo/></Link>
      <div className="auth-header-utilities"><span className="auth-header-caption">{""+t("Plataforma de aprendizagem em Comércio Exterior")+""}</span></div>
    </header>
    <main className="auth-content">
      <section className="auth-aside" aria-label="Apresentação do ComexHub">
        <span className="auth-overline"><Globe2 size={15}/>{" "+t("BEM-VINDO AO COMEXHUB")+""}</span>
        <h1>{""+t("O comércio exterior começa por aqui.")+""}</h1>
        <p>{""+t("Uma plataforma para aprender, consultar informações e simular operações internacionais com mais clareza.")+""}</p>
        <div className="auth-benefits">
          <div><span><BookOpen size={19}/></span><div><strong>{""+t("Estudos na prática")+""}</strong><small>{""+t("Aulas, exercícios e casos aplicados.")+""}</small></div></div>
          <div><span><ArrowRight size={19}/></span><div><strong>{""+t("Simuladores completos")+""}</strong><small>{""+t("Importação, exportação e Incoterms® 2020.")+""}</small></div></div>
          <div><span><ShieldCheck size={19}/></span><div><strong>{""+t("Acesso pessoal")+""}</strong><small>{""+t("Seus dados e sua senha ficam protegidos.")+""}</small></div></div>
        </div>
        <p className="auth-aside-foot">{""+t("Projeto desenvolvido por")+" "}<strong>Hanna Roncel, Ícaro Pinheiro e Mirelly Lopes</strong>.</p>
      </section>
      <section className="auth-right" aria-label="Acesso à conta">
        <div className="auth-panel">
          {recoveryCode?<>
            <div className="auth-circle"><CheckCircle2 size={25}/></div>
            <h2>{""+t("Conta criada!")+""}</h2>
            <p className="auth-description">{""+t("Salve o código abaixo para poder redefinir sua senha caso a esqueça. Ele é exibido uma única vez e não será enviado por e-mail.")+""}</p>
            <div className="security-secret">{recoveryCode}</div>
            <button className="auth-outline" type="button" onClick={()=>navigator.clipboard.writeText(recoveryCode)}>{""+t("Copiar código de recuperação")+""}</button>
            <p className="security-warning">{""+t("Guarde em um gerenciador de senhas ou local protegido. Nunca compartilhe esse código.")+""}</p>
            <button className="auth-action" onClick={()=>window.location.replace('/')}>{""+t("Salvei o código. Acessar plataforma")+" "}<ArrowRight size={18}/></button>
          </>:me?.loggedIn?<>
            <div className="auth-circle"><CheckCircle2 size={25}/></div>
            <span className="auth-eyebrow">{""+t("ACESSO AUTORIZADO")+""}</span>
            <h2>{""+t("Sua conta está conectada.")+""}</h2>
            <p className="auth-description">{""+t("Olá,")+" "}<strong>{me.username}</strong>{""+t(". Você já pode acessar os simuladores e os conteúdos de estudo.")+""}</p>
            <Link href={typeof window==='undefined'?'/':returnPath()} className="auth-action">{""+t("Acessar a plataforma")+" "}<ArrowRight size={18}/></Link>
            <Link className="auth-outline" href="/seguranca">{""+t("Segurança da conta e recuperação")+""}</Link>
            <p className="auth-description">{""+t("Cada aba mantém a conta escolhida. Sair aqui não encerra as outras contas.")+""}</p>
            <button type="button" className="auth-outline" onClick={logout} disabled={loading}><LogOut size={17}/>{" "+t("Sair da conta")+""}</button>
          </>:<>
            <span className="auth-eyebrow"><LockKeyhole size={14}/>{" "+t("ACESSO À PLATAFORMA")+""}</span>
            <h2>{mode==='login'?'Entre na sua conta':'Crie sua conta'}</h2>
            <p className="auth-description">{mode==='login'?'Informe suas credenciais para continuar seus estudos.':'Cadastre-se com nome de usuário, e-mail e senha. Sem confirmação de e-mail.'}</p>
            <div className="auth-switch" role="group" aria-label="Modo de acesso">
              <button type="button" aria-pressed={mode==='login'} className={mode==='login'?'is-active':''} onClick={()=>{setMode('login');setMessage('');}}>{""+t("Entrar")+""}</button>
              <button type="button" aria-pressed={mode==='register'} className={mode==='register'?'is-active':''} onClick={()=>{setMode('register');setMessage('');}}>{""+t("Criar conta")+""}</button>
            </div>
            {me===null&&<p className="auth-notice">{""+t("Verificando disponibilidade do serviço...")+""}</p>}
            {me?.ready===false&&<div className="auth-notice" role="alert">{""+t("O cadastro está temporariamente indisponível. Tente novamente mais tarde.")+""}</div>}
            <form onSubmit={send}>
              <label className="auth-field"><span>{mode==='register'?t("Nome de usuário"):t("Usuário ou e-mail")}</span>
                <input autoComplete="username" autoCapitalize="none" spellCheck={false} aria-describedby={mode==='register'?'username-hint':undefined} placeholder={mode==='register'?'Ex.: estudantecomex':t("Seu usuário ou e-mail")} value={username} onChange={e=>setUsername(e.target.value)} required minLength={3} maxLength={mode==='register'?24:254} pattern={mode==='register'?String.raw`[A-Za-z0-9._\-]{3,24}`:undefined}/>
              {mode==='register'&&<small id="username-hint">{""+t("De 3 a 24 caracteres, sem espaços. O _ é opcional.")+""}</small>}
              </label>
              {mode==='register'&&<label className="auth-field"><span>{""+t("E-mail")+""}</span><input type="email" autoComplete="email" placeholder="seuemail@exemplo.com" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)}/></label>}
              <label className="auth-field"><span>{""+t("Senha")+""}</span><span className="auth-password"><input type={showPassword?'text':'password'} autoComplete={mode==='login'?'current-password':'new-password'} placeholder="Pelo menos 10 caracteres" required minLength={10} maxLength={72} value={password} onChange={e=>setPassword(e.target.value)}/><button type="button" aria-label={showPassword?'Ocultar senha':'Mostrar senha'} onClick={()=>setShowPassword(v=>!v)}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></span></label>
              {mode==='register'&&<label className="auth-field"><span>{""+t("Confirme sua senha")+""}</span><input type={showPassword?'text':'password'} autoComplete="new-password" placeholder="Digite a senha novamente" minLength={10} maxLength={72} required value={repeat} onChange={e=>setRepeat(e.target.value)}/></label>}
              {mode==='register'&&<p className="auth-tip"><CheckCircle2 size={15}/> Não é necessário confirmar seu e-mail no cadastro. Use um endereço seu e válido para recuperar a senha quando o serviço de e-mail estiver ativado. Guarde também o código pessoal de recuperação.</p>}
              {message&&<div className="auth-notice" role="alert">{message}</div>}
              <button className="auth-action" type="submit" disabled={loading||!me?.ready}>{mode==='register'?<UserPlus size={18}/>:<UserRound size={18}/>} {loading?t("Aguarde..."):mode==='login'?'Entrar na plataforma':t("Criar conta")} <ArrowRight size={17}/></button>
            </form>
            {mode==='login'&&<Link href="/recuperar" style={{display:'block',textAlign:'center',marginTop:15,fontSize:13,color:'var(--primary)'}}>{""+t("Esqueci minha senha")+""}</Link>}
            <p className="auth-secure"><LockKeyhole size={13}/>{" "+t("Senhas protegidas. Nenhuma confirmação por e-mail será enviada.")+""}</p>
          </>}
        </div>
      </section>
    </main>
    <footer className="auth-footer">{""+t("ComexHub · Ferramenta educacional.")+" "}<span>{""+t("Desenvolvido por")+" "}<strong>Hanna Roncel, Ícaro Pinheiro e Mirelly Lopes</strong>.</span><span>Contato: <a href="mailto:comexhub.contato@gmail.com" style={{overflowWrap:'anywhere'}}>comexhub.contato@gmail.com</a></span></footer>
  </div>;
}
