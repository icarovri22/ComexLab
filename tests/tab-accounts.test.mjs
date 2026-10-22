import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {webcrypto} from 'node:crypto';
import * as session from '../lib/account-session.ts';
const require=createRequire(import.meta.url),ts=require('typescript');
function load(file,mocks={},globals={}){const code=ts.transpileModule(readFileSync(new URL('../'+file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const module={exports:{}};new Function('require','module','exports',...Object.keys(globals),code)(name=>name in mocks?mocks[name]:require(name),module,module.exports,...Object.values(globals));return module.exports;}
const A='a'.repeat(32),B='b'.repeat(32);
const jar=new Map();
const req=(slot,extra={})=>({headers:new Headers(slot===null?{}:{[session.ACCOUNT_HEADER]:slot}),cookies:{get:name=>jar.has(name)?{value:jar.get(name)}:undefined,getAll:()=>[...jar].map(([name,value])=>({name,value}))},...extra});
const response={json:(body,options={})=>({body,status:options.status||200,cookies:{changes:[],set(name,value,options){this.changes.push({name,value,options})}}})};
const security=load('lib/security.ts',{'./account-session':session,'next/server':{NextResponse:response}},{process:{env:{AUTH_SECRET:'test-only-tab-account-secret-'.repeat(3),DATABASE_URL:'test-only',NODE_ENV:'production'}}});
const users=[{id:'1',username:'alice',role:'admin',is_active:true,session_version:0},{id:'2',username:'bob',role:'user',is_active:true,session_version:0}];
const dbCalls=[];
const sql=async(strings,...values)=>{const text=strings.join('?');dbCalls.push({text,values});if(text.includes('COUNT(*)'))return [{count:0}];if(text.includes('comexlab_users'))return users.filter(u=>text.includes('password_hash')?u.username===values[0]:u.id===values[0]).map(u=>({...u,password_hash:'hashed'}));return []};
const identities=load('lib/admin-auth.ts',{'./security':security,'@neondatabase/serverless':{neon:()=>sql}},{process:{env:{DATABASE_URL:'test-only'}}});
const auth=load('app/api/auth/route.ts',{'../../../lib/account-session':session,'../../../lib/security':security,'../../../lib/admin-auth':identities,'next/server':{NextResponse:response},bcryptjs:{compare:async(p,h)=>p==='test-password'&&h==='hashed'}});
async function requestLogin(slot,username){const result=await auth.POST(req(slot,{headers:new Headers({...(slot===null?{}:{[session.ACCOUNT_HEADER]:slot}),origin:'https://app.test'}),nextUrl:{host:'app.test'},text:async()=>JSON.stringify({mode:'login',username,password:'test-password'})}));for(const c of result.cookies.changes){if(c.options.maxAge===0)jar.delete(c.name);else jar.set(c.name,c.value)}return result;}
test('two real signed sessions remain separate through login, reload, logout and admin checks',async()=>{
 jar.clear();assert.equal((await requestLogin(A,'alice')).status,200);const first=jar.get(session.ACCOUNT_COOKIE_PREFIX+A);
 assert.equal((await requestLogin(B,'bob')).status,200);assert.equal(jar.get(session.ACCOUNT_COOKIE_PREFIX+A),first);
 assert.equal((await auth.GET(req(A))).body.username,'alice');assert.equal((await auth.GET(req(B))).body.username,'bob');
 assert.equal((await identities.verifiedAdmin(session.selectedSession(req(A)))).username,'alice');assert.equal(await identities.verifiedAdmin(session.selectedSession(req(B))),null);
 for(const slot of [A,B])assert.equal((await auth.GET(req(slot))).body.loggedIn,true);
 const logout=await auth.POST(req(B,{headers:new Headers({[session.ACCOUNT_HEADER]:B,origin:'https://app.test'}),nextUrl:{host:'app.test'},text:async()=>JSON.stringify({mode:'logout'})}));for(const c of logout.cookies.changes)if(c.options.maxAge===0)jar.delete(c.name);
 assert.equal((await auth.GET(req(A))).body.username,'alice');assert.equal((await auth.GET(req(B))).body.loggedIn,false);
 assert.ok(logout.cookies.changes.every(c=>c.name!==session.ACCOUNT_COOKIE_PREFIX+A));
});
test('legacy login is preserved and invalid/missing selected sessions never fall back to another account',async()=>{
 await requestLogin(null,'alice');assert.equal((await auth.GET(req(null))).body.username,'alice');
 for(const slot of ['invalid','c'.repeat(32),''])assert.equal((await auth.GET(req(slot))).body.loggedIn,false);
 const r=await requestLogin(B,'bob');const cookie=r.cookies.changes.find(c=>c.name===session.ACCOUNT_COOKIE_PREFIX+B);assert.ok(cookie.options.httpOnly);assert.ok(cookie.options.secure);assert.equal(cookie.options.sameSite,'lax');
 users[1].session_version++;assert.equal((await auth.GET(req(B))).body.loggedIn,false);users[1].session_version--;
 users[1].is_active=false;assert.equal((await auth.GET(req(B))).body.loggedIn,false);users[1].is_active=true;
});
test('simulation reads and writes resolve the selected owner even with an admin cookie in another tab',async()=>{
 await requestLogin(A,'alice');await requestLogin(B,'bob');
 const {isSimulationReport}=await import('../lib/simulation-storage.ts');
 const api=load('app/api/simulations/route.ts',{'../../../lib/account-session':session,'../../../lib/admin-auth':identities,'../../../lib/security':security,'../../../lib/simulation-storage':{isSimulationReport},'next/server':{NextResponse:response}});
 dbCalls.length=0;
 for(const slot of [A,B])await api.GET(req(slot));
 const queries=dbCalls.filter(c=>c.text.includes('FROM comexhub_simulation_drafts'));assert.equal(queries[0].values[0],'1');assert.equal(queries[1].values[0],'2');
 for(const slot of [A,B])assert.equal((await api.PUT(req(slot,{headers:new Headers({[session.ACCOUNT_HEADER]:slot,origin:'https://app.test'}),nextUrl:{host:'app.test'},text:async()=>JSON.stringify({product:slot===A?'Produto A':'Produto B'})}))).status,200);
 const writes=dbCalls.filter(c=>c.text.includes('INSERT INTO comexhub_simulation_drafts'));assert.deepEqual(writes.map(c=>c.values[0]),['1','2']);
 const result=await api.GET(req('d'.repeat(32)));assert.equal(result.status,401);
});
function browser(href,stored=new Map()){
 const calls=[];const window={location:{href,origin:'https://app.test'},history:{state:{},replaceState(_state,_unused,url){window.location.href=new URL(url,window.location.href).href}}};
 const storage={getItem:key=>stored.get(key)||null,setItem:(key,value)=>stored.set(key,value)};
 const context={window,sessionStorage:storage,crypto:webcrypto,fetch:async(input,init)=>{calls.push({input,init});return new Response('{}')}};
 return {...load('lib/account-fetch.ts',{'./account-session':session},context),calls,stored,window};
}
test('ordinary new tabs isolate accounts automatically, survive reload and never send selectors to another origin',async()=>{
 const first=browser('https://app.test/login');const second=browser('https://app.test/login?next=%2Fsimuladores');
 await first.accountFetch('/api/auth');await second.accountFetch('/api/auth',{headers:{'Content-Type':'application/json'}});
 const firstSlot=first.calls[0].init.headers.get(session.ACCOUNT_HEADER);assert.ok(session.validAccountSlot(firstSlot));
 const slot=second.calls[0].init.headers.get(session.ACCOUNT_HEADER);assert.notEqual(slot,firstSlot);assert.ok(session.validAccountSlot(slot));assert.ok(!second.window.location.href.includes('nova-conta'));assert.ok(second.window.location.href.includes('next='));
 const reload=browser(second.window.location.href,second.stored);await reload.accountFetch('/api/simulations');assert.equal(reload.calls[0].init.headers.get(session.ACCOUNT_HEADER),slot);
 await second.accountFetch(new Request('https://app.test/api/auth',{headers:{Accept:'application/json'}}));assert.equal(second.calls[1].init.headers.get('Accept'),'application/json');
 await second.accountFetch('https://external.test/api/auth');assert.equal(second.calls[2].init,undefined);
});
test('middleware accepts the selected signed cookie and rejects a missing slot despite other valid cookies',async()=>{
 await requestLogin(A,'alice');
 const {isPublicAuthPage}=await import('../lib/auth-pages.ts');const {isNewsCronRequest}=await import('../lib/news-cron.ts');
 const {middleware}=load('middleware.ts',{'./lib/account-session':session,'./lib/auth-pages':{isPublicAuthPage},'./lib/news-cron':{isNewsCronRequest},'next/server':{NextResponse:{...response,next:()=>({status:200,next:true})}}},{process:{env:{AUTH_REQUIRED:'true',AUTH_SECRET:'test-only-tab-account-secret-'.repeat(3)}}});
 for(const [slot,status] of [[A,200],['e'.repeat(32),401],['invalid',401]])assert.equal((await middleware(req(slot,{method:'GET',nextUrl:{pathname:'/api/simulations'}}))).status,status);
 const emptySession={headers:new Headers(),cookies:{get:()=>undefined,getAll:()=>[]}};
 assert.equal((await auth.GET(emptySession)).body.loggedIn,false);
});
test('study and NCM preferences are scoped to each account without inheriting unscoped browser data',()=>{
 const values=new Map([['progress','["fundamentos"]']]);const localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
 const original=load('lib/account-preferences.ts',{'./account-fetch':{tabAccount:()=>null}},{localStorage});
 const second=load('lib/account-preferences.ts',{'./account-fetch':{tabAccount:()=>B}},{localStorage});
 assert.equal(second.readAccountPreference('progress','bob'),null);assert.equal(original.readAccountPreference('progress','alice'),null);localStorage.setItem(original.accountPreferenceKey('progress','alice'),'["fundamentos"]');
 assert.equal(second.readAccountPreference('progress','bob'),null);assert.equal(values.get('progress'),'["fundamentos"]');
 localStorage.setItem(second.accountPreferenceKey('progress','bob'),'["modais"]');assert.equal(original.readAccountPreference('progress','alice'),'["fundamentos"]');assert.equal(second.readAccountPreference('progress','bob'),'["modais"]');
});

test('invalid stored tab selectors are replaced automatically and old links remain compatible',async()=>{
 const damaged=browser('https://app.test/login',new Map([['comexhub:account-tab','invalid']]));await damaged.accountFetch('/api/auth');assert.ok(session.validAccountSlot(damaged.calls[0].init.headers.get(session.ACCOUNT_HEADER)));
 const old=browser('https://app.test/login?nova-conta=1');await old.accountFetch('/api/auth');assert.ok(session.validAccountSlot(old.calls[0].init.headers.get(session.ACCOUNT_HEADER)));assert.ok(!old.window.location.href.includes('nova-conta'));
});
