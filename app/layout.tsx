import './globals.css';
import './auth.css';
import './security.css';
import './admin/admin.css';
import './feedback.css';
import './simulation-report.css';
import './news.css';
import './ai.css';
import './theme.css';
import './minimal.css';
import './palettes.css';
import type {Metadata} from 'next';
import AppShell from '../components/AppShell';
export const metadata:Metadata={title:'ComexHub | Comércio Exterior na prática',description:'Seu hub de aprendizados em comércio exterior: aprenda importação, exportação, Incoterms, NCM e custos logísticos com simuladores interativos.',applicationName:'ComexHub',robots:{index:true,follow:true},openGraph:{title:'ComexHub | Comércio Exterior na prática',description:'Seu hub de aprendizados em comércio exterior',url:'https://comexhub-app.vercel.app',type:'website'},appleWebApp:{title:'ComexHub',capable:true,statusBarStyle:'default'},icons:{icon:'/icon.png',shortcut:'/favicon.ico',apple:'/apple-icon.png'},manifest:'/manifest.webmanifest'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:`(function(){try{var s=localStorage.getItem('comexlab-theme');var dark=window.matchMedia('(prefers-color-scheme: dark)').matches;var theme=s==='dark'||s==='light'?s:(dark?'dark':'light');document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme;}catch(e){}})();`}}/></head><body><AppShell>{children}</AppShell></body></html>}
