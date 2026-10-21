'use client';
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {ArrowLeft,ArrowRight,BookOpen,CheckCircle2,ChevronRight,Clock3,ExternalLink,GraduationCap,Lightbulb,RotateCcw,Target,ClipboardCheck,BookMarked} from 'lucide-react';
import {LESSONS,type Lesson} from '../../lib/lessons';
import {EXTRA_LESSONS,EXPANSIONS,type ExtraQuestion} from '../../lib/study-plus';
import {INCOTERMS} from '../../lib/incoterms';

const order=['fundamentos','pesquisa-mercado','importacao','exportacao','incoterms','ncm','modais','tributos','preco-viabilidade','cambio-pagamentos','documentos','despacho-regimes','acordos-origem','riscos'];
const baseAll=[...LESSONS,...EXTRA_LESSONS].sort((a,b)=>order.indexOf(a.slug)-order.indexOf(b.slug));
const key='comexlab-study-progress-v1';

type Answers=Record<number,number>;
export default function Estudos(){
 const [all,setAll]=useState<Lesson[]>(baseAll);
 const [slug,setSlug]=useState<string|null>(null);
 const [answers,setAnswers]=useState<Answers>({});
 const [completed,setCompleted]=useState<string[]>([]);
 const [topic,setTopic]=useState('Todos');
 useEffect(()=>{try{const value=JSON.parse(window.localStorage.getItem(key)||'[]');if(Array.isArray(value))setCompleted(value.filter((s):s is string=>typeof s==='string'));}catch{}},[]);
 useEffect(()=>{let alive=true;fetch('/api/study-content',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(data=>{if(!alive||!data||typeof data.overrides!=='object')return;setAll(baseAll.map(lesson=>{const update=data.overrides[lesson.slug];return update&&typeof update==='object'?{...lesson,...update,slug:lesson.slug, duration:lesson.duration,references:lesson.references}:lesson}));}).catch(()=>{});return()=>{alive=false}},[]);
 useEffect(()=>{const candidate=new URLSearchParams(window.location.search).get('modulo');if(candidate&&baseAll.some(item=>item.slug===candidate)){setSlug(candidate);try{localStorage.setItem('comexhub:last-lesson',JSON.stringify({slug:candidate,title:baseAll.find(item=>item.slug===candidate)?.title||candidate}))}catch{}}},[]);
 const lesson=all.find(x=>x.slug===slug);
 const expansion=slug?EXPANSIONS[slug]:null;
 const group=(s:string)=>['fundamentos','pesquisa-mercado','importacao','exportacao'].includes(s)?'Operações':['incoterms','ncm','modais','documentos','despacho-regimes'].includes(s)?'Processos':'Custos e estratégia';
 const filtered=useMemo(()=>all.filter(l=>topic==='Todos'||group(l.slug)===topic),[all,topic]);
 const questions=useMemo<ExtraQuestion[]>(()=>lesson&&expansion?[{question:lesson.exercise.question,options:lesson.exercise.options as [string,string,string],answer:lesson.exercise.answer,explanation:lesson.exercise.explanation},...expansion.questions]:[],[lesson,expansion]);
 const correct=questions.filter((q,i)=>answers[i]===q.answer).length;
 const answered=Object.keys(answers).length;
 const progress=Math.round(completed.length/all.length*100);
 function open(id:string){setSlug(id);setAnswers({});try{localStorage.setItem('comexhub:last-lesson',JSON.stringify({slug:id,title:all.find(item=>item.slug===id)?.title||id}))}catch{}window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
 function finish(){if(!lesson||correct!==questions.length)return;setCompleted(prev=>{const next=[...new Set([...prev,lesson.slug])];try{window.localStorage.setItem(key,JSON.stringify(next))}catch{}return next;});}
 return <div className="study-page">
  <span className="eyebrow">ACADEMIA COMEXHUB · APRENDIZAGEM GUIADA</span>
  <div className="study-hero"><div><h1>Continue aprendendo.</h1><p>Retome uma aula ou explore um novo tema, no seu ritmo.</p><div className="study-hero-metrics"><span><BookOpen size={17}/> {all.length} módulos</span><span><ClipboardCheck size={17}/> {all.length*3} questões</span><span><GraduationCap size={17}/> Casos resolvidos</span></div></div><div className="study-progress"><div className="flex-head"><strong>Seu progresso neste navegador</strong><span>{progress}%</span></div><progress max={all.length} value={completed.length} aria-label="Módulos concluídos"/><small>{completed.length} de {all.length} módulos concluídos. O progresso é salvo localmente neste navegador.</small></div></div>
  {!lesson?<>
    <div className="study-tools"><div><h2>Escolha o que estudar</h2><p className="muted">A sequência sugerida começa nos fundamentos e avança para os aspectos fiscais, logísticos e financeiros.</p></div><div className="study-filters" role="group" aria-label="Filtrar módulos">{['Todos','Operações','Processos','Custos e estratégia'].map(t=><button type="button" key={t} className={topic===t?'current':''} onClick={()=>setTopic(t)}>{t}</button>)}</div></div>
    <div className="study-catalog">{filtered.map(l=>{const i=all.findIndex(a=>a.slug===l.slug),done=completed.includes(l.slug);return <button type="button" key={l.slug} className={'study-unit'+(done?' is-complete':'')} onClick={()=>open(l.slug)}><div className="flex-head"><span className="study-number">MÓDULO {String(i+1).padStart(2,'0')}</span>{done?<span className="study-done"><CheckCircle2 size={15}/> Concluído</span>:<small className="study-duration"><Clock3 size={13}/> {l.duration}</small>}</div><h3>{l.title}</h3><p>{l.subtitle}</p><div className="study-unit-bottom"><span>Estudar módulo</span><ChevronRight size={19}/></div></button>})}</div>
    <details className="study-incoterm-panel minimal-disclosure"><summary>Material complementar · As 11 regras Incoterms® 2020</summary><div className="flex-head"><div><span className="eyebrow">MATERIAL COMPLEMENTAR</span><h2>As 11 regras Incoterms® 2020</h2></div><button className="btn secondary" onClick={()=>open('incoterms')} type="button">Aprender Incoterms <ArrowRight size={15}/></button></div><p className="muted">Sete regras podem ser utilizadas em qualquer modal e quatro são específicas do transporte marítimo ou por vias navegáveis interiores.</p><div className="study-incoterm-grid">{INCOTERMS.map(r=><div key={r.code} className="study-incoterm"><strong>{r.code}</strong><span>{r.modes==='sea'?'Marítimo':'Qualquer modal'}</span><p>{r.description}</p></div>)}</div></details>
  </>:<>
    <button className="study-back" type="button" onClick={()=>{setSlug(null);window.scrollTo({top:0,behavior:'smooth'})}}><ArrowLeft size={17}/> Voltar à trilha</button>
    <div className="study-module-head"><div><span className="eyebrow">MÓDULO {String(all.findIndex(l=>l.slug===slug)+1).padStart(2,'0')} · {lesson.duration} · {group(lesson.slug)}</span><h2>{lesson.title}</h2><p>{lesson.intro}</p></div><span className="study-module-status">{completed.includes(lesson.slug)?<><CheckCircle2 size={17}/> Concluído</>:<><BookOpen size={17}/> Em estudo</>}</span></div>
    {expansion&&<section className="study-objectives"><h3><Target size={20}/> Ao concluir este módulo, você será capaz de:</h3><ul>{expansion.objectives.map(x=><li key={x}><CheckCircle2 size={16}/>{x}</li>)}</ul></section>}
    <div className="study-sections">{lesson.sections.map((section,i)=><section key={section.title} className="study-reading"><div className="study-section-heading"><span>{String(i+1).padStart(2,'0')}</span><h3>{section.title}</h3></div><ul>{section.points.map(p=><li key={p}>{p}</li>)}</ul></section>)}</div>
    {expansion&&<><section className="study-practice"><div className="study-practice-title"><Lightbulb size={22}/><div><span className="eyebrow">APLICAÇÃO PRÁTICA</span><h2>Estudo de caso resolvido</h2></div></div><p className="study-context">{expansion.practice.context}</p><ol>{expansion.practice.steps.map((s,i)=><li key={i}><span>{i+1}</span><p>{s}</p></li>)}</ol><div className="study-conclusion"><strong>O que aprendemos:</strong> {expansion.practice.conclusion}</div></section>
    <section className="study-glossary"><h2><BookMarked size={21}/> Glossário essencial</h2><div className="grid-2">{expansion.glossary.map(item=><div key={item.term}><strong>{item.term}</strong><p>{item.meaning}</p></div>)}</div></section></>}
    <section className="study-quiz"><div className="flex-head"><div><span className="eyebrow">FIXAÇÃO DO CONTEÚDO</span><h2>Teste seus conhecimentos</h2><p>Responda às três questões. A cada resposta, você receberá uma explicação.</p></div><span className="study-score">{correct}/{questions.length} corretas</span></div>{questions.map((q,qi)=><div key={qi} className="study-question"><h3><span>{String(qi+1).padStart(2,'0')}</span> {q.question}</h3><div className="study-options">{q.options.map((opt,i)=><button key={i} type="button" className={'study-option'+(answers[qi]===i?' selected':'')+(answers[qi]===i?(i===q.answer?' correct':' incorrect'):'')} onClick={()=>setAnswers(prev=>({...prev,[qi]:i}))} aria-pressed={answers[qi]===i}>{String.fromCharCode(65+i)}. {opt}</button>)}</div>{answers[qi]!==undefined&&<div className={answers[qi]===q.answer?'success':'alert'} role="status"><strong>{answers[qi]===q.answer?'Resposta correta.':'Ainda não. Você pode tentar novamente.'}</strong> {q.explanation}</div>}</div>)}<div className="study-quiz-footer"><span>{answered} de {questions.length} respondidas</span><div><button type="button" className="btn secondary" onClick={()=>setAnswers({})}><RotateCcw size={15}/> Refazer questões</button> <button className="btn" type="button" disabled={correct!==questions.length||completed.includes(lesson.slug)} onClick={finish}><CheckCircle2 size={16}/>{completed.includes(lesson.slug)?'Módulo concluído':'Concluir módulo'}</button></div></div>{correct!==questions.length&&<p className="help">Para marcar o módulo como concluído, acerte as três questões. Você pode ajustar suas respostas.</p>}</section>
    {expansion&&<section className="study-checklist"><h2>Antes de avançar, confira:</h2><ul>{expansion.checklist.map(c=><li key={c}><CheckCircle2 size={17}/>{c}</li>)}</ul></section>}
    <section className="study-references"><h3>Fontes para aprofundar</h3><p className="help">Consulte fontes oficiais e verifique a legislação vigente antes de aplicar as informações em operações reais.</p>{lesson.references.map(ref=><a className="reference-link" key={ref.url} href={ref.url} target="_blank" rel="noopener noreferrer">{ref.label} <ExternalLink size={14}/></a>)}</section>
    <div className="study-next"><Link className="btn secondary" href="/simuladores">Praticar nos simuladores</Link><button type="button" className="btn" onClick={()=>{const i=all.findIndex(l=>l.slug===slug);open(all[(i+1)%all.length].slug)}}>Próximo módulo <ArrowRight size={16}/></button></div>
  </>}
 </div>;
}
