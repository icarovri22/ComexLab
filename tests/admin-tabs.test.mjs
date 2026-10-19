import test from 'node:test';
import assert from 'node:assert/strict';
import {currentAdminTabData} from '../lib/admin-tab-data.ts';
import {readFileSync} from 'node:fs';

const overview={summary:{users:2,admins:1},audit:[]};
const feedback={metrics:{total:0,pending:0,ratings:0,average_rating:0},feedback:[]};

test('never expose overview response when switching to Feedback',()=>{
 const previouslyLoaded={tab:'overview',payload:overview};
 assert.equal(currentAdminTabData('feedback',previouslyLoaded),null);
});
test('never expose Feedback response when switching to Overview',()=>{
 assert.equal(currentAdminTabData('overview',{tab:'feedback',payload:feedback}),null);
});
test('render valid matching Feedback results including zero submissions',()=>{
 assert.deepEqual(currentAdminTabData('feedback',{tab:'feedback',payload:feedback}),feedback);
});
test('render valid matching Overview results',()=>{
 assert.deepEqual(currentAdminTabData('overview',{tab:'overview',payload:overview}),overview);
});
test('no results while the requested tab loads',()=>{
 assert.equal(currentAdminTabData('users',null),null);
});
test('component renders only matching loaded tab result',()=>{
 const src=readFileSync(new URL('../app/admin/AdminConsole.tsx',import.meta.url),'utf8');
 assert.match(src,/currentAdminTabData\(tab,loaded\)/);
 assert.match(src,/setLoaded\(\{tab:target,payload:body\}\)/);
 assert.doesNotMatch(src,/setData\(body\)/);
});
