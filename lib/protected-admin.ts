/**
 * Contas administrativas protegidas contra revogação de perfil ou bloqueio
 * realizados pelo painel e pela API de gerenciamento de usuários.
 *
 * ID estável e username são verificados para reduzir o risco de contornar
 * a proteção com uma alteração externa de nome de usuário.
 * O proprietário da infraestrutura continua podendo gerenciar o banco.
 */
export const PROTECTED_ADMIN_ID='3';
export const PROTECTED_ADMIN_USERNAME='hanna_lr';
export const PROTECTED_OWNER_ID='1';
export const PROTECTED_OWNER_USERNAME='icaro_pinheiro';

export function isProtectedAdministrator(account:{id:string;username:string}):boolean{
  return account.id===PROTECTED_ADMIN_ID||account.username===PROTECTED_ADMIN_USERNAME
    ||account.id===PROTECTED_OWNER_ID||account.username===PROTECTED_OWNER_USERNAME;
}

export const protectedAdminMessage='Esta conta possui administração protegida e não pode ter o perfil alterado ou ser bloqueada pelo painel.';
