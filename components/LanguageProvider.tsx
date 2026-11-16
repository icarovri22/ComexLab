'use client';
import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import {english} from '../lib/english';
export type Language='pt-BR'|'en';
const key='comexhub:language';
const Context=createContext({language:'pt-BR' as Language,setLanguage:(_value:Language)=>{},t:(value:string)=>value});
export const useLanguage=()=>useContext(Context);
export default function LanguageProvider({children}:{children:ReactNode}){
 const [language,update]=useState<Language>('pt-BR');
 useEffect(()=>{
  const restore=()=>{try{update(localStorage.getItem(key)==='en'?'en':'pt-BR')}catch{update('pt-BR')}};
  const sync=(event:StorageEvent)=>{if(event.key===key||event.key===null)restore()};
  restore();window.addEventListener('storage',sync);
  return()=>window.removeEventListener('storage',sync);
 },[]);
 useEffect(()=>{document.documentElement.lang=language},[language]);
 const setLanguage=(value:Language)=>{try{localStorage.setItem(key,value)}catch{}update(value)};
 return <Context.Provider value={{language,setLanguage,t:value=>language==='en'?(english[value]??value):value}}>{children}</Context.Provider>;
}
