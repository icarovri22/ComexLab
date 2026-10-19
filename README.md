# ComexHub

## Versão 1.8.1 — ícone do site

Adicionado favicon para navegadores e resultados de pesquisa, além de ícone para atalhos da Apple, usando a identidade visual já aprovada. O Google e os navegadores podem atualizar o ícone conforme seus próprios caches e ciclos de rastreamento.

Plataforma educacional de Comércio Exterior (Next.js App Router).

## Versão 0.8 — recursos implementados no código

- Aba **Simuladores** com importação e exportação no mesmo fluxo (`/simuladores`).
- Seleção internacional de países e territórios (biblioteca `countries-list`).
- Onze regras Incoterms® 2020 e avisos de incompatibilidade modal.
- Custos logísticos e responsabilidades ilustrativas entre vendedor e comprador.
- Tributos como parâmetros informados pelo usuário, sem alíquotas inventadas.
- Trilha com 14 módulos de estudo, 42 questões de fixação, 14 casos resolvidos, glossários e progresso local.
- Consulta NCM dinâmica: busca por código e descrição usando tabela pública do Classif, com fallback à BrasilAPI, capítulos, fichas, hierarquia, vigência, favoritos, histórico local e links de validação fiscal no Buscador NCM.
- Tela de conta e API de login/cadastro por usuário/senha, sem confirmação por e-mail.
- Identidade visual em azul-marinho, azul médio e azul-claro, responsiva.
- Crédito no rodapé: Hanna Roncel e Ícaro Pinheiro.

**Aviso:** resultados fiscais são didáticos; não representam tratamento tributário ou administrativo definitivo. O HS é internacionalmente harmonizado até seis dígitos, e o NCM é uma nomenclatura brasileira de oito dígitos. Consulte regras de origem, tarifas, licenças e legislação do país de destino.

## Simulação entre países

- Origem e destino selecionáveis de forma independente, em todos os continentes (e territórios presentes na base ISO).
- Países agrupados em listas por continente, com filtros de continente e busca por nome/código.
- Troca de origem/destino, rotas demonstrativas (China → Estados Unidos, Alemanha → França e Japão → Austrália).
- Importação = perspectiva do comprador/importador; exportação = perspectiva do vendedor/exportador.
- Modelo tributário brasileiro **somente quando o destino é o Brasil**, independentemente da aba escolhida.
- Quando o destino não é Brasil, cálculo **genérico ilustrativo** com tarifa e IVA/VAT/GST informados pelo estudante.
- Aviso destacado sobre operações intracomunitárias da União Europeia, que não devem usar automaticamente o modelo tributário extracomunitário.
- Ao trocar os países, as alíquotas e checklist são zerados para evitar reutilização incorreta de tributação.
- Custos representados em USD por padrão. Conversão indicativa para BRL apenas quando o Brasil faz parte da rota.
- Confirmação de classificação fiscal, regras de origem, acordos, exigências legais e taxas **não automatizadas** é indispensável.

**Publicação:** a versão 0.8 parte do código de produção 0.6. A tela de cadastro da versão 0.7, com e-mail obrigatório, segue em ambiente de teste até a migração de e-mail receber autorização específica.

## Configuração

1. Instalar dependências: `npm install`.
2. Executar desenvolvimento: `npm run dev`.
3. Executar verificações de lógica: `npm run test:logic`.
4. Conectar a branch de produção do projeto Neon `sweet-wind-83497977` (já vinculada no ambiente publicado).
5. Configurar `DATABASE_URL`, `AUTH_SECRET` e `AUTH_REQUIRED=true` na Vercel (já configurados em produção).
6. Conferir a estrutura de autenticação existente antes de aplicar qualquer migração adicional.
7. Testar cadastro, login, logout, cookies, proteção de rotas e limites contra abuso periodicamente.

## Estado de publicação

A versão 0.6 foi preparada na Vercel, em `https://comexhub-app.vercel.app`, com status READY. As tabelas de autenticação (`comexlab_users` e `comexlab_login_attempts`) já existem na branch production do Neon. A autenticação exige validação contínua em navegador; não registrar credenciais em repositórios.

## Limitações conhecidas

- Não existe uma base global automatizada de tarifas por produto, país, data e preferência comercial; as taxas são preenchidas pelo estudante com base em fontes oficiais.
- O modelo de Incoterms para alocação de despesas não cobre todas as interpretações de locais nomeados, terminais e contratos reais.
- O modelo de cálculo tributário é simplificado e não contempla todos os regimes, exceções e encargos.
- Segurança de produção precisa de teste de integração, monitoramento de abuso, limites de cadastro e procedimento de recuperação de contas.

## Cadastro (v0.9)
A tela /login é exclusiva e permite criar conta com usuário, e-mail obrigatório e senha (sem confirmação por e-mail). Usuários existentes sem e-mail continuam acessando pelo nome de usuário. A validação de e-mail na interface não equivale à verificação de propriedade do endereço.

## Administração (versão 1.0)

- Painel de acesso restrito em `/admin`: indicadores, contas, conteúdo educacional e avisos gerais.
- A autorização é conferida no servidor contra a tabela `comexlab_users` a cada operação administrativa; somente `role='admin'` e conta ativa.
- O cadastro mantém `role='user'` (sem permissões elevadas). O administrador inicial precisa ser indicado explicitamente pelo responsável pelo ComexHub, com a identificação exata da conta, e atribuído pelo operador do Neon. **Nunca conceder role admin com base em nome ou e-mail declarado por usuário anônimo.**
- Contas existentes preservadas; senhas e hashes não aparecem no painel.
- Edição e publicação de textos, tópicos e exercício principal dos 14 módulos; conteúdos complementares originais preservados.
- Rascunhos não aparecem para estudantes; conteúdos publicados são obtidos de `/api/study-content` com fallback ao conteúdo original.
- Avisos globais editáveis via `/api/site`. Histórico de ações administrativas em `comexlab_admin_audit`.
- Ainda não há métricas de uso de simuladores nem progresso dos alunos no servidor, portanto o painel não apresenta esses indicadores.
- A remoção de acesso não é garantida instantaneamente para todo conteúdo público em sessões antigas; chamadas da API e abertura da área administrativa revalidam a conta. Rever política de revogação de sessões antes de implantação em organizações maiores.


## Atualização 1.2 — painel sem aplicativo autenticador

- O login administrativo utiliza nome de usuário ou e-mail e senha, sem desafio TOTP/segundo aplicativo.
- A API de administração mantém a checagem da role `admin`, da conta ativa e da versão de sessão diretamente no banco para cada solicitação.
- Tentativas incorretas de senha continuam limitadas por conta e IP; sessões administrativas continuam com validade mais curta.
- Códigos pessoais de recuperação de senha e invalidação de sessões após troca de senha permanecem disponíveis.
- Dados TOTP anteriormente gravados no Neon não foram excluídos; o fluxo não os solicita nem permite gerar novos códigos.
- **A retirada da segunda etapa reduz a resistência ao roubo de credenciais.** Usar uma senha forte e exclusiva para cada administrador.

## Correção 1.2.1 — carregamento da lista administrativa

- A navegação entre as seções do painel administrativo cancela requisições obsoletas e ignora resultados recebidos fora de ordem; os dados de uma seção não substituem os de outra.
- A aba Usuários verifica o formato da resposta antes de mostrar a tabela e oferece nova tentativa quando há falha.
- Nenhuma alteração foi feita nos usuários, senhas, papéis ou esquema do banco.

## Recuperação por e-mail (versão 1.3: aguardando provedor)

- Link canônico: `https://comexhub-app.vercel.app/redefinir?token=...`; a rota é pública mesmo com `AUTH_REQUIRED=true`.
- Token aleatório de 32 bytes, hash HMAC-SHA256 no Neon, expirando em 15 minutos e uso único.
- Abrir / visitar a página faz apenas validação; apenas enviar a nova senha consome o token.
- Senha redefinida revoga sessões por `session_version`; os demais tokens pendentes da conta são revogados.
- Solicitação de e-mail responde genericamente para não revelar quais contas existem e aplica limites por endereço e por IP.
- `GET /api/email-recovery` informa se o envio está disponível, sem expor credenciais. Sem `RESEND_API_KEY` e `EMAIL_FROM`, o envio fica desativado; o código pessoal continua disponível.
- Usar remetente em domínio verificado na Resend; o domínio gratuito `comexlab.vercel.app` não pode ser presumido verificável para envio.
- Usuários antigos sem e-mail podem vinculá-lo em Segurança da conta, confirmando a senha atual.
- Sem credenciais do provedor e verificação de domínio, **não há teste de entrega real** e o recurso não deve ser descrito como operacional.
- Aplicar `db/email-recovery-migration.sql` antes de habilitar o envio.

### ComexHub 1.4.0 — avaliações e sugestões

- Área `/avaliar`: nota de 1 a 5 estrelas e/ou sugestão de até 1.500 caracteres; usuários autenticados veem apenas os próprios envios e andamento (recebido/analisado).
- API `/api/feedback` privada por sessão, com verificação de origem e limite de 5 envios por 24 horas e intervalo mínimo de 1 minuto. Feedback vinculado à conta; não exige e-mail.
- Administração > Avaliações: nota média, totais, pendências, filtros e marcação como analisada; verificações de acesso exclusivamente no servidor com auditoria.
- Aviso da área `/seguranca`: no máximo uma vez por dia **por conta** (fuso `America/Fortaleza`), inclusive entre dispositivos. A data da exibição fica no Neon em `security_reminder_seen_on`; nenhum código é armazenado no aviso.
- Migração em `db/feedback-migration.sql`; aplique antes de publicar esta versão. Mantém o atual sistema de recuperação, com envio de e-mail desativado até configuração do provedor.

## 1.4.1 — clareza na aba Avaliações
- Quando não há mensagens cadastradas, o painel informa explicitamente que nenhuma foi enviada e oferece um link direto para o formulário de avaliação.
- Quando um filtro estiver vazio, diferencia essa situação da ausência geral de avaliações e permite retornar a Todas.
- Inclui recarregamento manual quando o painel não recebe dados, sem modificar contas ou avaliações.

## 1.4.2 — correção de exceção ao mudar de aba na administração
- Correção da causa de `Application error: a client-side exception has occurred`: o React renderizava uma aba usando a resposta da aba anterior antes que `useEffect` apagasse os dados antigos. A aba Avaliações tentava acessar `data.metrics.total` enquanto `data` ainda era o payload de Visão Geral, lançando `TypeError`.
- Agora as respostas da API são vinculadas à aba de origem; o React só renderiza dados cuja aba coincida com a seleção atual. O mesmo bloqueio protege outras transições, como Avaliações → Visão geral.
- Testes de regressão simulam navegações em ambos sentidos e respostas vazias.
- Boundary de erro exclusivo da área administrativa oferece recuperação amigável caso ocorra outro problema futuro.
- Nenhuma migração de banco, conta ou avaliação é modificada.


## 1.5 · Terracotta Modern

Apenas identidade visual: páginas iniciais, login, simuladores, estudos, NCM, segurança, avaliações e administração.
Cores: marrom profundo `#38241F`, terracota `#A34F37`, coral suave `#DB8265`, areia `#F2C8AA`, creme `#FFF7EF`, cards brancos.
Nenhuma alteração nas APIs, no banco Neon, nos usuários ou nas permissões.


## Versão 1.6.0 — Relatório e impressão de simulação

- Nova etapa 06 na página `/simuladores` com botão `Gerar relatório`.
- Prévia contém dados da rota e mercadoria, Incoterm, custos em USD, tributos informados, repartição ilustrativa, checklist, alertas e referências.
- Botão `Imprimir / Salvar em PDF` abre a janela de impressão nativa do navegador (A4).
- Impressão não exige nenhuma chave de serviço externo e o relatório permanece no navegador do usuário, sem gravar dados de simulação no servidor.
- Se a simulação for editada após gerar a prévia, a impressão é desabilitada até clicar em `Atualizar relatório`.
- Cálculos incompletos são marcados `Pendente`, nunca assumidos como alíquota 0.

Importante: o relatório é exclusivamente educacional e não equivale à documentação fiscal oficial.


## Versão 1.7 — Comex News
- `/noticias`: filtro por país, categoria e busca; exibe notícias oficiais e explicação educacional dos possíveis impactos.
- `app/api/news/route.ts`: API autenticada para listar notícias publicadas.
- `app/api/news/sync/route.ts`: importação de feeds MDIC, OMC e Comissão Europeia, protegida por segredo do agendador ou sessão de administrador.
- Administração → Notícias: revisão, ocultação, destaque, fontes, publicação manual e histórico de sincronizações.
- `vercel.json`: agenda diária às 10:12 UTC (07:12 horário de Fortaleza).
- `db/news-migration.sql`: tabelas de notícia, fonte e histórico sem alterar contas.
- Limitações: conteúdo automático utiliza a língua e os títulos oficiais da fonte; análise educacional é categorial e não confirmação fiscal; se um feed falhar, o erro aparece em Administração → Notícias.


## Comex News em português (1.7.1)
- Notícias oficiais estrangeiras: título e resumo traduzidos e armazenados separadamente.
- Publicação apenas quando título e resumo em português estiverem prontos; link da fonte original sempre preservado.
- O histórico de 35 notícias estrangeiras recebeu tradução editorial; fontes do MDIC preservam o português original.
- Para notícias novas, tradução automática via API MyMemory, com orçamento diário de caracteres e espera em caso de indisponibilidade.
- Administradores podem revisar ou corrigir a versão em português.
- O texto original é mantido para auditoria e verificação.

## Versão 1.8.0 — Simulação guiada

- Seis etapas progressivas: Rota, Condições, Custos, Tributos, Conferência e Resultado.
- Navegação livre entre etapas com barra de progresso e dados preservados durante a navegação.
- Painel lateral de custos ilustrativos permanece visível durante a simulação.
- Resultado com relatório completo e opção de impressão / PDF no final.
- Layout responsivo com etapas reorganizadas no celular.

## Versão 1.8.2 — unidades identificadas

- Campos monetários identificados por **US$**, tributos percentuais por **%**, quantidade por **un.** e câmbio por **R$/US$**.
- Legendas nas etapas Rota, Custos e Tributos explicam o preenchimento. Não há alteração nas fórmulas ou nos valores simulados.


## Versão 1.8.3 — seletor simplificado de países

- Etapa Rota: entrada única pesquisável por nome português ou sigla ISO, com bandeiras e sugestões (todos os países e territórios da base atual).
- Seleção por clique ou teclado (setas, Enter, Esc); texto de busca não altera a rota até confirmar uma opção.
- Inversão da rota e exemplos rápidos preservados; exemplos exibidos apenas quando solicitados.
- Alíquotas e checklist continuam sendo limpos ao efetivamente trocar os países, para não reaproveitar valores fiscais indevidamente.
- Nenhuma mudança nas fórmulas de cálculo ou demais etapas da simulação.

## Versão 1.8.4 — proteção de administradora

- Conta `hanna_lr` (ID de produção `3`) protegida contra revogação do perfil e bloqueio pelo painel administrativo.
- Verificação da regra no servidor (inclusive quando uma requisição é enviada diretamente à API), com predicados adicionais no UPDATE para evitar alterações concorrentes.
- Administradora protegida identificada visualmente e sem botões de alteração de perfil ou bloqueio.
- O proprietário do banco mantém a capacidade de administrar a conta diretamente pelo Neon se necessário.


## Versão 1.8.5 — dois administradores protegidos

- Mantida a proteção existente para `hanna_lr` (ID 3).
- Acrescentada proteção para `icaro_pinheiro` (ID 1), administrador ativo da plataforma.
- Ambas as contas estão protegidas contra revogação do perfil e bloqueio no painel e na API administrativa.
- Os predicados de atualização no banco foram ampliados para prevenir alterações concorrentes.
- A administração direta pelo proprietário da infraestrutura continua possível.


## ComexHub IA — versão 1.8.6

- Página `/ia`: assistente de estudos em português, histórico de até 25 respostas e avaliação positiva/negativa.
- API `/api/ia`: autenticação verificada, validação de origem, quota diária por usuário no banco e respostas do modelo pelo servidor.
- Admin `/admin` → aba **ComexHub IA**: indicadores agregados de qualidade/uso, ativação e limite de 1–30 perguntas diárias.
- **Pré-requisitos:** aplicar `db/ai-migration.sql` ao banco de produção e configurar a variável secreta `OPENAI_API_KEY` na Vercel; opcionalmente `OPENAI_MODEL` (padrão `gpt-6-luna`).
- Sem chave de API, a interface exibe claramente “aguardando ativação” e não gera respostas simuladas.
- O contador renova às 00:00 UTC; a quota é atômica por data/usuário. Nenhum segredo é enviado ao navegador.
- Os dados das conversas são visíveis somente ao usuário da conta; o painel administrativo expõe apenas estatísticas agregadas. Não compartilhe informações sensíveis no chat.
- As respostas são educacionais: NCM, legislação, tarifas e tributos exigem consulta às fontes oficiais atualizadas.
- Para testar: `npm run test:ai && npm run test:logic`.

## 1.8.7 — ComexHub IA temporariamente oculta

- Removidos os acessos à ComexHub IA dos menus principal e administrativo.
- A URL `/ia` mostra aviso de manutenção e não permite enviar perguntas.
- A API `/api/ia` responde com HTTP 503 enquanto a integração está sob manutenção.
- Dados, relatórios, configurações e credenciais existentes foram preservados para reativação futura.


## 1.8.8 — Identidade minimalista e tema escuro automático

- Logo CL (opção B) em SVG na barra lateral e acesso; ícones de navegador e aplicativo atualizados.
- Modo Claro / Escuro / Sistema, com detecção da preferência do dispositivo e armazenamento local.
- Cores tematizadas nas páginas principais e auxiliares. Tipografia original preservada, incluindo Arial, Helvetica e fontes já utilizadas.
- ComexHub IA continua suspensa conforme versão 1.8.7.


## 1.8.9 — Identidade visual fiel à logo aprovada
Substituição das imagens do menu e tela de login pelo arquivo original aprovado em 10/10/2026. Favicon e ícones derivados do mesmo monograma; versões claras e escuras. Família tipográfica não alterada. ComexHub IA permanece em manutenção.


## ComexHub 1.9.0 — mudança de identidade visual e nome
Nome comercial, títulos, e-mails, logo CH, favicon, ícones Apple e manifest PWA atualizados. A rota de domínio anterior continua disponível; identificadores internos comexlab_* de dados, cookies e preferências foram preservados para compatibilidade. IA segue suspensa.


## 1.9.1 — Novo símbolo globo e subtítulo
- Novo globo minimalista em vetor, sem artefatos de fundo.
- Favicon e ícones de instalação centralizados.
- Marca ComexHub com o subtítulo “Seu hub de aprendizados em comércio exterior”.
- Mantidas as fontes existentes, preferências claro/escuro e suspensão da ComexHub IA.

## ComexHub 1.9.2 — identidade e relatórios

- Removida a referência visual remanescente à marca antiga no relatório de simulação. A interface do usuário utiliza ComexHub.
- Botões independentes **Imprimir** (diálogo do navegador) e **Baixar PDF** (arquivo PDF pesquisável, formato A4, gerado localmente com jsPDF).
- A impressão preserva a folha estilizada do navegador; a exportação direta inclui resumo, impostos/custos, alertas, fontes e checklist.
- Cookies, chaves legadas de `localStorage` e tabelas `comexlab_*` foram mantidos por compatibilidade com contas e dados existentes; não são nomes comerciais visíveis.
- Mantidos tema claro/escuro, fontes atuais, contas e pausa da IA.

## 1.9.4 — Rascunhos e histórico de simulações

- Os campos do simulador são restaurados automaticamente ao retornar à aba, com chave individual por usuário autenticado.
- Cada relatório gerado é registrado no histórico (até 30 entradas), com visualização, impressão, download PDF e exclusão individual.
- Armazenamento **local no navegador** (`localStorage`), não sincronizado entre navegadores/dispositivos e removido se os dados locais forem apagados. Não substitui armazenamento seguro em servidor.
- Telas de login, senhas e dados administrativos não são guardados em rascunho local por segurança. Futuro suporte multiplataforma requer uma tabela autenticada no Neon e endpoints protegidos.
