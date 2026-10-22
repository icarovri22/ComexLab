import {tabAccount} from './account-fetch';
export const accountPreferenceKey=(key:string,owner:string)=>`${key}:account:${owner}`;
export function readAccountPreference(key:string,owner:string){
 const scoped=localStorage.getItem(accountPreferenceKey(key,owner));
 // Historical browser preferences belong only to the original account, never a new tab account.
 if(scoped!==null)return scoped;
 if(tabAccount()!==null)return null;
 const legacy=localStorage.getItem(key);
 if(legacy!==null){localStorage.setItem(accountPreferenceKey(key,owner),legacy);localStorage.removeItem(key);}
 return legacy;
}
