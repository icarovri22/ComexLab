'use client';
import {createContext,useContext,useEffect,useState} from 'react';
import {Palette,paletteKey,readPalette} from '../lib/appearance';
const AppearanceContext=createContext<{palette:Palette;ready:boolean;save:(value:Palette)=>boolean}>({palette:'original',ready:false,save:()=>false});
export const useAppearance=()=>useContext(AppearanceContext);
export default function AppearanceProvider({owner,children}:{owner:string|null;children:React.ReactNode}){
 const [palette,setPalette]=useState<Palette>('original');
 const [loadedOwner,setLoadedOwner]=useState<string|null>(null);
 useEffect(()=>{
  const apply=(value:Palette)=>{setPalette(value);document.documentElement.dataset.palette=value};
  if(!owner){apply('original');setLoadedOwner(null);return}
  const restore=()=>{try{return readPalette(window.localStorage,owner)}catch{return 'original' as const}};
  apply(restore());setLoadedOwner(owner);
  const sync=(event:StorageEvent)=>{if(event.key===paletteKey(owner)||event.key===null)apply(restore())};
  window.addEventListener('storage',sync);
  return()=>{window.removeEventListener('storage',sync);document.documentElement.dataset.palette='original'};
 },[owner]);
 const save=(value:Palette)=>{
  if(!owner||loadedOwner!==owner)return false;
  try{window.localStorage.setItem(paletteKey(owner),value)}catch{return false}
  setPalette(value);document.documentElement.dataset.palette=value;return true;
 };
 return <AppearanceContext.Provider value={{palette,ready:Boolean(owner&&loadedOwner===owner),save}}>{children}</AppearanceContext.Provider>;
}
