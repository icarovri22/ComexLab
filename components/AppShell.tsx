'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {usePathname} from 'next/navigation';
import {LayoutDashboard,ArrowLeftRight,BookOpen,Search,UserRound,ShieldCheck,MessageSquareHeart,Newspaper,Mail,Settings2} from 'lucide-react';
import BrandLogo from './BrandLogo';
import ThemePicker from './ThemePicker';
import AppearanceProvider from './AppearanceProvider';
import {isPublicAuthPage} from '../lib/auth-pages';
const groups=[
 {label:'Seu espaço',pages:[{href:'/',label:'Início',icon:LayoutDashboard}]},
 {label:'Ferramentas',pages:[{href:'/simuladores',label:'Simuladores',icon:ArrowLeftRight},{href:'/ncm',label:'Consulta NCM',icon:Search}]},
 {label:'Aprendizagem',pages:[{href:'/estudos',label:'Trilha de estudos',icon:BookOpen},{href:'/noticias',label:'Comex News',icon:Newspaper}]},
];
export default function AppShell({children}:{children:React.ReactNode}){
 const pathname=usePathname();
 const [admin,setAdmin]=useState(false);
 const [owner,setOwner]=useState<string|null>(null);
 const [notice,setNotice]=useState('');
 useEffect(()=>{let mounted=true;Promise.all([fetch('/api/auth',{cache:'no-store'}).then(r=>r.json()),fetch('/api/site',{cache:'no-store'}).then(r=>r.json())]).then(([user,settings])=>{if(!mounted)return;setOwner(user?.loggedIn&&typeof user.username==='string'?user.username:null);setAdmin(user?.isAdmin===true);setNotice(String(settings?.announcement||''));if(user?.ready===true&&user?.loggedIn===false&&!isPublicAuthPage(pathname))window.location.replace('/login')}).catch(()=>{});return()=>{mounted=false}},[pathname]);
 if(isPublicAuthPage(pathname))return <>{children}</>;
 return <AppearanceProvider owner={owner}><div className="shell minimal-shell"><a className="skip-content" href="#main-content">Ir para o conteúdo</a><aside className="sidebar">
  <Link href="/" className="brand" aria-label="ComexHub — página inicial"><BrandLogo/></Link>
  <nav className="nav-list" aria-label="Navegação principal">{groups.map(group=><div className="nav-group" key={group.label}><span className="nav-group-label">{group.label}</span>{group.pages.map(p=><Link key={p.href} href={p.href} aria-current={pathname===p.href?'page':undefined} className={pathname===p.href?'active':''}><p.icon size={18} aria-hidden="true"/><span>{p.label}</span></Link>)}</div>)}{admin&&<Link href="/admin" aria-current={pathname==='/admin'?'page':undefined} className={pathname==='/admin'?'active':''}><ShieldCheck size={18}/><span>Administração</span></Link>}</nav>
  <div className="sidebar-bottom"><details className="account-menu" key={pathname} open={pathname==='/seguranca'||pathname==='/avaliar'||pathname==='/configuracoes'}><summary><UserRound size={17} aria-hidden="true"/> Conta e ajuda</summary><nav aria-label="Conta e ajuda"><Link href="/configuracoes" aria-current={pathname==='/configuracoes'?'page':undefined} className={pathname==='/configuracoes'?'active':''}><Settings2 size={18} aria-hidden="true"/><span>Configurações</span></Link><Link href="/login"><UserRound size={16}/> Minha conta</Link><Link href="/seguranca" aria-current={pathname==='/seguranca'?'page':undefined}><ShieldCheck size={16}/> Segurança</Link><Link href="/avaliar" aria-current={pathname==='/avaliar'?'page':undefined}><MessageSquareHeart size={16}/> Avaliar e sugerir</Link><a href="mailto:comexhub.contato@gmail.com"><Mail size={16}/> Contato</a></nav></details><small>Versão 1.9.4 · Educacional</small></div>
 </aside><div className="main-frame">{notice&&<div className="site-announcement" role="status">{notice}</div>}<header className="topbar"><span>Seu hub de aprendizados em comércio exterior</span><div className="topbar-actions"><ThemePicker/></div></header><main className="content" id="main-content" tabIndex={-1}>{children}</main><footer className="footer"><span>ComexHub · Ferramenta de estudo. Valide dados fiscais nas fontes oficiais.</span><span>Desenvolvido por <strong>Hanna Roncel e Ícaro Pinheiro</strong>.</span><a href="mailto:comexhub.contato@gmail.com">comexhub.contato@gmail.com</a></footer></div></div></AppearanceProvider>;
}
