import {test} from 'node:test';
import assert from 'node:assert/strict';
import {palettes,readPalette,paletteKey,validPalette} from '../lib/appearance.ts';
test('palette defaults and storage remain separate for each account',()=>{
 const values=new Map();const storage={getItem:key=>values.get(key)??null};
 assert.equal(palettes[0].id,'original');assert.equal(readPalette(storage,'alice'),'original');
 values.set(paletteKey('alice'),'blue');assert.equal(readPalette(storage,'alice'),'blue');assert.equal(readPalette(storage,'bob'),'original');
 values.set(paletteKey('alice'),'invalid');assert.equal(readPalette(storage,'alice'),'original');
 assert.equal(readPalette({getItem(){throw Error('blocked')}},'alice'),'original');
 assert.equal(validPalette(null),false);assert.equal(palettes.length,5);
});
test('palette buttons maintain accessible white-label contrast',()=>{
 const lum=hex=>{const c=hex.match(/\w\w/g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722};
 for(const p of palettes)assert.ok(1.05/(lum(p.colors[0].slice(1))+.05)>=4.5,p.name);
});
