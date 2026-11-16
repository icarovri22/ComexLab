'use client';
import {useEffect} from 'react';
import {palettes,validPalette} from '../lib/appearance';

export default function WindowTheme(){
 useEffect(()=>{
  const root=document.documentElement;
  const update=()=>{
   const palette=root.dataset.palette;
   const color=validPalette(palette)&&palette!=='original'
    ? palettes.find(item=>item.id===palette)!.colors[0]
    : '#C46F55';
   const meta=document.head.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
   if(meta&&meta.content!==color)meta.content=color;
  };
  const observer=new MutationObserver(update);
  observer.observe(root,{attributes:true,attributeFilter:['data-palette']});
  // Navigation can replace the viewport metadata without changing the palette.
  observer.observe(document.head,{childList:true,subtree:true,attributes:true,attributeFilter:['name','content']});
  update();
  return()=>observer.disconnect();
 },[]);
 return null;
}
