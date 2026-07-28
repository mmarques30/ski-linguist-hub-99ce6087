# Auditoria Técnica e Plano Estrutural de Refatoração — Projeto FLI

> **Referência de origem:** `Guia Business - Projeto FLI` (Jan/2026).
> **Status deste documento:** o Guia descrevia um MVP a ser construído. Esta auditoria (Jul/2026) mostra que o produto **evoluiu muito além do MVP original** (financeiro completo, Qualiopi, satisfação, melhoria contínua, parceiros, avaliações orais), mas o **fluxo central do negócio — inscrição → teste → alocação de turma → documentos → comunicação automática — nunca foi fechado ponta a ponta**. O app cresceu em largura (muitos módulos) antes de fechar em profundidade (o fluxo core 100% automatizado que o Guia pedia como prioridade).
>
> Este documento (1) expõe as pendências e riscos mais graves primeiro, (2) avalia módulo a módulo o que existe de fato, (3) propõe um plano de integração entre funções/automações, e (4) organiza tudo em um plano estrutural de refatoração em fases.

---

## Sumário executivo

| Dimensão | Situação |
|---|---|
| **Stack** | React 18 + TypeScript + Vite + shadcn/ui + TanStack Query + Supabase (Postgres/Auth/Storage/Edge Functions/pg_cron), ~38.500 linhas em `src/`, 31 migrations, 4 Edge Functions |
| **Cobertura funcional** | Muito além do MVP do Guia: Finanças (6 telas), Comercial/CRM, Parceiros, Faturas, Inscrições, Alunos, Sessões, Formadores, Avaliações orais, Qualiopi, Satisfação, Melhoria Contínua, Portal do Aluno |
| **Maturidade de segurança (RLS)** | **Crítica.** Função `is_staff()` trata qualquer usuário autenticado não-aluno como "staff" com acesso amplo; várias tabelas com policies `USING (true)` públicas (surveys, testes, contratos de formador, storage de documentos) |
| **Fluxo core do negócio (inscrição→turma→docs→e-mail)** | **Não fechado.** Formulário público não grava nada no banco; teste de nivelamento é mockado; alocação de turma é manual; não há geração automática de carta/contrato/orçamento; nenhum e-mail transacional do funil pedagógico é enviado |
| **Automação/Edge Functions** | 2 cron jobs financeiros funcionam mas estão **publicamente invocáveis sem autenticação**; 1 function de lembrete de pesquisa está órfã (sem agendamento); nenhuma automação cobre os gatilhos pedidos pelo Guia (confirmação, convocação J-7, lembrete J-1, dossiê) |
| **Qualidade/consistência de dados** | Vários cálculos financeiros enganosos (ex.: gráfico "despesas" usa receita do ano anterior), fatura marcada como paga não gera registro de pagamento, nomenclatura de idiomas/status inconsistente entre módulos |
| **Módulos "extra" (Qualiopi, satisfação, melhoria contínua)** | Bem construídos como CRUD, mas com gaps de conformidade (indicadores Qualiopi não pré-carregados) e de automação (envio de pesquisa não é automático) |

**Conclusão em uma frase:** a base tecnológica é sólida e o time já entregou muito mais telas do que o Guia original previa, mas o produto ainda não é "ótimo e integrado" porque (1) há brechas de segurança que precisam de correção imediata, e (2) o fio condutor do negócio — do lead ao aluno formado e documentado — está fragmentado em ilhas manuais que não conversam automaticamente entre si.

---

## 1. Pendências e riscos evidentes (ler primeiro)

Organizados por severidade. Cada item traz o módulo afetado e a referência técnica encontrada na auditoria.

### 1.1 Crítico — corrigir antes de qualquer nova funcionalidade

| # | Risco | Onde | Impacto |
|---|---|---|---|
| C1 | **`is_staff()`** (função RLS) considera "staff" qualquer usuário autenticado que não seja `student` — inclusive contas sem role atribuída ou role `user` recém-criada. Isso dá acesso de leitura/escrita a dados de alunos, financeiro e parceiros para qualquer conta autenticada não intencionalmente restrita. | `supabase/migrations/20260412114223_*.sql` | Vazamento de dados pessoais e financeiros; viola LGPD/RGPD |
| C2 | **Bucket de Storage `documents` é público**, com upload e leitura sem autenticação (`USING (true)` para `anon`). Documentos de identidade, fotos e contratos ficam acessíveis a quem tiver/adivinhar a URL. | `supabase/migrations/20260109105623_*.sql` | Exposição de documentos de identidade de alunos e formadores |
| C3 | **`satisfaction_surveys`** tem SELECT e UPDATE públicos sem exigir o token da pesquisa — qualquer pessoa pode ler ou alterar respostas de qualquer aluno. | `supabase/migrations/20260406110728_*.sql` | Integridade dos dados de satisfação (usados no Qualiopi) comprometida |
| C4 | **`instructor_contracts`**: SELECT e UPDATE públicos sem validar `signature_token` — assinatura de contrato de formador pode ser falsificada. | `supabase/migrations/20260412114223_*.sql` | Risco jurídico/contratual |
| C5 | **`placement_tests`** com SELECT/INSERT/UPDATE públicos sem filtro — qualquer um pode ler ou manipular resultados de testes de nivelamento. | `supabase/migrations/20260412114223_*.sql` | Nível do aluno pode ser adulterado |
| C6 | **Edge Functions `generate-monthly-charges` e `process-invoice-reminders` são publicamente invocáveis** (`verify_jwt = false` no `config.toml` e nenhuma checagem de autenticação no código). Qualquer pessoa com a URL pode gerar/sobrescrever custos fixos do mês ou disparar e-mails de cobrança para alunos. | `supabase/config.toml`, `supabase/functions/generate-monthly-charges/index.ts`, `supabase/functions/process-invoice-reminders/index.ts` | Abuso financeiro, spam de cobrança, dano à reputação com alunos |
| C7 | **Formulário público de inscrição (`/register`) não persiste nada** — o botão final só faz `console.log` e mostra uma tela de "sucesso" com um ID gerado localmente (`Date.now().toString(36)`), prometendo um e-mail que nunca é enviado. | `src/components/registration/ConfirmationStep.tsx` | O canal de entrada principal de novos alunos está, na prática, **desligado do banco de dados** — qualquer lead capturado hoje por esse formulário é perdido |

### 1.2 Alto — bloqueiam o "fluxo ótimo" pedido, sem serem falhas de segurança imediatas

| # | Risco/pendência | Onde | Impacto |
|---|---|---|---|
| A1 | Nenhuma automação de comunicação do funil pedagógico existe: confirmação de inscrição, envio de documentos, convocação (J-7), lembrete (J-1), dossiê pós-curso. Templates já existem no banco (`email_templates`) e nunca são usados. | Ausente em `src/` e em `supabase/functions/` | O Guia listava isso como a "Entrega 10" prioritária; hoje é 0% automatizado |
| A2 | Geração automática de carta, contrato e orçamento (Entrega 8 do Guia) **não existe**. A aba "Documentos" da inscrição está hardcoded vazia. | `src/pages/inscriptions/InscriptionDetails.tsx`, `src/pages/Documents.tsx` | Trabalho manual continua 100% no Word/Drive, contrariando o objetivo do projeto |
| A3 | Teste de posicionamento real (20 questões, progressão A1→C1, regra 0-10=MANHÃ/11-20=TARDE) não existe. O que há é (i) um quiz mockado de 5 perguntas no formulário público, e (ii) um sistema de avaliação oral manual pelo formador, sem relação com a tabela `placement_test_questions` já modelada no banco. | `src/components/registration/PlacementTestStep.tsx`, `src/pages/PlacementTests.tsx` | Alocação por nível/turno não pode ser automatizada sem essa peça |
| A4 | Alocação de turma é 100% manual; não há verificação de mínimo 3 / máximo 16 alunos, e o campo `max_students` tem default **1** no formulário de sessão. Há ainda dois conceitos concorrentes — `Classes` (tela legada, sem dados) e `Sessions` (real, mas é "aula pontual", não "turma sazonal"). | `src/pages/Classes.tsx`, `src/pages/Sessions.tsx`, `src/hooks/useSessions.ts` | Risco de turmas inviáveis (poucos alunos) ou superlotadas |
| A5 | CRM comercial não modela os 3 canais de expansão do Guia (CPF, B2B/Alpespace, Parceria DSF) — é um CRM genérico de leads com fontes (`site_web`, `esf`, `bouche_a_oreille`, `salon`, `autre`) sem workflows específicos por canal. | `src/hooks/useLeads.ts` | Prioridade nº1 do Guia ("Entrega 4") está parcialmente atendida, mas sem a segmentação estratégica pedida |
| A6 | Painel financeiro tem cálculos enganosos: o gráfico "Recettes vs Dépenses" usa receita do ano anterior como se fosse despesa; marcar uma fatura como paga não cria um registro em `payments` (então "Encaissé" e status da fatura divergem); criar um pagamento não exige vínculo com fatura. | `src/pages/finance/FinanceDashboard.tsx`, `src/pages/Invoices.tsx`, `src/pages/finance/FinancePayments.tsx` | Decisões financeiras podem ser tomadas com números errados — risco direto para a Entrega 3 (prioridade nº1 do Guia) |
| A7 | Não existe relatório trimestral em PDF para a contadora (só há projeções na tela e export CSV parcial) nem scanner/OCR de recibos — ambos pedidos explicitamente no Guia. | `src/pages/finance/*` | Trabalho contábil trimestral continua manual |
| A8 | Não existe "interface do professor" com role e RLS próprios (Entrega 9 do Guia). O que existe é uma área de avaliação de testes orais operada por qualquer conta staff/admin; a tabela `instructors` não tem vínculo com `auth.users`. | `src/pages/formateur/*`, enum `app_role` (`admin/user/student`, sem `formateur`) | Formador não tem login próprio nem visão restrita às suas turmas |
| A9 | Permissões de UI (`user_permissions`, `route-permissions.ts`) controlam o que aparece no menu e nos botões, mas **não são aplicadas nas rotas nem no RLS** — um usuário sem permissão para "Finanças" ainda consegue acessar a URL e os dados via `is_staff()`. | `src/components/auth/ProtectedRoute.tsx` | Sistema de níveis de acesso (Pós-MVP do Guia) é hoje só cosmético |
| A10 | `process-survey-reminders` não está agendada em nenhum `cron.schedule` — código morto operacionalmente; e o "End Pack" (fim de curso) cria a pesquisa de satisfação mas **não envia e-mail**, apesar da UI dizer "envio automático". | `supabase/functions/process-survey-reminders/`, `src/hooks/useEndPack.ts` | Pesquisas de satisfação Qualiopi não chegam ao aluno sem ação manual |

### 1.3 Médio — dívida técnica que deve entrar no plano, mas não bloqueia o dia a dia

- Nomenclatura de idiomas e status inconsistente entre módulos (ex.: `english` no registro vs `Anglais`/`Portugais brésilien` no admin vs outro conjunto em Sessions) — quebra matching automático entre inscrição e turma.
- Máquina de estados de inscrição (`lib/inscription-status.ts`) está definida mas **não é usada** em nenhuma tela — o dropdown de status atual permite qualquer transição.
- Duas telas de formulário de sessão praticamente duplicadas (`formateurs/SessionFormDialog` vs `sessions/SessionFormDialog`).
- `useRemoveEnrollment` sempre zera `current_students` em vez de decrementar — bug de contagem de vagas.
- Índices perdidos após o `DROP CASCADE` de `20260114131558` (ex.: `inscriptions.student_id`, `status`, `season_id`; `payments.invoice_id`) — risco de degradação de performance conforme o volume cresce.
- Geração de códigos sequenciais (inscrição, fatura, contrato) via `MAX()+1` sem lock — risco de colisão sob concorrência.
- Tabelas `funding_requests`/`funding_documents` existem no banco (aparecem nos types gerados) mas não têm `CREATE TABLE` versionado em nenhuma migration — *drift* entre banco vivo e repositório.
- `email_templates`, `email_log`, `scheduled_reminders` são um esqueleto pronto no banco, mas **nenhuma tela ou function os utiliza** — investimento de schema não capitalizado.
- i18n (`fr`/`pt-BR`/`en`) implementado de forma parcial — módulos inteiros (Formadores, Avaliações, Qualiopi, Melhoria Contínua, tela de login) estão hardcoded em um único idioma, às vezes diferente do resto do app.
- Enum de melhoria contínua no frontend usa `ABANDONNE`, que não existe no `CHECK` do banco (só `EN_COURS`/`A_SURVEILLER`/`TERMINE`) — grava e pode falhar silenciosamente conforme o caso.
- Uso disseminado de `any` em hooks e páginas (financeiro, sessões, parceiros, comercial), reduzindo o valor da tipagem gerada do Supabase.

### 1.4 Baixo — qualidade/consistência, sem urgência

- Chave anônima do Supabase publicada em claro no `docs/TESTING_GUIDE.md` (é uma chave pública por design, mas deveria ser referenciada via variável de ambiente/placeholder, não colada em texto).
- Botões "Exportar CSV", "Editar", "Enviar fatura por e-mail" sem `handler` em algumas telas (ex.: `InscriptionDetails`).
- `Settings.tsx` tem switches de notificação e integração Stripe/Resend que são só UI (`TODO: Persist settings`).
- Duplicação de `formatPrice`/`Intl.NumberFormat` em dezenas de arquivos em vez de um utilitário central.

---

## 2. Visão geral da arquitetura atual

```
┌───────────────────────────────────────────────────────────────────────────┐
│  FRONTEND — React 18 + TS + Vite + shadcn/ui + TanStack Query             │
│  ├─ Rotas públicas: /auth, /register (não persiste!), /survey/:token      │
│  ├─ Rotas staff (ProtectedRoute, sem checagem de permissão real):         │
│  │    Dashboard · Finanças(6) · Comercial · Parceiros · Inscrições ·      │
│  │    Faturas · Alunos · Testes · Turmas · Sessões · Documentos ·         │
│  │    Formadores · Avaliações · Qualiopi · Satisfação · Melhoria ·        │
│  │    Admin (Usuários, Temporadas, Import, Frases)                       │
│  └─ Rotas aluno (StudentProtectedRoute): Dashboard, Test(sem player),     │
│       Planning, Documents, Evaluation                                    │
├───────────────────────────────────────────────────────────────────────────┤
│  SUPABASE                                                                  │
│  ├─ Postgres: 49 tabelas, RLS parcialmente endurecida (2 refactors),      │
│  │    triggers de código sequencial, audit_log, pg_cron                  │
│  ├─ Auth: 3 roles (admin/user/student) — sem role "formateur"            │
│  ├─ Storage: bucket "documents" PÚBLICO                                  │
│  └─ Edge Functions (Deno): create-user, generate-monthly-charges,        │
│       process-invoice-reminders, process-survey-reminders (só 2 têm cron)│
└───────────────────────────────────────────────────────────────────────────┘
```

**Leitura arquitetural:** não há camada de orquestração entre módulos. Cada tela fala diretamente com o Supabase via hooks próprios; não existe um "motor de automação" central (fila de eventos, webhooks internos, state machine executada no servidor) que conecte, por exemplo, "inscrição confirmada" → "gerar documentos" → "enviar e-mail" → "agendar lembrete". Isso é a causa raiz de o fluxo core estar fragmentado: cada pedaço foi construído como uma ilha CRUD.

---

## 3. Avaliação por módulo

Legenda de maturidade: 🟢 Sólido · 🟡 Parcial/funcional com gaps · 🔴 Ausente ou não confiável

| Módulo | Maturidade | Resumo |
|---|:---:|---|
| Financeiro (dashboard, análises, rentabilidade, tesouraria, pagamentos, charges fixas) | 🟡 | Telas ricas e ligadas ao Supabase; cálculos com inconsistências e sem PDF trimestral/OCR |
| Faturas | 🟡 | CRUD completo + CSV, mas sem PDF de download real e sem sincronização automática com pagamentos |
| Comercial/CRM | 🟡 | Kanban de leads funcional, mas não modela os 3 canais do Guia |
| Parceiros | 🟢 | CRUD sólido de ESF/hotéis/parceiros, com contatos e contratos |
| Inscrições (admin) | 🟡 | CRUD real, mas desconectado do formulário público e da máquina de estados |
| Formulário público de inscrição | 🔴 | Não persiste nada; teste mockado; "sucesso" fake |
| Testes de posicionamento | 🔴 | Schema pronto, sem UI real (nem para o admin, nem para o aluno responder) |
| Turmas/Alocação | 🔴 | 100% manual; sem regra de mínimo/máximo; dois modelos concorrentes (Classes/Sessions) |
| Sessões (calendário de aula) | 🟢 | Funcional para agendar aulas e matricular alunos manualmente |
| Alunos | 🟢 | CRUD completo, boa visão de detalhes |
| Portal do aluno | 🟡 | Telas de leitura funcionam; falta o "fazer o teste" e recebimento de docs |
| Documentos (geração automática) | 🔴 | Aba de documentos da inscrição vazia; nenhuma geração de carta/contrato/orçamento |
| Formadores (CRUD/RH) | 🟢 | Cadastro, planning, pagamentos funcionais |
| Interface do professor (portal próprio) | 🔴 | Inexistente — sem role, sem RLS, sem login dedicado |
| Avaliações orais (compte-rendu) | 🟢 | Fluxo maduro: frases pré-configuradas, pontuação, preview e impressão |
| Qualiopi (auditoria) | 🟡 | Checklist + CRUD de indicadores, mas sem os indicadores oficiais pré-carregados; relatório é impressão de tela |
| Satisfação | 🟡 | Resposta pública + estatísticas + PDF funcionam; envio automático incompleto; RLS aberta |
| Melhoria contínua | 🟢 | CRUD sólido (com um bug de enum a corrigir) |
| Automação de comunicação (e-mails) | 🔴 | Só existem e-mails de cobrança e lembrete de pesquisa; nada do funil pedagógico |
| Edge Functions / cron | 🟡 | Funcionam, mas publicamente invocáveis sem autenticação |
| Autenticação / permissões | 🟡 | Bom modelo de UI; enforcement real fraco no backend |
| i18n (fr/pt-BR/en) | 🟡 | Implementado, mas cobertura parcial e inconsistente |

### 3.1 Financeiro

**O que existe:** Dashboard com KPIs (CA, encaissé, a pagar a formadores, margem), Análises com projeção e exportação CSV, Rentabilidade por formação, Tesouraria previsional de 6 meses, Pagamentos, Charges fixas com templates recorrentes e geração mensal automática (`generate-monthly-charges`). Tudo consumindo dados reais do Supabase, com realtime parcial via `useFinancialRealtime`.

**O que falta para ser "ótimo":**
1. Corrigir o gráfico "Recettes vs Dépenses" (hoje usa CA do ano anterior como despesa).
2. Ligar "marcar fatura como paga" à criação automática de um registro em `payments`, e exigir `invoice_id` ao criar um pagamento manual.
3. Relatório trimestral estruturado (PDF) com o formato que a contadora pede, incluindo exportação FEC/contábil.
4. Upload + OCR de recibos (`formation_costs.document_url` já existe no schema, mas está sempre nulo).
5. Trilha de auditoria (quem alterou valor de fatura/pagamento/custo e quando) — hoje só existe `audit_log` para Qualiopi.
6. Unificar a lógica de "formador a pagar" (hoje há duas fontes de verdade divergentes: `instructor_payments` na tesouraria vs `formation_costs − payments` no dashboard).

### 3.2 Comercial / CRM de canais de expansão

**O que existe:** CRM de leads com pipeline Kanban (novo → contatado → negociação → convertido/perdido), KPIs de conversão, analytics por fonte, campos de próxima ação.

**Gap central:** o Guia pede 3 canais **diferenciados** com campos próprios: CPF (valor CPF disponível, curso de interesse), B2B/Alpespace (empresa, setor, valor potencial), DSF/Federação (volume previsto, próxima reunião). Hoje existe um único pipeline genérico. Para "ser ótimo e integrado":
1. Modelar `channel` como campo estruturado (`cpf` | `b2b` | `dsf` | `outro`) com formulário condicional por canal.
2. Ligar `leads.inscription_id` de fato (campo já existe, não é usado) para fechar o funil lead→matrícula.
3. Automatizar alertas de "próxima ação vencida" (hoje é só visual, sem notificação).
4. Trazer o campo `loss_reason` (já existe no banco) para o formulário de perda.

### 3.3 Inscrições, testes, alocação de turmas, documentos (o núcleo do Guia)

Este é o conjunto de módulos mais crítico porque é o que o Guia definiu como "Fase 3" e é o coração do modelo de negócio (captar aluno → testar → alocar → documentar → cobrar → formar → certificar). A auditoria mostra que **cada etapa foi construída isoladamente**, sem o encadeamento automático que dá valor ao sistema:

1. **Captação:** formulário público existe visualmente (6 passos, bonito, com i18n parcial) mas é decorativo — não grava em `students`/`inscriptions`, não gera código real, não dispara e-mail.
2. **Teste:** existe uma tabela de banco pronta e bem modelada (`placement_test_questions`, `placement_tests`) com suporte a idioma/nível/categoria, mas **nenhuma tela usa esse banco** — nem para o admin cadastrar as 20 perguntas por idioma, nem para o aluno responder.
3. **Alocação:** é manual, dentro da tela de Sessões, sem qualquer verificação de regra de negócio (mínimo 3, máximo 16, por estação+idioma+nível).
4. **Documentos:** não há geração de carta/contrato/orçamento; a tabela `document_sendings` foi modelada para isso e está vazia de uso.
5. **Cobrança/Certificação (fim de curso):** o "End Pack" fecha o ciclo criando fatura, certificado e pesquisa de satisfação — essa parte funciona bem, mas termina sem envio de e-mail.

**Conclusão prática:** hoje, para um aluno passar por todo o ciclo, uma pessoa da equipe precisa operar manualmente cada etapa em telas separadas, copiando dados de um lugar para o outro fora do sistema (Word/Drive) — exatamente o problema que o projeto nasceu para resolver.

### 3.4 Formadores e "interface do professor"

O CRUD de formadores (RH, tarifas, disponibilidade, pagamentos) é sólido. Porém a "Entrega 9" do Guia — professor loga, vê só as turmas dele, marca presença, lança nível final e dispara relatório — **não existe**: não há role `formateur` no enum de autenticação, a tabela `instructors` não tem vínculo com `auth.users`, e a área `/formateur/*` de hoje é na verdade avaliação de testes orais operada por qualquer conta staff.

### 3.5 Qualiopi, Satisfação e Melhoria Contínua (módulos além do MVP original)

Esses três módulos não estavam no Guia original — foram adicionados depois, provavelmente por exigência de certificação Qualiopi (obrigatória para organismos de formação na França acessarem financiamento). Avaliação:
- **Melhoria contínua:** o mais maduro dos três — CRUD completo, com um bug pontual de enum a corrigir.
- **Satisfação:** resposta pública e estatísticas funcionam bem e já geram PDF para auditoria; falha no "último metro" — o envio automático do link ao aluno.
- **Qualiopi:** a estrutura (7 critérios, indicadores, KPIs automáticos) existe, mas começa vazia — falta popular com os indicadores oficiais do referencial e transformar o "relatório" de impressão de tela em um documento estruturado exportável.

### 3.6 Autenticação, permissões e i18n

O modelo de permissões por usuário (`user_permissions` + `route-permissions.ts`) é uma boa ideia de produto (mais granular que roles fixas), mas hoje só filtra o que aparece na sidebar — não impede acesso direto por URL nem é refletido no RLS do banco. Isso significa que o "sistema de níveis de acesso" (Pós-MVP do Guia) está inacabado onde mais importa: o controle real de dados.

A internacionalização (fr/pt-BR/en) já avançou além do que o Guia pedia ("tradução francês" era item "Futuro"), mas de forma desigual — vale consolidar antes de expandir para mais idiomas.

---

## 4. Guia de Negócio × Estado Real (mapa de rastreabilidade)

| Entrega do Guia | Status real | Observação |
|---|:---:|---|
| MVP: Gestão financeira básica | 🟡 Muito além do MVP, com bugs de cálculo | Ver §3.1 |
| MVP: Gestão de canais de expansão | 🟡 CRM genérico, sem os 3 canais | Ver §3.2 |
| MVP: Gestão de inscrição de alunos | 🔴 Formulário público não persiste | Ver §3.3 |
| MVP: Interface do professor | 🔴 Não existe (role/portal) | Ver §3.4 |
| MVP: Geração automática de documentos | 🔴 Não existe | Ver §3.3 |
| MVP: Gestão de turmas e logística | 🔴 100% manual, sem regras | Ver §3.3 |
| MVP: Automação de comunicação | 🔴 Só cobrança/lembrete de pesquisa | Ver §1.2 A1 |
| Pós-MVP: Gestão de professores | 🟢 CRUD completo (RH) | Ver §3.4 |
| Pós-MVP: Agendamento de teste de proficiência | 🟡 Existe para teste oral; não para o teste escrito de 20 questões | Ver §3.3 |
| Pós-MVP: CRM de escolas e diretores | 🟢 Módulo Parceiros cobre isso | Ver §3.2 |
| Pós-MVP: Gestão de materiais didáticos | 🔴 Não identificado no código | — |
| Pós-MVP: Sistema de níveis de acesso | 🟡 UI pronta, enforcement real ausente | Ver §3.6 |
| Pós-MVP: Integração com Stripe | 🔴 Só placeholders de UI e colunas no schema | Ver §3.1 |
| Melhorias futuras: Remarketing personalizado | 🔴 Não iniciado | — |
| Melhorias futuras: Material de estudo (flash cards) | 🔴 Não iniciado | — |
| Melhorias futuras: Assistente de áudio (IA) | 🔴 Não iniciado | — |
| Melhorias futuras: Análise preditiva (BI) | 🔴 Não iniciado | — |
| *(Não previsto no Guia)* Qualiopi / Satisfação / Melhoria contínua | 🟡 Construído por necessidade de certificação | Ver §3.5 |

---

## 5. Plano de integração entre funções e automações

O objetivo desta seção é descrever **o motor de automação que falta** — o que conecta os módulos hoje isolados em um fluxo único, ponta a ponta.

### 5.1 Fluxo-alvo (o que deveria acontecer automaticamente)

```
[Lead/Formulário público]
        │  grava em students + inscriptions (status = brouillon)
        ▼
[E-mail de confirmação] ──► dispara ao salvar (trigger de banco ou hook pós-insert)
        │
        ▼
[Teste de nivelamento] ──► aluno responde 20 questões reais (placement_test_questions)
        │  grava em placement_tests, calcula nível + MANHÃ/TARDE
        ▼
[Sugestão de alocação de turma] ──► motor de regras: estação + idioma + nível + vagas (3–16)
        │  staff aprova/ajusta
        ▼
[status = confirmee] ──► gatilho dispara em cadeia:
        ├─► Gera carta + contrato + orçamento (PDF, dados do aluno) → document_sendings
        ├─► Envia e-mail "Documentos" com anexos
        └─► Agenda e-mail de "Convocação" (J-7) e "Lembrete" (J-1) via scheduled_reminders
        ▼
[Curso decorre] ──► formador marca presença, lança avaliação final (Sessions + instructor role)
        ▼
[End Pack / fim de curso] ──► fatura final + certificado + pesquisa de satisfação
        │
        ▼
[E-mail "Dossiê pós-curso"] ──► certificado + fatura + link da pesquisa (dispara automaticamente, não só cria o registro)
        ▼
[Qualiopi] ──► indicadores recalculados automaticamente a partir dos dados reais (satisfação, conclusão, etc.)
```

### 5.2 Peça central que falta: um "motor de eventos"

Hoje cada tela chama o Supabase diretamente. Para os automações acima funcionarem de forma confiável (sem depender de alguém lembrar de clicar em um botão), recomenda-se introduzir uma camada fina e explícita:

1. **Tabela `scheduled_reminders` e `email_log` já existem** — devem passar a ser o *hub* central de comunicação (toda automação grava uma linha aqui, uma única Edge Function `process-scheduled-communications` processa a fila).
2. **Triggers de banco** (`AFTER UPDATE ON inscriptions WHEN status changes`) inserem tarefas na fila (ex.: "gerar documentos", "enviar confirmação") em vez de depender do frontend lembrar de chamar algo.
3. **Uma única Edge Function agendada de 15 em 15 minutos** (`process-scheduled-communications`) lê a fila, gera PDFs (usando um serviço de geração server-side, não apenas `jsPDF` client-side), envia e-mails via Resend com os templates de `email_templates`, e marca como processado.
4. Isso substitui a necessidade de múltiplas Edge Functions ad-hoc (como hoje) por um padrão único, testável e auditável (todo envio fica registrado em `email_log`).

### 5.3 Integrações entre módulos que precisam ser fechadas

| De → Para | Hoje | Deveria ser |
|---|---|---|
| Formulário público → Inscrições | Nada | Grava direto via Supabase client (com RLS anônima restrita e rate-limit) |
| Teste de nivelamento → Alocação de turma | Nada | Nível determinado alimenta o motor de sugestão de turma |
| Leads (CRM) → Inscrições | Campo existe, não usado | Ao converter lead, criar inscrição vinculada automaticamente |
| Inscrição confirmada → Documentos | Nada | Trigger gera 3 PDFs e registra em `document_sendings` |
| Inscrição confirmada → E-mails | Nada | Fila de `scheduled_reminders` dispara confirmação, docs, convocação, lembrete |
| Faturas → Pagamentos | Só ajusta `status`, não cria pagamento | Trigger cria/atualiza `payments` ao marcar fatura como paga |
| Fim de curso (End Pack) → Satisfação | Cria registro, não envia | Dispara e-mail imediato + agenda relances (função já existe, só falta o cron + o disparo inicial) |
| Satisfação/Conclusão → Qualiopi | KPIs calculados sob demanda na tela | Ok manter sob demanda, mas indicadores oficiais devem vir pré-carregados via seed |
| Permissões de UI → RLS do banco | Dois sistemas desconectados | Unificar: policies do banco devem consultar `user_permissions` (ou pelo menos `ProtectedRoute` deve bloquear por `canView`) |

---

## 6. Plano estrutural de refatoração completa

O plano é organizado em fases sequenciais. Cada fase tem pré-requisitos claros da fase anterior — não pular a Fase 0.

### Fase 0 — Segurança e fundação (bloqueante, sem novas features em paralelo no que for tocado)

1. Substituir `is_staff()` por um modelo explícito de roles de staff (`admin`, `staff_finance`, `staff_pedagogique`, etc., ou no mínimo negar usuários sem role atribuída).
2. Fechar o bucket `documents` (`public = false`), reescrever policies de Storage por pasta/`auth.uid()`, migrar URLs existentes.
3. Corrigir RLS pública de `satisfaction_surveys`, `instructor_contracts` e `placement_tests` para exigir o token específico do registro (via função `SECURITY DEFINER` que recebe o token, não `USING (true)`).
4. Proteger as Edge Functions de cron (`generate-monthly-charges`, `process-invoice-reminders`) com um segredo compartilhado validado no código (não confiar apenas em `verify_jwt`), e agendar `process-survey-reminders` via `pg_cron`.
5. Versionar no repositório de migrations as tabelas `funding_requests`/`funding_documents` que hoje só existem no banco vivo (evitar drift).
6. Recriar índices perdidos nas FKs mais consultadas (`inscriptions.student_id/status/season_id`, `payments.invoice_id`, `sessions.start_datetime`).

### Fase 1 — Consistência de dados no financeiro (destrava a "Entrega 3" do Guia)

1. Corrigir o gráfico de receitas/despesas (parar de usar CA N-1 como despesa).
2. Criar trigger/fluxo que gera `payments` automaticamente ao marcar fatura como paga; exigir `invoice_id` em pagamentos manuais quando aplicável.
3. Unificar a lógica de "formador a pagar" em uma única fonte de verdade.
4. Implementar exportação de relatório trimestral em PDF estruturado (não apenas CSV/projeção em tela).
5. Adicionar upload de comprovante (o campo já existe) e avaliar um serviço de OCR (pode começar simples: upload + preenchimento manual assistido, IA depois).
6. Introduzir trilha de auditoria para alterações financeiras (reaproveitar o padrão de `audit_log` já usado no Qualiopi).

### Fase 2 — Fechar o funil de inscrição ponta a ponta (o coração do produto)

1. Conectar o formulário público `/register` ao Supabase de verdade (criar `student` + `inscription` com status `brouillon`, código real via RPC `generate_inscription_code`).
2. Construir o teste de nivelamento real: CRUD admin para as 20 perguntas por idioma (`placement_test_questions`), player de teste para o aluno (público e no portal), cálculo automático de nível + regra MANHÃ/TARDE, gravação em `placement_tests`.
3. Substituir/consolidar `Classes` e `Sessions` em um único modelo de "turma" com estação + idioma + nível + capacidade mínima/máxima (3–16) e motor de sugestão de alocação (mesmo que a decisão final continue manual, a sugestão deve ser automática).
4. Aplicar a máquina de estados já definida em `lib/inscription-status.ts` nas telas (parar de permitir transições livres).
5. Padronizar nomenclatura de idiomas/status em um único enum compartilhado entre registro público, admin e sessões.

### Fase 3 — Automação de documentos e comunicação (a "Entrega 8" e "Entrega 10" do Guia)

1. Criar templates de carta, contrato e orçamento (PDF) parametrizados pelos dados da inscrição, com geração server-side (Edge Function) para permitir anexar em e-mail.
2. Implementar o "motor de eventos" descrito em §5.2: fila (`scheduled_reminders`) + processador único agendado.
3. Ativar os gatilhos: confirmação (na criação), documentos (na confirmação), convocação (J-7), lembrete (J-1), dossiê pós-curso (no End Pack) — usando os templates de `email_templates` já existentes.
4. Fazer o "End Pack" disparar e-mail imediato de dossiê, não só criar registros.

### Fase 4 — CRM de canais e comercial (a "Entrega 4" do Guia)

1. Modelar `channel` estruturado em `leads` (CPF/B2B/DSF) com formulário condicional e KPIs por canal.
2. Ligar conversão de lead → inscrição de fato.
3. Automatizar alertas de próxima ação vencida (notificação in-app já existe como tabela `notifications` — reaproveitar).

### Fase 5 — Portal do professor e permissões reais

1. Introduzir role `formateur` (ou vincular `instructors.auth_user_id` a `auth.users`) com RLS restringindo cada formador aos seus próprios alunos/sessões/pagamentos.
2. Construir a interface do professor conforme a "Entrega 9": turmas dele, presença, nível final, envio de relatório.
3. Unificar o sistema de permissões: `ProtectedRoute` deve checar `canView`/`canEdit` antes de renderizar, e as policies SQL sensíveis devem considerar `user_permissions`, não apenas `is_staff()`.

### Fase 6 — Qualidade, observabilidade e i18n

1. Popular `qualiopi_indicators` com o referencial oficial (seed) e transformar o relatório em documento estruturado exportável.
2. Corrigir o bug de enum de melhoria contínua (`ABANDONNE`/`A_SURVEILLER`).
3. Consolidar i18n: auditoria de cobertura por tela, padronizar idioma default, remover hardcodes remanescentes.
4. Reduzir uso de `any`, extrair utilitários compartilhados (`formatPrice`, cálculo de projeção, labels de status/idioma).
5. Introduzir testes automatizados mínimos (ao menos smoke tests de fluxo crítico: inscrição → teste → alocação → documento → e-mail) — hoje o `docs/TESTING_GUIDE.md` é 100% manual.

### Fase 7 — Integrações futuras (Pós-MVP/Melhorias do Guia)

1. Stripe (checkout + webhook de pagamento) — hoje é placeholder.
2. Remarketing, materiais de estudo (flash cards), assistente de áudio (IA), BI preditivo — nenhum tem base construída ainda; tratar como projetos novos após as fases 0–6.

---

## 7. Quick wins (baixo esforço, alto impacto — podem ser feitos em paralelo à Fase 0)

- Corrigir o gráfico "Recettes vs Dépenses" no `FinanceDashboard`.
- Corrigir `useRemoveEnrollment` para decrementar em vez de zerar `current_students`.
- Agendar `process-survey-reminders` via `pg_cron` (a function já existe e funciona).
- Fazer o End Pack disparar o e-mail de pesquisa de satisfação imediatamente, além de criar o registro.
- Alinhar o enum de `continuous_improvement` entre frontend e `CHECK` do banco.
- Remover a chave anônima hardcoded do `docs/TESTING_GUIDE.md` (usar placeholder).
- Padronizar `max_students` para não nascer com default 1 nos formulários de sessão.

---

## 8. Recomendações de processo/governança

1. **Higiene de migrations:** evitar novos `DROP TABLE ... CASCADE` em produção; usar migrations aditivas + scripts de migração de dados quando precisar remodelar. As duas reescritas globais de RLS já indicam retrabalho — a Fase 0 deve ser a última reescrita ampla antes de estabilizar um padrão único de policy por tipo de tabela (pública/staff/admin/dono).
2. **Segredo de automação:** nenhuma Edge Function de job (cron) deve ficar com `verify_jwt = false` sem validação própria — padronizar um cabeçalho `X-Cron-Secret` validado em todas.
3. **Testes antes de builds novos:** priorizar smoke tests automatizados do fluxo core (Fase 2/3) antes de adicionar módulos novos — hoje o `TESTING_GUIDE.md` depende 100% de checklist manual, o que não escala com a quantidade de módulos já existente.
4. **Uma fonte de verdade para nomenclatura:** criar um único arquivo de constantes (idiomas, status de inscrição, categorias financeiras) importado por todos os módulos, eliminando os múltiplos conjuntos divergentes encontrados.
5. **Revisão de RLS obrigatória em toda nova tabela:** exigir que toda nova migration inclua policies explícitas por operação (não `FOR ALL USING (true)`), seguindo o padrão mais restritivo já aplicado em `invoices`/`payments`.

---

## 9. Como usar este documento

Este documento deve ser o guia de priorização técnica das próximas entregas com a Paula/Mariana, complementando (não substituindo) o `Guia Business - Projeto FLI`. Sugestão de uso:

- Antes de aceitar qualquer plano gerado pelo Claude/Lovable para um novo módulo, verificar se ele não colide com um item da Fase 0 (segurança) ou da Fase 2 (fluxo core) — priorizar sempre essas duas fases.
- Ao revisar um plano do Lovable no passo "PASSO 7 - Avaliar o plano" do Guia original, usar a tabela da Seção 4 (Guia × Estado Real) para confirmar que a entrega proposta não está duplicando algo que já existe parcialmente em outro módulo (ex.: não recriar "Classes" sem antes decidir o destino de "Sessions").
- Revisitar a Seção 1 (Pendências e riscos) a cada nova entrega grande, marcando o que foi resolvido.
