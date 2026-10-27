'use client';
import {useCallback,useEffect,useLayoutEffect,useRef,useState} from 'react';
import {TOUR_STEPS,tourPosition,tourStorageKey,type TourRect} from '../lib/welcome-tour';

type Phase='closed'|'welcome'|'tour';
export default function WelcomeTour({owner,request}:{owner:string|null;request:number}){
 const [phase,setPhase]=useState<Phase>('closed');
 const [index,setIndex]=useState(0);
 const [target,setTarget]=useState<TourRect|null>(null);
 const [position,setPosition]=useState({left:12,top:12});
 const dialog=useRef<HTMLDivElement>(null);
 const seenOwner=useRef<string|null>(null);
 const lastRequest=useRef(0);
 const returnFocus=useRef<HTMLElement|null>(null);
 const current=TOUR_STEPS[index];
 const open=useCallback(()=>{returnFocus.current=document.activeElement instanceof HTMLElement?document.activeElement:null;setIndex(0);setTarget(null);setPhase('welcome')},[]);
 const close=useCallback(()=>{
  if(owner)try{localStorage.setItem(tourStorageKey(owner),'done')}catch{}
  setPhase('closed');setTarget(null);
  requestAnimationFrame(()=>returnFocus.current?.focus());
 },[owner]);
 useEffect(()=>{
  if(!owner||seenOwner.current===owner)return;
  seenOwner.current=owner;
  try{if(localStorage.getItem(tourStorageKey(owner))!=='done')open()}catch{open()}
 },[owner,open]);
 useEffect(()=>{if(owner&&request!==lastRequest.current){lastRequest.current=request;if(request>0)open()}},[owner,request,open]);
 useEffect(()=>{
  if(phase==='closed')return;
  const frame=requestAnimationFrame(()=>dialog.current?.focus());
  const handle=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();close();return}
   if(event.key!=='Tab'||!dialog.current)return;
   const buttons=Array.from(dialog.current.querySelectorAll<HTMLButtonElement>('button:not([disabled])'));
   if(!buttons.length)return;
   const first=buttons[0],last=buttons[buttons.length-1];
   if(event.shiftKey&&(document.activeElement===first||document.activeElement===dialog.current||!dialog.current.contains(document.activeElement))){event.preventDefault();last.focus()}
   else if(!event.shiftKey&&(document.activeElement===last||!dialog.current.contains(document.activeElement))){event.preventDefault();first.focus()}
  };
  document.addEventListener('keydown',handle);return()=>{cancelAnimationFrame(frame);document.removeEventListener('keydown',handle)};
 },[phase,close]);
 useLayoutEffect(()=>{
  if(phase!=='tour')return;
  const element=document.querySelector<HTMLElement>(`[data-tour-target="${current.target}"]`);
  if(!element){setTarget(null);return}
  element.scrollIntoView({block:'nearest',inline:'nearest',behavior:'auto'});
  const measure=()=>{
   const rect=element.getBoundingClientRect();
   const visible={left:Math.max(0,rect.left),top:Math.max(0,rect.top),right:Math.min(innerWidth,rect.right),bottom:Math.min(innerHeight,rect.bottom),width:rect.width,height:rect.height};
   setTarget(visible);
   const box=dialog.current?.getBoundingClientRect();
   if(box)setPosition(tourPosition(visible,innerWidth,innerHeight,box.width,box.height));
  };
  measure();const frame=requestAnimationFrame(measure);
  window.addEventListener('resize',measure);window.addEventListener('scroll',measure,true);
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('resize',measure);window.removeEventListener('scroll',measure,true)};
 },[phase,index,current.target]);
 if(phase==='closed'||typeof document==='undefined')return null;
 const hole=target?{left:Math.max(0,target.left-4),top:Math.max(0,target.top-4),width:Math.max(0,target.right-target.left+8),height:Math.max(0,target.bottom-target.top+8)}:undefined;
 return <div className="welcome-tour-layer">
  <div className="welcome-tour-blocker" aria-hidden="true"/>
  {phase==='welcome'||!hole?<div className="welcome-tour-shade" aria-hidden="true"/>:<div className="welcome-tour-highlight" style={hole} aria-hidden="true"/>}
  <div ref={dialog} tabIndex={-1} className={'welcome-tour-dialog'+(phase==='welcome'?' is-welcome':'')} style={phase==='tour'?position:undefined} role="dialog" aria-modal="true" aria-labelledby="welcome-tour-title" aria-describedby="welcome-tour-description">
   {phase==='welcome'?<><span className="welcome-tour-count">BOAS-VINDAS</span><h2 id="welcome-tour-title">Vamos conhecer o app?</h2><p id="welcome-tour-description">Um passeio rápido para descobrir onde fica cada função.</p><div className="welcome-tour-actions"><button type="button" className="welcome-tour-skip" onClick={close}>Pular apresentação</button><button type="button" className="btn" onClick={()=>setPhase('tour')}>Conhecer o app</button></div></>:<>
    <span className="welcome-tour-count" aria-live="polite">{index+1} de {TOUR_STEPS.length}</span><h2 id="welcome-tour-title">{current.title}</h2><p id="welcome-tour-description">{current.description}</p>
    <div className="welcome-tour-actions"><button type="button" className="welcome-tour-skip" onClick={close}>Pular</button><div className="welcome-tour-navigation">{index>0&&<button type="button" className="btn secondary" onClick={()=>setIndex(i=>i-1)}>Voltar</button>}<button type="button" className="btn" onClick={()=>index===TOUR_STEPS.length-1?close():setIndex(i=>i+1)}>{index===TOUR_STEPS.length-1?'Concluir':'Próximo'}</button></div></div>
   </>}
  </div>
 </div>;
}
