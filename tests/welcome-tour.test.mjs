import test from 'node:test';
import assert from 'node:assert/strict';
import {TOUR_STEPS,tourPosition,tourStorageKey} from '../lib/welcome-tour.ts';
const rectangle=(left,top,width,height)=>({left,top,right:left+width,bottom:top+height,width,height});
const overlaps=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
test('guia apresenta todas as seções principais e guarda o estado por conta',()=>{
 assert.deepEqual(TOUR_STEPS.map(s=>s.target),['/','/simuladores','/ncm','/estudos','/noticias','conta']);
 for(const step of TOUR_STEPS){assert.ok(step.title);assert.ok(step.description)}
 assert.notEqual(tourStorageKey('alice'),tourStorageKey('bob'));
});
test('pop-up fica dentro da tela e não encobre a aba quando existe espaço',()=>{
 for(const [width,height,target,popup] of [
  [320,568,rectangle(18,115,140,40),[296,190]],
  [375,667,rectangle(20,400,160,40),[340,200]],
  [768,1024,rectangle(20,450,190,44),[340,220]],
  [1440,900,rectangle(20,700,200,44),[340,200]],
  [800,500,rectangle(735,250,50,40),[340,180]],
 ]){
  const [pw,ph]=popup;const p=tourPosition(target,width,height,pw,ph);
  assert.ok(p.left>=0&&p.top>=0&&p.left+pw<=width&&p.top+ph<=height,`${width}x${height}`);
  assert.equal(overlaps(rectangle(p.left,p.top,pw,ph),target),false,`${width}x${height}`);
 }
});
test('janelas pequenas mantêm o pop-up dentro dos limites mesmo sem espaço ao lado',()=>{
 const p=tourPosition(rectangle(100,30,120,40),320,250,296,226);
 assert.ok(p.left>=0&&p.top>=0&&p.left+296<=320&&p.top+226<=250);
});
