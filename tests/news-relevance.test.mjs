import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isRelevantNews} from '../lib/comex-news.ts';

test('filtra páginas institucionais e notícias nacionais sem relação clara com comex',()=>{
 assert.equal(isRelevantNews('Tarifaço','','mdic'),false);
 assert.equal(isRelevantNews('Norma técnica para pneus de passeio','Projeto integra o Programa Selo Verde Brasil e estabelece critérios ambientais, sociais e de governança','mdic'),false);
 assert.equal(isRelevantNews('Cursos de construção industrializada','Cursos gratuitos estarão disponíveis na plataforma','mdic'),false);
});
test('mantém notícias com conteúdo de comércio exterior e fontes especializadas',()=>{
 assert.equal(isRelevantNews('Brasil define regras para exportadores','Cotas tarifárias de acordo Mercosul EFTA','mdic'),true);
 assert.equal(isRelevantNews('Regras de origem','Preferências para mercados','wto'),true);
});
