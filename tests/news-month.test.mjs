import test from 'node:test';
import assert from 'node:assert/strict';
import {newsMonth} from '../lib/news-period.ts';
import {EXCHANGE_CURRENCIES} from '../lib/news-indicators.ts';
test('mês atual usa o calendário de Fortaleza, incluindo os últimos minutos',()=>{
 const last=newsMonth(new Date('2026-11-01T02:59:59Z'));assert.equal(last.key,'2026-10');assert.equal(last.start,'2026-10-01T03:00:00.000Z');assert.equal(last.end,'2026-11-01T03:00:00.000Z');
 const next=newsMonth(new Date('2026-11-01T03:00:00Z'));assert.equal(next.key,'2026-11');assert.equal(next.end,'2026-12-01T03:00:00.000Z');
});
test('virada de ano e fevereiro bissexto não usam janela fixa de 30 dias',()=>{
 assert.equal(newsMonth(new Date('2027-01-01T03:00:00Z')).key,'2027-01');
 const feb=newsMonth(new Date('2028-02-29T12:00:00Z'));assert.equal(feb.start,'2028-02-01T03:00:00.000Z');assert.equal(feb.end,'2028-03-01T03:00:00.000Z');
});
test('euro e dólar possuem séries e unidades independentes',()=>{assert.equal(EXCHANGE_CURRENCIES.USD.series,1);assert.equal(EXCHANGE_CURRENCIES.EUR.series,21619);assert.equal(EXCHANGE_CURRENCIES.EUR.symbol,'€');assert.notEqual(EXCHANGE_CURRENCIES.EUR.source,EXCHANGE_CURRENCIES.USD.source)});
