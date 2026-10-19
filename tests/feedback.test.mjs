import test from 'node:test';
import assert from 'node:assert/strict';
import {validateFeedback,MAX_FEEDBACK_LENGTH} from '../lib/feedback.ts';

test('rating-only is accepted',()=>assert.deepEqual(validateFeedback({rating:5,suggestion:''}),{ok:true,value:{rating:5,suggestion:''}}));
test('suggestion-only is accepted',()=>assert.deepEqual(validateFeedback({rating:null,suggestion:'  Gostaria de mais exemplos  '}),{ok:true,value:{rating:null,suggestion:'Gostaria de mais exemplos'}}));
test('combined rating and suggestion accepted',()=>assert.equal(validateFeedback({rating:1,suggestion:'A melhorar'}).ok,true));
test('empty feedback is refused',()=>assert.equal(validateFeedback({rating:null,suggestion:'  '}).ok,false));
test('fractional star is refused',()=>assert.equal(validateFeedback({rating:2.5,suggestion:'ok'}).ok,false));
test('rating above five refused',()=>assert.equal(validateFeedback({rating:7,suggestion:''}).ok,false));
test('rating below one refused',()=>assert.equal(validateFeedback({rating:0,suggestion:''}).ok,false));
test('string rating is refused',()=>assert.equal(validateFeedback({rating:'5',suggestion:'olá'}).ok,false));
test('non-string suggestion is refused',()=>assert.equal(validateFeedback({rating:5,suggestion:123}).ok,false));
test('comment longer than 1500 refused',()=>assert.equal(validateFeedback({rating:5,suggestion:'x'.repeat(MAX_FEEDBACK_LENGTH+1)}).ok,false));
test('maximum comment length accepted',()=>assert.equal(validateFeedback({suggestion:'x'.repeat(MAX_FEEDBACK_LENGTH)}).ok,true));
test('array payload is refused',()=>assert.equal(validateFeedback([]).ok,false));
