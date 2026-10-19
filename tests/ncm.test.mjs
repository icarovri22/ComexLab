import assert from 'node:assert/strict';
import {buildCatalog,searchCatalog,formatNcm,plain} from '../lib/ncm.ts';
const raw=[
 {Codigo:'61',Descricao:'Vestuário e seus acessórios, de malha'},
 {Codigo:'6109',Descricao:'Camisetas de malha'},
 {Codigo:'6109.10',Descricao:'De algodão'},
 {Codigo:'6109.10.00',Descricao:'De algodão',DataInicio:'2022-04-01',TipoOrgaoAtoIni:'GECEX',NumeroAtoIni:'272',AnoAtoIni:'2021'},
 {Codigo:'6109.90.00',Descricao:'De outras matérias têxteis',DataInicio:'2022-04-01'}
];
for(let i=0;i<5100;i++)raw.push({Codigo:String(i+10000000),Descricao:'Item sintético de teste '+i});
const official=buildCatalog({Nomenclaturas:raw,DataUltimaAlteracao:'2026-10-01'},'Classif');
assert.equal(official.complete,true);
assert.equal(official.updatedAt,'2026-10-01');
assert.equal(official.rows.find(x=>x.code==='6109.10.00')?.headingDescription,'Camisetas de malha');
assert.equal(official.rows.find(x=>x.code==='6109.10.00')?.legalAct,'GECEX · 272 · 2021');
assert.equal(searchCatalog(official,'camiseta algodao',null).results[0]?.code,'6109.10.00');
assert.equal(searchCatalog(official,'6109',null).total,2);
assert.equal(searchCatalog(official,'61091000',null).results[0]?.code,'6109.10.00');
assert.equal(searchCatalog(official,'cafe',null).total,0);
assert.equal(searchCatalog(official,'', '61').total,2);
assert.equal(formatNcm('61091000'),'6109.10.00');
assert.equal(plain('máquinas'), 'maquinas');
const fallback=buildCatalog([{codigo:'3305.10.00',descricao:'Xampus',data_inicio:'2022-04-01'}],'BrasilAPI');
assert.equal(fallback.complete,false);
assert.equal(fallback.rows.length,1);
assert.equal(fallback.rows[0].startDate,'2022-04-01');
console.log('PASS: 13 verificações de NCM (dados sintéticos e normalização)');
