import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {isProtectedAdministrator,PROTECTED_ADMIN_USERNAME,PROTECTED_ADMIN_ID,PROTECTED_OWNER_USERNAME,PROTECTED_OWNER_ID,protectedAdminMessage} from '../lib/protected-admin.ts';

const adminApi=readFileSync(new URL('../app/api/admin/route.ts',import.meta.url),'utf8');
const adminUI=readFileSync(new URL('../app/admin/AdminConsole.tsx',import.meta.url),'utf8');

test('hanna_lr protegida por identificador estável e nome',()=>{
  assert.equal(PROTECTED_ADMIN_ID,'3');
  assert.equal(PROTECTED_ADMIN_USERNAME,'hanna_lr');
  assert.equal(isProtectedAdministrator({id:'3',username:'hanna_lr'}),true);
  assert.equal(isProtectedAdministrator({id:'3',username:'renamed'}),true);
  assert.equal(isProtectedAdministrator({id:'99',username:'hanna_lr'}),true);
});
test('icaro_pinheiro protegido por identificador estável e nome',()=>{
  assert.equal(PROTECTED_OWNER_ID,'1');
  assert.equal(PROTECTED_OWNER_USERNAME,'icaro_pinheiro');
  assert.equal(isProtectedAdministrator({id:'1',username:'icaro_pinheiro'}),true);
  assert.equal(isProtectedAdministrator({id:'1',username:'renamed'}),true);
  assert.equal(isProtectedAdministrator({id:'99',username:'icaro_pinheiro'}),true);
  assert.equal(isProtectedAdministrator({id:'4',username:'other'}),false);
  assert.match(protectedAdminMessage,/protegida/);
});
test('API protege ambos contra mudanças de perfil ou estado, inclusive concorrentes',()=>{
  assert.match(adminApi,/if\(isProtectedAdministrator\(\{id:String\(rows\[0\]\.id\),username:String\(rows\[0\]\.username\)\}\)\)return fail\(protectedAdminMessage,409\)/);
  assert.match(adminApi,/SET is_active=\$\{fields\.active\} WHERE id=\$\{userId\} AND role='user' AND id::text<>\$\{PROTECTED_ADMIN_ID\} AND username<>\$\{PROTECTED_ADMIN_USERNAME\} AND id::text<>\$\{PROTECTED_OWNER_ID\} AND username<>\$\{PROTECTED_OWNER_USERNAME\} RETURNING id/);
  assert.match(adminApi,/SET role=\$\{fields\.role\} WHERE id=\$\{userId\} AND id::text<>\$\{PROTECTED_ADMIN_ID\} AND username<>\$\{PROTECTED_ADMIN_USERNAME\} AND id::text<>\$\{PROTECTED_OWNER_ID\} AND username<>\$\{PROTECTED_OWNER_USERNAME\} RETURNING id/);
});
test('interface não oferece controles para ambas as contas protegidas',()=>{
  assert.match(adminUI,/isProtectedAdministrator\(u\)\?<span className="admin-protected-action"/);
  assert.match(adminUI,/isProtectedAdministrator\(u\)&&<span className="admin-protected-label"/);
  assert.match(adminUI,/As contas icaro_pinheiro e hanna_lr possuem administração protegida/);
});
