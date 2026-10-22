import {ACCOUNT_HEADER,validAccountSlot} from './account-session';
const STORAGE_KEY='comexhub:account-tab';
export function tabAccount(){
 const url=new URL(window.location.href);
 if(url.searchParams.get('nova-conta')==='1'){
  const bytes=crypto.getRandomValues(new Uint8Array(16));
  const slot=Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');
  sessionStorage.setItem(STORAGE_KEY,slot);
  url.searchParams.delete('nova-conta');
  window.history.replaceState(window.history.state,'',url.pathname+url.search+url.hash);
 }
 const slot=sessionStorage.getItem(STORAGE_KEY);
 return slot&&validAccountSlot(slot)?slot:null;
}
/** Keep passwords/JWTs out of browser storage; only the random cookie selector is tab-local. */
export function accountFetch(input:RequestInfo|URL,init?:RequestInit):Promise<Response>{
 const url=new URL(input instanceof Request?input.url:String(input),window.location.origin);
 if(url.origin!==window.location.origin||!url.pathname.startsWith('/api/'))return fetch(input,init);
 const headers=new Headers(input instanceof Request?input.headers:undefined);
 new Headers(init?.headers).forEach((value,key)=>headers.set(key,value));
 const slot=tabAccount();
 if(slot)headers.set(ACCOUNT_HEADER,slot);else headers.delete(ACCOUNT_HEADER);
 return fetch(input,{...init,headers});
}
