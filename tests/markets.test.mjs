import assert from 'node:assert/strict';
import {CONTINENTS,groupCountries,isCrossBorder,isIntraEU,normalizeContinent,taxRegimeFor,tariffReferences} from '../lib/markets.ts';
const sample=[
 {code:'BR',name:'Brasil',continent:'SA'},
 {code:'US',name:'Estados Unidos',continent:'NA'},
 {code:'NL',name:'Países Baixos',continent:'EU'},
 {code:'CN',name:'China',continent:'AS'},
 {code:'AO',name:'Angola',continent:'AF'},
 {code:'NZ',name:'Nova Zelândia',continent:'OC'},
 {code:'AQ',name:'Antártida',continent:'AN'},
];
assert.equal(CONTINENTS.length,8);
assert.equal(new Set(CONTINENTS.map(c=>c.code)).size,8);
assert.equal(groupCountries(sample).reduce((n,g)=>n+g.countries.length,0),7);
assert.equal(groupCountries(sample,'AS')[0].countries[0].code,'CN');
assert.equal(groupCountries(sample,'EU')[0].countries[0].code,'NL');
assert.equal(groupCountries(sample,'ALL','paises')[0].countries[0].code,'NL');
assert.equal(groupCountries(sample,'ALL','br').length,1);
assert.equal(groupCountries(sample,'SA').length,1);
assert.equal(normalizeContinent('XX'),'OTHER');
assert.equal(isCrossBorder('CN','US'),true);
assert.equal(isCrossBorder('BR','BR'),false);
assert.equal(isIntraEU('DE','FR'),true);
assert.equal(isIntraEU('CN','DE'),false);
assert.equal(taxRegimeFor('BR'),'brasil');
assert.equal(taxRegimeFor('NL'),'internacional');
assert.match(tariffReferences('BR','NL')[0].url,/access-to-markets/);
assert.match(tariffReferences('CN','BR')[0].name,/Receita/);
assert.match(tariffReferences('CN','US')[0].url,/usitc/);
assert.match(tariffReferences('JP','ZA')[0].url,/wto/);
console.log('PASS: 19 testes de continentes, rotas e tributação por destino.');
