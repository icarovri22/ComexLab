import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=(file)=>readFileSync(new URL(file,root),'utf8');
test('menu lateral não exibe ComexHub IA',()=>{assert.doesNotMatch(read('components/AppShell.tsx'),/href:\s*['"]\/ia['"]/)});
test('painel administrativo não exibe aba IA',()=>{assert.doesNotMatch(read('app/admin/AdminConsole.tsx'),/\['ai','ComexHub IA'/)});
test('acesso direto exibe manutenção, sem chat',()=>{const page=read('app/ia/page.tsx');assert.match(page,/em manutenção/);assert.doesNotMatch(page,/fetch\(['"]\/api\/ia/)});
test('rotas GET e POST da IA ficam bloqueadas enquanto em manutenção',()=>{const route=read('app/api/ia/route.ts');assert.match(route,/AI_UNDER_MAINTENANCE/);assert.equal((route.match(/if\(AI_UNDER_MAINTENANCE\)return fail\(/g)||[]).length,2)});
