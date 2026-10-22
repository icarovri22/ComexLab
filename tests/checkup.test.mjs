import {selectedSession} from '../lib/account-session.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {isPublicAuthPage} from '../lib/auth-pages.ts';
import {readStoredJson,chooseSimulationDraft,isSimulationReport,mergeSimulationHistory} from '../lib/simulation-storage.ts';
import {classifyNews} from '../lib/comex-news.ts';
const report=(extra={})=>({generatedAt:'20 de outubro de 2026 às 10:00',operation:'Importação',route:'China → Brasil',product:'Camiseta',total:'R$ 100',status:'Requer revisão',summary:[],sections:[],alerts:[],checked:[],unchecked:[],sources:[],...extra});
test('recuperação por e-mail é pública; páginas internas seguem protegidas',()=>{for(const path of ['/login','/recuperar','/redefinir'])assert.equal(isPublicAuthPage(path),true);for(const path of ['/admin','/simuladores','/noticias','/redefinir/other'])assert.equal(isPublicAuthPage(path),false)});
test('armazenamento bloqueado ou corrompido não impede restaurar rascunho remoto',()=>{const remote={ncm:'6109.10.00',product:'Camiseta'};const blocked=readStoredJson('draft',()=>{throw Error('Storage denied')});assert.equal(blocked,null);assert.deepEqual(chooseSimulationDraft(blocked,remote),remote);const broken=readStoredJson('draft',()=>({getItem:()=>'{broken'}));assert.equal(broken,null);assert.deepEqual(chooseSimulationDraft([],remote),remote);assert.deepEqual(chooseSimulationDraft({product:'Rascunho local'},remote),{product:'Rascunho local'})});
test('histórico não ressuscita relatório excluído do servidor e preserva registros offline',()=>{const saved=report({serverId:'1'}),offline=report({product:'Offline'});assert.deepEqual(mergeSimulationHistory([], [saved,offline]),[offline]);assert.deepEqual(mergeSimulationHistory([saved],[report(),offline]),[saved,offline]);assert.deepEqual(mergeSimulationHistory(null,[saved]),[saved])});
test('relatórios corrompidos não chegam à renderização ou à gravação',()=>{assert.equal(isSimulationReport(report()),true);for(const broken of [null,[],{generatedAt:'today',sections:[]},report({sources:null}),report({sections:[{title:'Erro',lines:[null]}]})])assert.equal(isSimulationReport(broken),false);assert.deepEqual(mergeSimulationHistory([null,report({serverId:'1'})],[{bad:true}]),[report({serverId:'1'})])});
test('exportações e importações não são confundidas com portos',()=>{assert.equal(classifyNews('Brazil exports increase','Exports and imports grow','mdic').category,'economia');assert.equal(classifyNews('Exportações brasileiras em alta','A balança comercial tem superávit','mdic').category,'economia');assert.equal(classifyNews('New port opens','Shipping capacity expands','wto').category,'logistica')});

test('API recusa relatório incompleto e vincula a exclusão ao dono da sessão',async()=>{
 const {readFileSync}=await import('node:fs');const {createRequire}=await import('node:module');const require=createRequire(import.meta.url);const ts=require('typescript');
 const source=ts.transpileModule(readFileSync(new URL('../app/api/simulations/route.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const calls=[];const query=async(strings,...values)=>{calls.push({sql:strings.join('?'),values});return [{id:'42'}]};
 const mocks={'../../../lib/account-session':{selectedSession},'next/server':{NextResponse:{json:(body,options={})=>({status:options.status||200,body})}},'../../../lib/admin-auth':{verifiedAccount:async()=>({id:'test-owner'}),queryDB:()=>query,noStore:{}},'../../../lib/security':{cookieName:'session'},'../../../lib/simulation-storage':{isSimulationReport}};
 const module={exports:{}};new Function('require','module','exports',source)(name=>mocks[name],module,module.exports);
 const req=(payload={})=>({headers:new Headers({origin:'https://unit.invalid'}),nextUrl:{host:'unit.invalid',searchParams:new URLSearchParams({id:'42'})},cookies:{get:()=>({value:'test-session'})},text:async()=>JSON.stringify(payload)});
 assert.equal((await module.exports.POST(req({generatedAt:'today',sections:[]}))).status,400);assert.equal(calls.length,0);
 assert.equal((await module.exports.POST(req(report()))).status,201);assert.equal(calls[0].values[0],'test-owner');
 assert.equal((await module.exports.DELETE(req())).status,200);assert.match(calls[1].sql,/id=\? AND user_id=\?/);assert.deepEqual(calls[1].values,['42','test-owner']);
});

test('gerador de PDF atualizado produz um documento A4 válido',async()=>{
 const {readFileSync}=await import('node:fs');const {createRequire}=await import('node:module');const require=createRequire(import.meta.url);const ts=require('typescript');
 const source=ts.transpileModule(readFileSync(new URL('../lib/report-pdf.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const module={exports:{}};new Function('require','module','exports',source)(require,module,module.exports);
 const pdf=module.exports.createSimulationPdf(report({sections:[{title:'Custos',lines:[{label:'Total',value:'R$ 100,00'}]}]}));
 const bytes=Buffer.from(pdf.output('arraybuffer'));assert.equal(bytes.subarray(0,5).toString(),'%PDF-');assert.ok(bytes.length>1000);assert.ok(Math.abs(pdf.internal.pageSize.getWidth()-210)<1);assert.ok(Math.abs(pdf.internal.pageSize.getHeight()-297)<1);
});
