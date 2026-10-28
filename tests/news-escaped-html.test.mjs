import test from 'node:test';
import assert from 'node:assert/strict';
import {plainText,parseOfficialFeed} from '../lib/comex-news.ts';
test('limpa HTML escapado e duplamente escapado antes de limitar o resumo',()=>{
 const html='&lt;p&gt;&lt;a href=&quot;https://example.com&quot;&gt;&lt;img src=&quot;logo.svg&quot; alt=&quot;Logo&quot;&gt;&lt;/a&gt;&lt;/p&gt;&lt;p&gt;Governo libera recursos para saúde.&lt;/p&gt;';
 assert.equal(plainText(html),'Governo libera recursos para saúde.');
 assert.equal(plainText(html.replaceAll('&','&amp;')),'Governo libera recursos para saúde.');
 assert.equal(plainText('Texto da notícia <a href="trecho cortado'),'Texto da notícia');
 assert.equal(plainText('&lt;script&gt;alert(1)&lt;/script&gt;&lt;p&gt;Notícia&lt;/p&gt;'),'Notícia');
});
test('feed com resumo escapado mantém somente o texto legível',()=>{
 const xml='<rss><channel><item><title>Notícia sobre economia</title><link>https://agenciabrasil.ebc.com.br/economia/noticia</link><description>&lt;p&gt;Economia e comércio exterior.&lt;/p&gt;</description><pubDate>Wed, 28 Oct 2026 10:00:00 GMT</pubDate></item></channel></rss>';
 assert.equal(parseOfficialFeed(xml,['ebc.com.br'],new Date('2026-10-28T12:00:00Z'))[0].description,'Economia e comércio exterior.');
});
