import test from 'node:test';
import assert from 'node:assert/strict';
import {loginPaletteKey,readLoginPalette} from '../lib/appearance.ts';
test('login defaults to terracotta without a valid saved preference',()=>{
 for(const value of [null,'', 'unknown']) assert.equal(readLoginPalette({getItem:()=>value}),'original');
 assert.equal(readLoginPalette({getItem(){throw new Error('blocked')}}),'original');
});
test('login retrieves only the anonymous browser palette',()=>{
 for(const id of ['blue','green','violet','petrol','original']){
  assert.equal(readLoginPalette({getItem(key){assert.equal(key,loginPaletteKey);return id}}),id);
 }
});
