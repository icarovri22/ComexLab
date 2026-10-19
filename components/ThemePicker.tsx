'use client';
import {useEffect, useState} from 'react';
import {Monitor, Moon, Sun} from 'lucide-react';

type ThemeChoice='system'|'light'|'dark';
const STORE='comexlab-theme';
const valid=(choice:string|null):choice is ThemeChoice => choice==='system'||choice==='light'||choice==='dark';

export function applyTheme(choice:ThemeChoice){
  const systemDark=window.matchMedia('(prefers-color-scheme: dark)').matches;
  const actual=choice==='system'?(systemDark?'dark':'light'):choice;
  document.documentElement.dataset.theme=actual;
  document.documentElement.style.colorScheme=actual;
}

export default function ThemePicker(){
  const [choice,setChoice]=useState<ThemeChoice>('system');
  useEffect(()=>{
    let saved:ThemeChoice='system';
    try {const stored=window.localStorage.getItem(STORE);saved=valid(stored)?stored:'system';}catch{}
    setChoice(saved);
    applyTheme(saved);
    const media=window.matchMedia('(prefers-color-scheme: dark)');
    const update=()=>{try{if((window.localStorage.getItem(STORE)||'system')==='system')applyTheme('system')}catch{applyTheme('system')}};
    media.addEventListener('change',update);
    return ()=>media.removeEventListener('change',update);
  },[]);
  const update=(next:ThemeChoice)=>{
    setChoice(next);
    try{window.localStorage.setItem(STORE,next)}catch{}
    applyTheme(next);
  };
  return <div className="theme-choice" role="group" aria-label="Tema do aplicativo">
    <span className="theme-choice-label">Tema</span>
    <div className="theme-choice-select-wrap">
      {choice==='dark'?<Moon size={16} aria-hidden="true"/>:choice==='light'?<Sun size={16} aria-hidden="true"/>:<Monitor size={16} aria-hidden="true"/>}
      <select value={choice} onChange={e=>update(e.target.value as ThemeChoice)} aria-label="Tema: claro, escuro ou automático">
        <option value="system">Sistema</option>
        <option value="light">Claro</option>
        <option value="dark">Escuro</option>
      </select>
    </div>
  </div>;
}
