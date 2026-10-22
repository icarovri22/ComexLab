export const accountPreferenceKey=(key:string,owner:string)=>`${key}:account:${owner}`;
export function readAccountPreference(key:string,owner:string){
 // Unscoped historical browser data cannot be assigned safely to a signed-in account.
 return localStorage.getItem(accountPreferenceKey(key,owner));
}
