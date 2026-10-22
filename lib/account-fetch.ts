import {ACCOUNT_HEADER,validAccountSlot} from './account-session';
const STORAGE_KEY='comexhub:account-tab';
export function tabAccount(){
 const url=new URL(window.location.href);
 let slot=sessionStorage.getItem(STORAGE_KEY);
 if(!slot||!validAccountSlot(slot)||url.searchParams.get('nova-conta')==='1'){
  const bytes=crypto.getRandomValues(new Uint8Array(16));
  slot=Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');
  sessionStorage.setItem(STORAGE_KEY,slot);
 }
 // Accept old bookmarked links without requiring an account-switch action.
 if(url.searchParams.has('nova-conta')){
  url.searchParams.delete('nova-conta');
  window.history.replaceState(window.history.state,'',url.pathname+url.search+url.hash);
 }
 return slot;
}
/** Keep passwords/JWTs out of browser storage; only the random cookie selector is tab-local. */
export function accountFetch(input:RequestInfo|URL,init?:RequestInit):Promise<Response>{
 const url=new URL(input instanceof Request?input.url:String(input),window.location.origin);
 if(url.origin!==window.location.origin||!url.pathname.startsWith('/api/'))return fetch(input,init);
 const headers=new Headers(input instanceof Request?input.headers:undefined);
 new Headers(init?.headers).forEach((value,key)=>headers.set(key,value));
 headers.set(ACCOUNT_HEADER,tabAccount());
 return fetch(input,{...init,headers});
}
