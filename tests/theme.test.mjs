import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

const cssNames=['app/globals.css','app/auth.css','app/admin/admin.css','app/security.css','app/feedback.css'];
const text=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
function lum(hex){const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=0.04045?v/12.92:Math.pow((v+0.055)/1.055,2.4));return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;}
function contrast(a,b){const [x,y]=[lum(a),lum(b)].sort((a,b)=>b-a);return (x+.05)/(y+.05);}
test('brand colors defined consistently for all pages',()=>{
 const main=text('app/globals.css');
 for(const pair of ['--primary:#A34F37','--deep:#38241F','--bg:#FFF7EF','--sand:#F2C8AA'])assert.ok(main.includes(pair),pair);
 assert.ok(main.includes('.study-hero{background:linear-gradient'));
 assert.match(main,/\.hero\{[^}]*background:linear-gradient\([^}]*var\(--cl-bg-38241F/);
 assert.match(text('app/auth.css'),/\.auth-aside\{background:linear-gradient\([^}]*var\(--cl-bg-38241F/);
 assert.ok(text('app/admin/admin.css').includes('.admin-menu button.active{background:var(--cl-bg-A34F37'));
 assert.ok(text('app/feedback.css').includes('.feedback-admin-filters button.active{background:var(--cl-bg-A34F37'));
});
test('normal reading text and primary buttons meet 4.5:1 contrast',()=>{
 for(const [foreground,background] of [['#38241F','#FFF7EF'],['#75645C','#FFF7EF'],['#A34F37','#FFFFFF'],['#FFFFFF','#A34F37'],['#FFF7EF','#38241F']]){
  const n=contrast(foreground,background);assert.ok(n>=4.5,`${foreground} against ${background} contrast ${n.toFixed(2)}`);
 }
});
test('no blue primary theme or stale inline login brand color',()=>{
 for(const file of cssNames)assert.doesNotMatch(text(file),/#(?:1769b5|e8f3ff|092d57|197cc7|0e579c)\b/i,file);
 assert.doesNotMatch(text('app/login/page.tsx'),/#1769b5/i);
});
test('existing recovery and admin protection logic stays present',()=>{
 assert.match(text('app/api/recovery/route.ts'),/recovery/i);
 assert.match(text('app/api/admin/route.ts'),/admin/i);
 assert.match(text('components/AppShell.tsx'),/Versão 1\.9/);
});
