import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';
const original=await fs.readFile(new URL('../lib/news-translation.ts',import.meta.url),'utf8');
const withoutImports=original.replace("import {plainText} from './comex-news';",`function plainText(s,max=700){return String(s).replace(/<[^>]+>/g,' ').replace(/&nbsp;/gi,' ').replace(/\\s+/g,' ').trim().slice(0,max)}`);
const js=stripTypeScriptTypes(withoutImports,{mode:'strip'});
const mod=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const {translationInput,validTranslation,translateToPortuguese}=mod;
test('limita a requisição a 470 bytes e preserva palavras',()=>{const long='Importações internacionais de produtos e serviços. '.repeat(30);const txt=translationInput(long);assert.ok(Buffer.byteLength(txt,'utf8')<=470);assert.ok(txt.endsWith('.')||txt.endsWith('serviços')||txt.endsWith('produtos')||txt.endsWith('de'));});
test('remove HTML de resumo recebido de feeds',()=>assert.equal(translationInput('<p>Goods trade improves.</p>'),'Goods trade improves.'));
test('rejeita resultado sem tradução',()=>assert.equal(validTranslation('New trade rules announced','New trade rules announced'),false));
test('rejeita avisos de cota externa',()=>assert.equal(validTranslation('New trade rules announced','MYMEMORY WARNING: DAILY QUOTA EXCEEDED'),false));
test('aceita tradução legítima para português',()=>assert.equal(validTranslation('New trade rules announced','Novas regras comerciais anunciadas'),true));
test('monta URL segura e traduz resultado da API',async()=>{
 let requestUrl='';const mock=async(url)=>{requestUrl=url;return new Response(JSON.stringify({responseStatus:200,responseData:{translatedText:'Acordo comercial anunciado'}}),{status:200,headers:{'content-type':'application/json'}})};
 assert.equal(await translateToPortuguese('Trade agreement announced',mock),'Acordo comercial anunciado');
 const u=new URL(requestUrl);assert.equal(u.hostname,'api.mymemory.translated.net');assert.equal(u.searchParams.get('langpair'),'en|pt-BR');
});
test('recusa HTTP de erro ou resposta incompleta',async()=>{
 await assert.rejects(()=>translateToPortuguese('New trade rules',async()=>new Response('',{status:429})),/indisponível/);
 await assert.rejects(()=>translateToPortuguese('New trade rules',async()=>new Response(JSON.stringify({responseStatus:403}),{status:200})),/não foi confirmada/);
});
test('rota pública entrega exclusivamente conteúdo pt-BR revisado ou traduzido',async()=>{
 const api=await fs.readFile(new URL('../app/api/news/route.ts',import.meta.url),'utf8');
 assert.match(api,/title_pt AS title/);assert.match(api,/translation_status='ready'/);assert.match(api,/title_pt ILIKE/);
});
test('notícia manual não depende de tradução externa',async()=>{
 const api=await fs.readFile(new URL('../app/api/admin/route.ts',import.meta.url),'utf8');
 assert.match(api,/news\.translation/);assert.match(api,/manual-pt/);assert.match(api,/translation_status='ready'/);
});
test('backfill preserva textos originais',async()=>{
 const sql=await fs.readFile(new URL('../db/news-pt-backfill.sql',import.meta.url),'utf8');
 assert.match(sql,/title_pt=v\.title_pt/);assert.doesNotMatch(sql,/SET\s+title=/);assert.match(sql,/revisao-editorial/);
});
