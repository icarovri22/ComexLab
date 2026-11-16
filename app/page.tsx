import Link from 'next/link';
import {ArrowRight,Search,BookOpen,Newspaper} from 'lucide-react';
import HomeResume from '../components/HomeResume';
export default function Home(){return <div className="home-minimal">
 <header className="page-heading"><span className="eyebrow">SEU ESPAÇO</span><h1 data-tour-target="/">O que você quer fazer hoje?</h1><p className="page-lead">Um ponto de partida para estudar, consultar e simular.</p></header>
 <section className="home-start"><div><span className="eyebrow">SIMULE NA PRÁTICA</span><h2><span className="home-desktop-title">Da teoria à operação.</span><span className="home-mobile-label">Importação e exportação</span></h2><p>Escolha a rota, organize os custos e entenda cada decisão de importação ou exportação.</p></div><Link className="btn" href="/simuladores" data-tour-target="/simuladores">Abrir simulador <ArrowRight size={17}/></Link></section>
 <h2 className="home-mobile-label">Explore o ComexHub</h2>
 <section className="home-tools" aria-label="Explore o ComexHub">
  <Link className="home-tool" href="/ncm" data-tour-target="/ncm"><Search size={21} aria-hidden="true"/><div><h2>Consulta NCM</h2><p>Pesquise, compare códigos e leve o resultado para a simulação.</p></div><ArrowRight size={18} aria-hidden="true"/></Link>
  <Link className="home-tool" href="/estudos" data-tour-target="/estudos"><BookOpen size={21} aria-hidden="true"/><div><h2>Trilha de estudos</h2><p>Conteúdos, casos práticos e exercícios com explicação.</p></div><ArrowRight size={18} aria-hidden="true"/></Link>
  <Link className="home-tool" href="/noticias" data-tour-target="/noticias"><Newspaper size={21} aria-hidden="true"/><div><h2>Comex News</h2><p>Notícias do mês, fontes oficiais e gráficos de dólar e euro.</p></div><ArrowRight size={18} aria-hidden="true"/></Link>
 </section>
 <HomeResume/>
 <details className="minimal-disclosure home-about"><summary>Como usar o ComexHub nos seus estudos</summary><p>Aprenda os conceitos na trilha, consulte o NCM e teste diferentes decisões no simulador. A plataforma usa modelos educacionais; confirme classificação, alíquotas e exigências nas fontes oficiais antes de uma operação real.</p><Link href="/avaliar">Enviar uma sugestão à equipe <ArrowRight size={14}/></Link></details>
 </div>}
