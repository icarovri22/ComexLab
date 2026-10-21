import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);const ts=require('typescript');const postcss=require('postcss');
const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const luminance=hex=>{const c=hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722};
const contrast=(a,b)=>{const [hi,lo]=[luminance(a),luminance(b)].sort((a,b)=>b-a);return (hi+.05)/(lo+.05)};
test('each optional palette preserves readable accents in light and dark modes',()=>{
 const css=postcss.parse(read('app/palettes.css'));const themes=[];
 css.walkRules(rule=>{if(!rule.selector.startsWith('html[data-palette=')||rule.nodes.every(n=>n.prop!=='--primary'))return;const vars=Object.fromEntries(rule.nodes.map(d=>[d.prop,d.value]));themes.push({selector:rule.selector,vars});for(const surface of ['--workspace-bg','--workspace-panel'])assert.ok(contrast(vars['--primary'],vars[surface])>=4.5,`${rule.selector}: ${surface}`)});
 assert.equal(themes.length,8);assert.equal(new Set(themes.filter(t=>t.selector.endsWith('[data-theme="dark"]')).map(t=>t.vars['--primary'])).size,4);
});
test('downloaded simulation PDF uses only grayscale and handles route arrows',()=>{
 const source=ts.transpileModule(read('lib/report-pdf.ts'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const module={exports:{}};new Function('require','module','exports',source)(require,module,module.exports);
 const report={generatedAt:'21/10/2026',operation:'Importação',route:'China → Brasil',product:'Camisetas',total:'R$ 24.850,00',status:'Requer revisão',summary:[],sections:[],checked:['Dados informados'],unchecked:['Alíquotas'],alerts:['Conferir os dados'],sources:[]};
 const doc=module.exports.createSimulationPdf(report);const content=doc.internal.pages.flat().join('\n');assert.match(content,/China\s*->\s*Brasil/);assert.doesNotMatch(content,/\u0000/);
 for(const match of content.matchAll(/([\d.]+) ([\d.]+) ([\d.]+) (rg|RG)\b/g))assert.ok(match[1]===match[2]&&match[2]===match[3],match[0]);
 assert.ok(doc.output('arraybuffer').byteLength>1000);
});
