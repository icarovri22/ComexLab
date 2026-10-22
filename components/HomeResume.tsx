'use client';
import {readAccountPreference} from '../lib/account-preferences';
import {accountFetch} from '../lib/account-fetch';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {ArrowRight} from 'lucide-react';
export default function HomeResume(){
 const [lesson,setLesson]=useState<{slug:string;title:string}|null>(null);
 const [draft,setDraft]=useState(false);
 useEffect(()=>{
  let alive=true;
  accountFetch('/api/auth',{cache:'no-store'}).then(response=>response.ok?response.json():null).then(user=>{
   if(!alive||!user?.loggedIn||typeof user.username!=='string')return;
  try{const found=JSON.parse(readAccountPreference('comexhub:last-lesson',user.username)||'null');if(found&&typeof found.slug==='string'&&/^[a-z-]{1,60}$/.test(found.slug)&&typeof found.title==='string'&&found.title.length<=200)setLesson({slug:found.slug,title:found.title});}catch{}
   try{const stored=JSON.parse(localStorage.getItem(`comexhub:sim:draft:${user.username}`)||'null');if(stored&&typeof stored==='object'&&!Array.isArray(stored))setDraft(true);}catch{}
  }).catch(()=>{});
  return()=>{alive=false};
 },[]);
 if(!lesson&&!draft)return null;
 return <section className="home-resume" aria-labelledby="resume-title"><h2 id="resume-title">Continue de onde parou</h2>
  {draft&&<Link href="/simuladores"><div><strong>Sua simulação</strong><span>Retome o rascunho disponível neste navegador.</span></div><ArrowRight size={18}/></Link>}
  {lesson&&<Link href={`/estudos?modulo=${encodeURIComponent(lesson.slug)}`}><div><strong>{lesson.title}</strong><span>Retomar a última aula aberta neste navegador.</span></div><ArrowRight size={18}/></Link>}
 </section>;
}
