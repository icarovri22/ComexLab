'use client';
import {accountFetch} from '../../lib/account-fetch';

import {useEffect,useState,type FormEvent} from 'react';
import Link from 'next/link';
import BrandLogo from '../../components/BrandLogo';
import ThemePicker from '../../components/ThemePicker';
import {ArrowRight,BookOpen,CheckCircle2,Eye,EyeOff,Globe2,LockKeyhole,LogOut,ShieldCheck,UserRound,UserPlus} from 'lucide-react';

type Mode='login'|'register';
type Session={ready:boolean;loggedIn:boolean;username?:string;emailConfirmation?:boolean};

function returnPath(){
  const next=new URLSearchParams(window.location.search).get('next');
  return next&&next.startsWith('/')&&!next.startsWith('//')&&!next.startsWith('/login')&&!next.includes('\\')?next:'/';
}

export default function Login(){
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
      <div className="auth-header-utilities"><span className="auth-header-caption">Plataforma de aprendizagem em Comércio Exterior</span><ThemePicker/></div>
    </header>
    <main className="auth-content">
      <section className="auth-aside" aria-label="Apresentação do ComexHub">
        <span className="auth-overline"><Globe2 size={15}/> BEM-VINDO AO COMEXHUB</span>
        <h1>O comércio exterior começa por aqui.</h1>
        <p>Uma plataforma para aprender, consultar informações e simular operações internacionais com mais clareza.</p>
        <div className="auth-benefits">
          <div><span><BookOpen size={19}/></span><div><strong>Estudos na prática</strong><small>Aulas, exercícios e casos aplicados.</small></div></div>
          <div><span><ArrowRight size={19}/></span><div><strong>Simuladores completos</strong><small>Importação, exportação e Incoterms® 2020.</small></div></div>
          <div><span><ShieldCheck size={19}/></span><div><strong>Acesso pessoal</strong><small>Seus dados e sua senha ficam protegidos.</small></div></div>
        </div>
        <p className="auth-aside-foot">Projeto desenvolvido por <strong>Hanna Roncel e Ícaro Pinheiro</strong>.</p>
      </section>
      <section className="auth-right" aria-label="Acesso à conta">
        <div className="auth-panel">
          {recoveryCode?<>
            <div className="auth-circle"><CheckCircle2 size={25}/></div>
            <h2>Conta criada!</h2>
            <p className="auth-description">Salve o código abaixo para poder redefinir sua senha caso a esqueça. Ele é exibido uma única vez e não será enviado por e-mail.</p>
            <div className="security-secret">{recoveryCode}</div>
            <button className="auth-outline" type="button" onClick={()=>navigator.clipboard.writeText(recoveryCode)}>Copiar código de recuperação</button>
            <p className="security-warning">Guarde em um gerenciador de senhas ou local protegido. Nunca compartilhe esse código.</p>
            <button className="auth-action" onClick={()=>window.location.replace('/')}>Salvei o código. Acessar plataforma <ArrowRight size={18}/></button>
          </>:me?.loggedIn?<>
            <div className="auth-circle"><CheckCircle2 size={25}/></div>
            <span className="auth-eyebrow">ACESSO AUTORIZADO</span>
            <h2>Sua conta está conectada.</h2>
            <p className="auth-description">Olá, <strong>{me.username}</strong>. Você já pode acessar os simuladores e os conteúdos de estudo.</p>
            <Link href={typeof window==='undefined'?'/':returnPath()} className="auth-action">Acessar a plataforma <ArrowRight size={18}/></Link>
            <Link className="auth-outline" href="/seguranca">Segurança da conta e recuperação</Link>
            <a className="auth-outline" href="/login?nova-conta=1" target="_blank" rel="noopener noreferrer">Abrir outra conta em nova aba</a>
            <p className="auth-description">Cada aba mantém a conta escolhida. Sair aqui não encerra as outras contas.</p>
            <button type="button" className="auth-outline" onClick={logout} disabled={loading}><LogOut size={17}/> Sair da conta</button>
          </>:<>
            <span className="auth-eyebrow"><LockKeyhole size={14}/> ACESSO À PLATAFORMA</span>
            <h2>{mode==='login'?'Entre na sua conta':'Crie sua conta'}</h2>
            <p className="auth-description">{mode==='login'?'Informe suas credenciais para continuar seus estudos.':'Cadastre-se com nome de usuário, e-mail e senha. Sem confirmação de e-mail.'}</p>
            <div className="auth-switch" role="group" aria-label="Modo de acesso">
              <button type="button" aria-pressed={mode==='login'} className={mode==='login'?'is-active':''} onClick={()=>{setMode('login');setMessage('');}}>Entrar</button>
              <button type="button" aria-pressed={mode==='register'} className={mode==='register'?'is-active':''} onClick={()=>{setMode('register');setMessage('');}}>Criar conta</button>
            </div>
            {me===null&&<p className="auth-notice">Verificando disponibilidade do serviço...</p>}
            {me?.ready===false&&<div className="auth-notice" role="alert">O cadastro está temporariamente indisponível. Tente novamente mais tarde.</div>}
            <form onSubmit={send}>
              <label className="auth-field"><span>{mode==='register'?'Nome de usuário':'Usuário ou e-mail'}</span>
                <input autoComplete="username" placeholder={mode==='register'?'Ex.: estudante_comex':'Seu usuário ou e-mail'} value={username} onChange={e=>setUsername(e.target.value)} required minLength={3} maxLength={mode==='register'?24:254} pattern={mode==='register'?'[A-Za-z0-9._-]{3,24}':undefined}/>
              </label>
              {mode==='register'&&<label className="auth-field"><span>E-mail</span><input type="email" autoComplete="email" placeholder="seuemail@exemplo.com" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)}/></label>}
              <label className="auth-field"><span>Senha</span><span className="auth-password"><input type={showPassword?'text':'password'} autoComplete={mode==='login'?'current-password':'new-password'} placeholder="Pelo menos 10 caracteres" required minLength={10} maxLength={72} value={password} onChange={e=>setPassword(e.target.value)}/><button type="button" aria-label={showPassword?'Ocultar senha':'Mostrar senha'} onClick={()=>setShowPassword(v=>!v)}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></span></label>
              {mode==='register'&&<label className="auth-field"><span>Confirme sua senha</span><input type={showPassword?'text':'password'} autoComplete="new-password" placeholder="Digite a senha novamente" minLength={10} maxLength={72} required value={repeat} onChange={e=>setRepeat(e.target.value)}/></label>}
              {mode==='register'&&<p className="auth-tip"><CheckCircle2 size={15}/> Não é necessário confirmar seu e-mail no cadastro. Use um endereço seu e válido para recuperar a senha quando o serviço de e-mail estiver ativado. Guarde também o código pessoal de recuperação.</p>}
              {message&&<div className="auth-notice" role="alert">{message}</div>}
              <button className="auth-action" type="submit" disabled={loading||!me?.ready}>{mode==='register'?<UserPlus size={18}/>:<UserRound size={18}/>} {loading?'Aguarde...':mode==='login'?'Entrar na plataforma':'Criar conta'} <ArrowRight size={17}/></button>
            </form>
            {mode==='login'&&<Link href="/recuperar" style={{display:'block',textAlign:'center',marginTop:15,fontSize:13,color:'var(--primary)'}}>Esqueci minha senha</Link>}
            <p className="auth-secure"><LockKeyhole size={13}/> Senhas protegidas. Nenhuma confirmação por e-mail será enviada.</p>
          </>}
        </div>
      </section>
    </main>
    <footer className="auth-footer">ComexHub · Ferramenta educacional. <span>Desenvolvido por <strong>Hanna Roncel e Ícaro Pinheiro</strong>.</span><span>Contato: <a href="mailto:comexhub.contato@gmail.com" style={{overflowWrap:'anywhere'}}>comexhub.contato@gmail.com</a></span></footer>
  </div>;
}
