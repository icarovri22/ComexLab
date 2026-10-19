import assert from 'node:assert/strict';
import {findCountries,flagForCountryCode} from '../lib/markets.ts';

const sample=[
  {code:'BR',name:'Brasil',continent:'SA'},
  {code:'CN',name:'China',continent:'AS'},
  {code:'NL',name:'Países Baixos',continent:'EU'},
  {code:'DE',name:'Alemanha',continent:'EU'},
  {code:'US',name:'Estados Unidos',continent:'NA'},
  {code:'JP',name:'Japão',continent:'AS'},
];
assert.deepEqual(findCountries(sample,'br').map(c=>c.code),['BR']);
assert.deepEqual(findCountries(sample,'paises').map(c=>c.code),['NL']);
assert.deepEqual(findCountries(sample,'JAPAO').map(c=>c.code),['JP']);
assert.deepEqual(findCountries(sample,'us').map(c=>c.code),['US']);
assert.deepEqual(findCountries(sample,'china').map(c=>c.code),['CN']);
assert.equal(findCountries(sample,'xxy').length,0);
assert.deepEqual(findCountries(sample,'',2).map(c=>c.code),['BR','CN']);
assert.equal(flagForCountryCode('BR'),'🇧🇷');
assert.equal(flagForCountryCode('nl'),'🇳🇱');
assert.equal(flagForCountryCode('invalid'),'🌐');
console.log('PASS: 10 verificações de busca e bandeiras do seletor simplificado.');
