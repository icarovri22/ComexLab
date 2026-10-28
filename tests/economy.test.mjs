import test from 'node:test';
import assert from 'node:assert/strict';
import {parseEconomicSeries} from '../lib/economy.ts';
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
