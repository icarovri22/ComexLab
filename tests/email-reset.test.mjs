import assert from 'node:assert/strict';
import {test} from 'node:test';
import {anonymousLimiterKey,CANONICAL_APP_ORIGIN,emailBody,emailDeliveryReady,GENERIC_REQUEST_MESSAGE,hashEmailToken,isValidToken,newEmailToken,normalizeEmail,recoveryLink,secureEqualHex,validEmail,sendRecoveryEmail} from '../lib/email-reset.ts';

test('links always use the official HTTPS domain, not a caller-controlled host',()=>{
 const t=newEmailToken();const url=new URL(recoveryLink(t));
 assert.equal(url.origin,CANONICAL_APP_ORIGIN);assert.equal(url.pathname,'/redefinir');assert.equal(url.searchParams.get('token'),t);
 assert.throws(()=>recoveryLink(t,'https://comexhub-app.vercel.app.evil.test/abc'));
 assert.throws(()=>recoveryLink(t,'http://comexlab.vercel.app/'));
 assert.throws(()=>recoveryLink('not-a-token'));
});
test('random token length and keyed digest keep URL token out of database',()=>{
 const a=newEmailToken(),b=newEmailToken();assert.equal(a.length,64);assert.notEqual(a,b);
 assert.ok(isValidToken(a));assert.ok(!isValidToken('1234'));
 const d=hashEmailToken(a,'test-secret');assert.equal(d.length,64);assert.notEqual(d,a);
 assert.ok(secureEqualHex(d,hashEmailToken(a,'test-secret')));assert.ok(!secureEqualHex(d,hashEmailToken(b,'test-secret')));
});
test('email is normalized, validated and rate-limiter key avoids storing addresses',()=>{
 assert.equal(normalizeEmail(' User@Example.COM '),'user@example.com');assert.ok(validEmail('user@example.com'));assert.ok(!validEmail('no-@-domain'));
 const key=anonymousLimiterKey('request','user@example.com','secret');assert.ok(!key.includes('user@example.com'));
 assert.ok(GENERIC_REQUEST_MESSAGE.includes('Se houver uma conta'));
});
test('message contains a usable absolute link and one-time expiry guidance',()=>{
 const link=recoveryLink(newEmailToken());const {html,text}=emailBody(link);
 assert.ok(html.includes(`href="${link}"`));assert.ok(text.includes(link));assert.ok(html.includes('15 minutos'));assert.ok(text.includes('uma vez'));
});
test('mailer fails closed if missing sender or key',async()=>{
 const oldKey=process.env.RESEND_API_KEY,oldFrom=process.env.EMAIL_FROM;
 try{delete process.env.RESEND_API_KEY;delete process.env.EMAIL_FROM;assert.equal(emailDeliveryReady(),false);await assert.rejects(sendRecoveryEmail('test@example.com',recoveryLink(newEmailToken()),async()=>{throw Error('should not fetch')}));}
 finally{if(oldKey)process.env.RESEND_API_KEY=oldKey;else delete process.env.RESEND_API_KEY;if(oldFrom)process.env.EMAIL_FROM=oldFrom;else delete process.env.EMAIL_FROM;}
});
test('mailer formats Resend POST with no recipient input in the link',async()=>{
 const oldKey=process.env.RESEND_API_KEY,oldFrom=process.env.EMAIL_FROM,oldSecret=process.env.AUTH_SECRET;
 try{
 process.env.RESEND_API_KEY='re_test';process.env.EMAIL_FROM='security@example.com';process.env.AUTH_SECRET='a'.repeat(64);
 const link=recoveryLink(newEmailToken());
 let called=false;
 const result=await sendRecoveryEmail('to@example.com',link,async (url,opts)=>{
  called=true;assert.equal(url,'https://api.resend.com/emails');
  const data=JSON.parse(opts.body);assert.equal(data.from,'ComexHub <security@example.com>');assert.equal(data.to[0],'to@example.com');assert.ok(data.text.includes(link));assert.ok(data.html.includes(link));
  return {ok:true,json:async()=>({id:'mock-id-1'})};
 });
 assert.equal(result,'mock-id-1');assert.equal(called,true);
 }finally{for(const [key,old] of [['RESEND_API_KEY',oldKey],['EMAIL_FROM',oldFrom],['AUTH_SECRET',oldSecret]]){if(old===undefined)delete process.env[key];else process.env[key]=old;}}
});
