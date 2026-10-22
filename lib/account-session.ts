/** An opaque tab selector chooses an HttpOnly cookie; it is never authentication itself. */
export const ACCOUNT_HEADER='x-comexhub-account';
export const LEGACY_SESSION_COOKIE='comexlab_session';
export const ACCOUNT_COOKIE_PREFIX='comexhub_account_';
export const validAccountSlot=(value:string)=>/^[a-f0-9]{32}$/.test(value);
type SessionRequest={headers:{get:(name:string)=>string|null};cookies:{get:(name:string)=>{value:string}|undefined}};
export function sessionCookieName(req:Pick<SessionRequest,'headers'>):string|null{
 const slot=req.headers.get(ACCOUNT_HEADER);
 return slot===null?LEGACY_SESSION_COOKIE:validAccountSlot(slot)?ACCOUNT_COOKIE_PREFIX+slot:null;
}
export function selectedSession(req:SessionRequest):string|undefined{
 const name=sessionCookieName(req);return name?req.cookies.get(name)?.value:undefined;
}
