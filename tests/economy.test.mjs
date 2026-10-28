import test from 'node:test';
import assert from 'node:assert/strict';
import {parseEconomicSeries,parseGdpSeries} from '../lib/economy.ts';
import {readFile} from 'node:fs/promises';
test('consulta do Panorama respeita o limite de 20 observações do SGS',async()=>{
 const source=await readFile(new URL('../app/api/news/economy/route.ts',import.meta.url),'utf8');
 const requested=[...source.matchAll(/\/ultimos\/(\d+)\?/g)].map(match=>Number(match[1]));
 assert.ok(requested.length>0);
 assert.ok(requested.every(count=>count>0&&count<=20));
});
test('indicadores preservam zero e deflação, descartam datas futuras e valores ausentes',()=>{
 assert.deepEqual(parseEconomicSeries([{data:'01/09/2026',valor:'-0,2'},{data:'01/08/2026',valor:'0'},{data:'01/12/2026',valor:'9'},{data:'31/02/2026',valor:'4'},{data:'01/07/2026',valor:''}],new Date('2026-10-28T00:00:00Z')),[{date:'2026-08-01',value:0},{date:'2026-09-01',value:-.2}]);
});
test('PIB seleciona Brasil, variável e setor corretos; ignora cabeçalhos e dados ausentes',()=>{
 const row={D1C:'1',D2C:'6561',D4C:'90707',MC:'2',D3C:'202602',V:'2.0'};
 const values=parseGdpSeries([{V:'Valor'},row,{...row,D3C:'202601',V:'-0,5'},{...row,D3C:'202504',V:'0'},{...row,D3C:'202604'},{...row,D4C:'999'},{...row,D3C:'202503',V:'..'},{...row,D3C:'202500'}],new Date('2026-10-28T00:00:00Z'));
 assert.deepEqual(values.map(x=>[x.value,x.periodLabel]),[[0,'4º trimestre de 2025'],[-.5,'1º trimestre de 2026'],[2,'2º trimestre de 2026']]);
});
