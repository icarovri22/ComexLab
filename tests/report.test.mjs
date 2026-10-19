import assert from 'node:assert/strict';
import {createSimulationReport} from '../lib/simulation-report.ts';
import {calculateBrazilImport,calculateDestinationTax,formatUsd} from '../lib/calc.ts';
function draft(overrides={}){
 return {
  operation:'Importação',route:'China (CN) → Brasil (BR)',product:'Camisetas',
  summary:[{label:'Código HS',value:'610990'}],
  sections:[{title:'Custos',lines:[{label:'Base CIF',value:formatUsd(1200)}]}],
  total:formatUsd(2000),
  hasInternationalRoute:true,modeCompatible:true,taxCompleted:true,
  tradeEuInternal:false,positiveGoods:true,messages:[],
  checked:['NCM conferido'],unchecked:['Invoice conferida'],
  sources:[{name:'ICC',url:'https://iccwbo.org/business-solutions/incoterms-rules/incoterms-2020/'}],
  ...overrides,
 };
}
const timestamp=new Date('2026-10-09T14:01:00.000Z');
const valid=createSimulationReport(draft(),timestamp);
assert.equal(valid.status,'Completa para fins didáticos');
assert.equal(valid.alerts.length,0);
assert.match(valid.generatedAt,/09|9 de outubro/i);
assert.equal(valid.checked.length,1);
assert.equal(valid.unchecked.length,1);
assert.equal(valid.sources.length,1);
const missing=createSimulationReport(draft({taxCompleted:false,total:'Pendente'}),timestamp);
assert.equal(missing.status,'Requer revisão');
assert.equal(missing.total,'Pendente');
assert.match(missing.alerts.join(' '),/Tributação não apurada/);
assert.equal(createSimulationReport(draft({modeCompatible:false}),timestamp).status,'Requer revisão');
assert.equal(createSimulationReport(draft({hasInternationalRoute:false}),timestamp).status,'Requer revisão');
assert.equal(createSimulationReport(draft({tradeEuInternal:true}),timestamp).status,'Requer revisão');
assert.equal(createSimulationReport(draft({positiveGoods:false}),timestamp).status,'Requer revisão');
assert.equal(createSimulationReport(draft({messages:['Alerta','Alerta']}),timestamp).alerts.length,1);
assert.equal(calculateDestinationTax(1200,'10','20').total,384);
assert.equal(calculateBrazilImport(1200,{ii:'10',ipi:'5',pis:'1',cofins:'4',icms:'18'}).complete,true);
const input=draft();const snapshot=createSimulationReport(input,timestamp);
input.summary[0].value='after';input.sections[0].lines[0].value='after';input.checked.push('other');input.sources[0].url='after';
assert.equal(snapshot.summary[0].value,'610990');assert.equal(snapshot.sections[0].lines[0].value,formatUsd(1200));
assert.equal(snapshot.checked.length,1);assert.equal(snapshot.sources[0].url.includes('iccwbo'),true);
console.log('PASS: 16 verificações de snapshots, alertas, pendências e cálculos preservados.');
