'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {usePathname} from 'next/navigation';
import {LayoutDashboard, ArrowLeftRight, BookOpen, Search, UserRound, PackageCheck,ShieldCheck,MessageSquareHeart,Newspaper} from 'lucide-react';
import BrandLogo from './BrandLogo';
import ThemePicker from './ThemePicker';
import {isPublicAuthPage} from '../lib/auth-pages';
const pages=[{href:'/',label:'Visão geral',icon:LayoutDashboard},{href:'/simuladores',label:'Simuladores',icon:ArrowLeftRight},{href:'/ncm',label:'Consulta NCM',icon:Search},{href:'/estudos',label:'Trilha de estudos',icon:BookOpen},{href:'/seguranca',label:'Segurança',icon:ShieldCheck},{href:'/avaliar',label:'Avaliar e sugerir',icon:MessageSquareHeart},{href:'/noticias',label:'Comex News',icon:Newspaper},{href:'/login',label:'Minha conta',icon:UserRound}];
export default function AppShell({children}:{children:React.ReactNode}){
 const pathname=usePathname();
 const [admin,setAdmin]=useState(false);
 const [notice,setNotice]=useState('');
 useEffect(()=>{let mounted=true;Promise.all([fetch('/api/auth',{cache:'no-store'}).then(r=>r.json()),fetch('/api/site',{cache:'no-store'}).then(r=>r.json())]).then(([user,settings])=>{if(!mounted)return;setAdmin(user?.isAdmin===true);setNotice(String(settings?.announcement||''));if(user?.ready===true&&user?.loggedIn===false&&!isPublicAuthPage(pathname))window.location.replace('/login')}).catch(()=>{});return()=>{mounted=false}},[pathname]);
 if(isPublicAuthPage(pathname))return <>{children}</>;
 return <div className="shell"><aside className="sidebar">
  <Link href="/" className="brand" aria-label="ComexHub — página inicial"><BrandLogo/></Link>
  <nav className="nav-list" aria-label="Navegação principal">{pages.map(p=><Link key={p.href} href={p.href} className={pathname===p.href?'active':''}><p.icon size={18}/><span>{p.label}</span></Link>)}{admin&&<Link href='/admin' className={pathname==='/admin'?'active':''}><ShieldCheck size={18}/><span>Administração</span></Link>}</nav>
  <div className="sidebar-bottom"><PackageCheck size={16}/> Versão 1.9.1 • Educacional</div>
 </aside><div className="main-frame">{notice&&<div className="site-announcement" role="status">{notice}</div>}<header className="topbar"><span>Seu hub de aprendizados em comércio exterior</span><div className="topbar-actions"><span className="tag">Protótipo didático</span><ThemePicker/></div></header><main className="content">{children}</main><footer className="footer"><span>ComexHub · Ferramenta de estudo. Dados fiscais devem ser validados nas fontes oficiais vigentes.</span><span>Projeto desenvolvido por <strong>Hanna Roncel e Ícaro Pinheiro</strong>.</span><span>Contato: <a href="mailto:comexhub.contato@gmail.com" style={{overflowWrap:'anywhere'}}>comexhub.contato@gmail.com</a></span></footer></div></div>;
}
