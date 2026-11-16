'use client';
import {useLanguage} from '../components/LanguageProvider';
import Link from 'next/link';
import {ArrowRight,Search,BookOpen,Newspaper} from 'lucide-react';
import HomeResume from '../components/HomeResume';
export default function Home(){ const {t}=useLanguage();return <div className="home-minimal">
 <header className="page-heading"><span className="eyebrow">{""+t("SEU ESPAÇO")+""}</span><h1>{""+t("O que você quer fazer hoje?")+""}</h1><p className="page-lead">{""+t("Um ponto de partida para estudar, consultar e simular.")+""}</p></header>
 <section className="home-start"><div><span className="eyebrow">{""+t("SIMULE NA PRÁTICA")+""}</span><h2>{""+t("Da teoria à operação.")+""}</h2><p>{""+t("Escolha a rota, organize os custos e entenda cada decisão de importação ou exportação.")+""}</p></div><Link className="btn" href="/simuladores">{""+t("Abrir simulador")+" "}<ArrowRight size={17}/></Link></section>
 <HomeResume/>
 <section className="home-tools" aria-label={t("Explore o ComexHub")}>
  <Link className="home-tool" href="/ncm"><Search size={21} aria-hidden="true"/><div><h2>{""+t("Consulta NCM")+""}</h2><p>{""+t("Pesquise, compare códigos e leve o resultado para a simulação.")+""}</p></div><ArrowRight size={18} aria-hidden="true"/></Link>
  <Link className="home-tool" href="/estudos"><BookOpen size={21} aria-hidden="true"/><div><h2>{""+t("Trilha de estudos")+""}</h2><p>{""+t("Conteúdos, casos práticos e exercícios com explicação.")+""}</p></div><ArrowRight size={18} aria-hidden="true"/></Link>
  <Link className="home-tool" href="/noticias"><Newspaper size={21} aria-hidden="true"/><div><h2>Comex News</h2><p>{""+t("Notícias do mês, fontes oficiais e gráficos de dólar e euro.")+""}</p></div><ArrowRight size={18} aria-hidden="true"/></Link>
 </section>
 <details className="minimal-disclosure home-about"><summary>{""+t("Como usar o ComexHub nos seus estudos")+""}</summary><p>Aprenda os conceitos na trilha, consulte o NCM e teste diferentes decisões no simulador. A plataforma usa modelos educacionais; confirme classificação, alíquotas e exigências nas fontes oficiais antes de uma operação real.</p><Link href="/avaliar">{""+t("Enviar uma sugestão à equipe")+" "}<ArrowRight size={14}/></Link></details>
 </div>}
