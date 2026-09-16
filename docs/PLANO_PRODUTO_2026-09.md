# Plano de produto FLI Formation — análise completa e reorganização da navegação

Data: 16/09/2026 · Base: `main` (após PR #46) · Escopo: todas as rotas de `src/App.tsx`, sidebar, fichas, tabelas, botões, gráficos e portais.

Método: leitura integral do código-fonte (páginas, componentes, hooks, migrations e edge functions), cruzada com `docs/ETAT_APP_2026-09.md` e `docs/BACKLOG.md`. Nenhum dado pessoal. Cada constatação cita `arquivo:linha`.

Este documento **não substitui** as vagas 0–4 do `BACKLOG.md` para 1º de outubro. Ele propõe o que vem depois (ou em paralelo, onde indicado), e é a resposta às perguntas: *o que melhorar para o sistema ser mais interativo e robusto na ótica do cliente, e como reorganizar menus, submenus e abas.*

---

## 1. Resumo executivo

O sistema tem **muita superfície e pouca conexão**. São 55 rotas, 6 grupos de menu e mais de 40 telas, mas:

1. **As entidades não se ligam.** Das 25 relações entre módulos que um usuário espera percorrer (fatura → inscrição → aluno → pagamento → formador → sessão → avaliação), **apenas duas são clicáveis**: inscrição → aluno e parceiro → inscrição. Todo o resto é texto morto. Detalhe em §3.
2. **O cliente não tem porta de entrada.** Não existe link de acesso por inscrição; o único mecanismo é o *magic link* por aluno, gerado dentro de um e-mail que **a interface atual não consegue disparar** (constante `STUDENT_PORTAL_IN_SEASON_SCOPE = false` em `src/lib/email-guards.ts:6`). O código da inscrição é a única coisa que o cliente recebe, e na ficha ele **não tem botão de copiar** (`InscriptionClientAccessCard.tsx:96-101`). Detalhe em §4.
3. **O admin não vê o que o cliente vê.** `/students/:id/portal-preview` é uma **maquete separada** com 4 abas que reimplementa o portal com metade dos dados e zero componentes em comum com `/student/*`. O botão "Portail (compte lié)" abre `/student/dashboard` como admin e é expulso silenciosamente para `/` (`StudentProtectedRoute.tsx:36-41`). **Não existe** visão do que um formador vê. Detalhe em §4.
4. **Metade dos módulos aponta para tabelas vazias.** `sessions`, `test_bookings`, `test_candidates`, `test_phrases`, `satisfaction_surveys`, `certificates`, `instructor_sessions`, `instructor_payments`: 0 linhas em produção. As telas correspondentes (Sessions, Évaluations, Satisfaction, abas Planning/Historique/Paiements do formador) renderizam estados vazios permanentes, alguns com mensagens de sucesso falsas ("Toutes les évaluations sont à jour !"). Detalhe em §6.
5. **Botões que não fazem nada e dados fabricados.** 14 botões visíveis sem `onClick` (Exporter, Filter, Mail, Phone, Envoyer un email, Téléverser, avatar do header…), paginação com Précédent/Suivant permanentemente desabilitados enquanto as queries cortam em 100 ou 1000 linhas, checklist de preparação do dashboard "simulada" pela contagem de alunos, "Dépenses" que na verdade é o CA do ano anterior. Detalhe em §5 e Anexo A.
6. **Permissões são decorativas.** `ProtectedRoute` nunca chama `canView`; a matriz de `/admin/users` só filtra a sidebar. Qualquer usuário `user` acessa `/admin/users`, `/settings` e o *purge* de tabelas em `/admin/import` digitando a URL. Detalhe em §7.
7. **A sidebar tem 3 níveis, tudo recolhido por padrão.** Chegar em `/finance` custa 3 cliques (Gestion → Finance → Vue d'ensemble). "Gestion" mistura CRM, operação e finanças; "Formateurs" é um grupo com um único item; "Documents" e "Historique" estão em Qualité; "Évaluations" vive sob `/formateur/`. Proposta completa em §8.

**O que este plano propõe, em uma frase:** transformar o sistema de "coleção de telas" em "rede de fichas conectadas", com uma navegação de 2 níveis, um bloco padrão de *Acesso & comunicação* em toda ficha, portais reais para aluno e formador que o admin pode abrir "como" a pessoa, e o fim de toda UI que promete e não entrega.

---

## 2. Mapa atual do sistema

### 2.1 Sidebar hoje (`src/components/layout/Sidebar.tsx:84-158`)

| Grupo | Itens | Sub-itens | Observação |
|---|---|---|---|
| — | Dashboard `/` | — | Único item de 1º nível |
| **Gestion** | Finance, Commercial, Moniteurs ski, Partenaires, Inscriptions, Factures, Stagiaires | Finance: Vue d'ensemble, Paiements, Analyses, Rentabilité, Trésorerie, Charges fixes · Inscriptions: Liste, Horaires J-10 | 7 itens + 8 sub-itens; "Finance" e "Inscriptions" são gatilhos, não links |
| **Formation** | Tests de niveau, Évaluations, Sessions | — | Évaluations aponta para `/formateur/evaluations` |
| **Formateurs** | Formateurs | — | Grupo de 1 item |
| **Qualité** | Satisfaction, Amélioration, Audit Qualiopi, Historique, Documents | — | Historique = `audit_log`; Documents = maquete vazia |
| **Administration** (admin) | Import, Emails, Phrases, Saisons, Tests QA, Utilisateurs, Paramètres | — | `/admin/import-phrases` é rota órfã, sem link |

Todos os grupos abrem **recolhidos** salvo o da rota atual (`Sidebar.tsx:225`). Modo de colapso é `offcanvas` (`Sidebar.tsx:315`): ou a sidebar inteira aparece, ou desaparece; não há trilho de ícones.

### 2.2 Rotas sem entrada no menu

`/inscriptions/:id`, `/students/:id`, `/students/:id/portal-preview`, `/gestion/partenaires/:id`, `/formateurs/:id`, `/formateur/evaluation/*`, `/admin/import-phrases`, `/reserver-test` (**zero links em todo o código**, `App.tsx:73`), `/mockup/dashboard-gestao` (**pública**, fora de `ProtectedRoute`, `App.tsx:82`), `/classes` (redirect; `src/pages/Classes.tsx` com 309 linhas nunca é importado).

### 2.3 Breadcrumbs

`Breadcrumbs.tsx:78-89` transforma cada segmento intermediário em link, inclusive segmentos que **não são rotas**: `/gestion`, `/admin`, `/qualite`, `/formateur`, `/formation`, `/student` → clicar leva a `NotFound`.

### 2.4 Header

Busca global (⌘K) cobre alunos, inscrições (só por `code`), faturas (só por número, e o resultado leva à **lista sem filtro**, `GlobalSearch.tsx:155`) e formadores. Não cobre parceiros, leads, monitores, sessões, pagamentos. Sino de notificações tem **um único produtor ativo** (`submit-registration`); os tipos `paiement`, `test`, `evaluation` do mapa de ícones nunca são emitidos. Avatar de perfil é um botão **sem `onClick`** (`TopHeader.tsx:157-166`).

---

## 3. Correlações entre módulos — matriz de navegabilidade

Legenda: ✅ link clicável · 📄 exibido como texto, sem link · ❌ nem exibido · 🔒 bloqueado por bug/flag.

| De → Para | Estado | Evidência |
|---|---|---|
| Inscrição → Aluno | ✅ | `InscriptionDetails.tsx:364-370` |
| Aluno → Inscrição | 📄 | `StudentDetails.tsx:443-470` linhas não clicáveis |
| Inscrição → Formador | 📄 | `InscriptionDetails.tsx:383-398` (id disponível em `:830`) |
| Formador → Inscrições | ❌ | abas lêem `instructor_sessions` (0 linhas) — BL-041 |
| Inscrição → Parceiro/ESF | 📄 | `InscriptionDetails.tsx` card École de ski |
| Parceiro → Inscrição | ✅ | `PartnerDetails.tsx` aba Inscriptions |
| Inscrição → Fatura | 📄 | `InscriptionDetails.tsx:729-747` divs inertes |
| Fatura → Inscrição / Aluno | 📄 | `Invoices.tsx:747-838`; não existe rota de detalhe de fatura |
| Fatura → Pagamentos | ❌ | nenhuma seção de pagamentos em `/invoices` |
| Pagamento → Fatura / Inscrição | 📄 | `FinancePayments.tsx:376-384` |
| Inscrição → Pagamentos | 📄 | só na aba **Accès client** (`InscriptionClientAccessCard.tsx:157-190`) |
| Parceiro → Fatura | 📄 | `PartnerDetails.tsx` aba Facturation |
| Inscrição → Teste de nível | ✅ (embutido) | `PlacementTestSummaryCard` |
| Teste de nível → Inscrição / Aluno | ❌ | `usePlacementTestStats.ts:41` descarta os FKs |
| Inscrição → Avaliação oral | ❌ | avaliações referenciam `test_candidates`, nunca `students` |
| Formador → Avaliações que escreveu | ❌ | sem aba; só filtro por nome na lista |
| Sessão → Inscrição / Formador | 📄 | `SessionDetailPanel.tsx:85,101-116` |
| Inscrição → Sessões | ❌ | `session_enrollments` nunca exibido na ficha |
| Lead → Inscrição | ✅ | `LeadFormDialog.tsx:275` |
| Inscrição → Lead de origem | ❌ | `leads.inscription_id` nunca lido do lado da inscrição |
| Monitor de ski → Parceiro | 📄 | tabela `MoniteursSki.tsx` |
| Date de formation (intake) → Inscritos | 📄 | contador não clicável; **nada escreve `intake_id`** |
| Verbatim de satisfação → Aluno / Inscrição | ❌ | `SatisfactionStats.tsx:165-171` anônimo |
| Verbatim → Réclamation (Amélioration) | ❌ | os dois lados do critério 7 Qualiopi nunca se encontram |
| Journal d'audit → registro alterado | 📄 | UUIDs truncados, `AuditHistory.tsx:112-115` |
| Dashboard `/` → qualquer coisa | ❌ | **zero** `Link`/`onClick` na página inteira |
| KPIs de Finance → listas | ❌ | nenhum card clicável nas 6 páginas |

**Conclusão:** o usuário percorre o sistema pela sidebar e pela busca, nunca "pela informação". Toda ficha deveria ser um *hub*: cada nome, código ou número que aparece é um link.

---

## 4. Acesso do cliente — o que existe e o que falta

### 4.1 O que acontece hoje quando uma inscrição é criada

| Origem | O que é gravado | O que o cliente recebe | O que o staff consegue ver/copiar depois |
|---|---|---|---|
| `/register` (público) | `students`, `inscriptions` (`code` via `generate_inscription_code`, status `en_attente`), `payments`, `placement_tests`, `document_sendings`, `email_log`, `notifications` admin | Tela de sucesso com **apenas o código** (`ConfirmationStep.tsx:238-241`) + e-mail de confirmação | Código em texto **sem botão copiar** na aba Accès client |
| Back-office (`InscriptionFormDialog.tsx:409-430`) | `inscriptions` com status **`brouillon`** | Nada | Idem; e `brouillon` **não aparece no filtro de status** da lista (`Inscriptions.tsx:384-391`) |
| Lead convertido (`useLeads.ts:223-329`) | `students` + `inscriptions` `brouillon` | Nada | Idem |

**Não existe token, link ou código de acesso por inscrição.** Nenhuma coluna do tipo `access_token`/`client_token` é escrita.

### 4.2 O único acesso real: o portal do aluno por *magic link*

- Gerado por `invite-student-portal` (`index.ts:157-167`) com `generateLink({type:'magiclink'})`, embutido num e-mail Resend e **nunca devolvido ao navegador nem persistido** (`email_log.variables_used` guarda só `student_id`).
- O botão "Envoyer l'invitation" só aparece se `STUDENT_PORTAL_IN_SEASON_SCOPE && email && !placeholder` (`StudentPortalAccessCard.tsx:31-32`), e a constante é `false`. `PortalInvitesBulkCard` retorna `null` incondicionalmente (`:40-42`). **Na build publicada não há nenhum botão que conceda acesso ao portal.**
- O convite é logado **sem `inscription_id`**, então nunca aparece em "Emails envoyés" da ficha da inscrição.

### 4.3 O que a aba "Accès client" mostra (`InscriptionClientAccessCard.tsx`)

| Linha | Conteúdo | Problema |
|---|---|---|
| Code inscription | texto | sem copiar |
| Formulaire d'inscription public | `/register?lang=…` com copiar | link **genérico**, não do cliente |
| Enquête de satisfaction | `/survey/<token>` com copiar, ou "Créer le lien" | único token realmente específico do cliente ✅ |
| Espace stagiaire (prévisualisation admin) | `/students/:id/portal-preview` com copiar | **link admin** sob o título "Liens à partager avec le stagiaire"; se enviado ao aluno, ele é rejeitado por `ProtectedRoute` |
| Paiement & statut / Emails envoyés | listas | pagamentos escondidos aqui em vez da aba Financier |

### 4.4 A "visão do aluno" para o admin

`StudentPortalPreview.tsx` (268 linhas) é uma página separada dentro do `MainLayout` admin, com 4 abas (Tableau de bord · Planning · Documents · Évaluation). Reusa os hooks, **mas nenhum componente** de `src/pages/student/*`.

| Portal real (`/student/*`) | Preview |
|---|---|
| Layout próprio, nav de 5 itens, barra mobile | sidebar admin + breadcrumb "Portal-preview" |
| Dashboard: formação ativa com datas, piste, formador, local; próximas sessões; resultados com score e certificados | 5 inscrições (idioma+código+status) e 3 testes; **sem formador, datas, score, certificados** |
| Documents: botão de download por URL assinada | nomes e datas, **sem download** |
| Planning: futuras/passadas, sala, formador | lista plana, título + data |
| Évaluation: CTA "Répondre" | `CopyLinkRow` (widget de staff) |
| `/student/test` | **sem equivalente** |

Ou seja: o admin testa uma coisa e o aluno vê outra. Não há *impersonation* nem contexto "ver como".

### 4.5 A "visão do formador" para o admin

Não existe. Um admin acessa `/formateur/evaluations` (rota `ProtectedRoute` comum), mas vê **todas** as avaliações, não as de um formador específico, e sem moldura "você está no espaço do formador". O formador em si é jogado no `MainLayout` do staff com sidebar de **um item** (`Sidebar.tsx:284-290`); não tem planning, perfil, alunos, pagamentos, documentos (§6.4). A prova de RLS do ponto C.1 foi feita à mão com `SET ROLE` em SQL — esse é o "preview" atual.

### 4.6 Proposta para acesso do cliente (detalhada em §9, onda 1 e 2)

1. **Lien de suivi por inscrição** (novo): coluna `inscriptions.access_token` (uuid, gerado no insert por trigger), página pública `/suivi/:token` sem login mostrando status, datas, horário matin/après-midi, documentos disponíveis, situação de pagamento e o botão "Accéder à mon espace" (que dispara o magic link). Exibido e copiável na tela de sucesso do `/register`, no e-mail de confirmação, na lista de inscrições (coluna Accès) e na aba **Accès & communication** da ficha.
2. **Convite ao portal ligado** por configuração (`app_settings.student_portal_enabled`) em vez de constante de código; convite logado com `inscription_id`; ficha mostra "Compte créé · Invité le … · Dernière connexion …".
3. **"Voir comme le stagiaire" real**: as páginas de `/student/*` passam a ler o `studentId` de um contexto (`StudentViewContext`), preenchido pela sessão do aluno em produção ou por `/portails/stagiaire/:studentId/*` no modo admin, com o **mesmo `StudentLayout`** e um banner "Prévisualisation · vous voyez ce que voit X". Um só código para as duas coisas; o preview atual é apagado.
4. **"Voir comme le formateur"** com o mesmo padrão sobre o novo portal do formador (§6.4).

---

## 5. Diagnóstico por eixo

### 5.1 Botões, controles e páginas que não fazem nada

Inventário completo no Anexo A. Destaques: `Exporter` em Inscriptions e Students; `Filter` em ambas; `Mail`/`Phone` por linha em Students; `Envoyer un email` na ficha do aluno; `Téléverser un document`, busca e ações de linha em `/documents`; avatar do header; "+N autres" no mês do Planning; "Gérer toutes les sessions" em `UpcomingClasses`; "Voir les envois" (Resend) em Settings que leva a templates, não a envios.

### 5.2 Paginação falsa e listas truncadas (relacionado a BL-037)

| Lista | Limite real | UI |
|---|---|---|
| `/inscriptions` | `.limit(100)` (`useInscriptions.ts:61`) | Précédent/Suivant `disabled` fixos (`Inscriptions.tsx:600-606`) |
| `/students` | `.limit(100)` (`useStudents.ts:38`) | idem (`Students.tsx:419-425`) |
| `/invoices` | sem limite, **N+1**: 2 queries por fatura (`useInvoices.ts:90-143`) | comentário `{/* Pagination */}` sobre um contador |
| `/finance/payments` | tabela inteira (`usePayments.ts:55-88`) | nada |
| `/gestion/moniteurs` | 1000 de 4047; KPIs calculados sobre as 1000 (`useSkiMonitors.ts:54-74`) | nada |
| `/gestion/partenaires` | 1000 de 1032 (`usePartners.ts:51-64`) | nada |
| `/gestion/commercial` | 1000 (`useLeads.ts:73-97`) | perdidos cortados em 8 (`CommercialDashboard.tsx:189`) |
| `/admin/phrases` | 1000 (`useTestPhrases.ts:36-77`) | nada |
| `/qualite/historique` | 500 (`AuditHistory.tsx:43`) | nada |

Nenhuma lista tem ordenação por coluna, seleção de linhas ou ação em massa (exceto Horaires J-10 e o card de convites, que está oculto).

### 5.3 Dados fabricados ou rotulados errado

| Onde | O que | Evidência |
|---|---|---|
| `/` KPI "Prévision Mensuelle" | é o **já faturado** do mês, inclui canceladas | `useDashboardStats.ts:52-56,69` — BL-032 |
| `/` aba "Facturation" | meses futuros sempre 0 € | `useDashboardStats.ts:108-117` — BL-032 |
| `/` aba "Préparation" | checklist "simulada" por contagem (`count>=1`, `>=2`) → "100% Complet" para 2 alunos | `DashboardGestao.tsx:498-505` |
| `/` badge "Actualisé à l'instant" | string fixa, sem refetch | `DashboardGestao.tsx:271-274` |
| `/finance` "Recettes vs Dépenses" | "Dépenses" = CA do ano anterior | `FinanceDashboard.tsx:100` |
| `/finance` "Objectifs du trimestre" | 50 000 € / 15 / 60 % fixos; "Nouveaux stagiaires" = nº de formadores | `FinanceDashboard.tsx:110-120` — BL-039 |
| `/finance/tresorerie` | entradas contam fatura pendente **e** preço da inscrição (dupla contagem); atrasos de formador somados em todos os meses | `useFinancialDashboard.ts:653-660` |
| `/finance/analyses` e `/finance/rentabilite` | mesma média móvel de 3 meses vendida como "projeção" em 3 lugares | `RevenueChart.tsx:34-47`, `QuarterlyForecast.tsx`, `CostForecast.tsx` |
| `/satisfaction-stats` Comparaison | temporadas hardcoded até `autumn2025`; `winter2025` existe no hook e não no menu | `SatisfactionStats.tsx:541-552` |
| `/qualite/audit` "Taux de complétion évaluations" | mede conclusão de **enquetes** | `useQualiopiAudit.ts:168-180` |
| Import moniteurs | barra de progresso fixa em 66 % | `SkiMonitorImportDialog.tsx:119` |
| Ficha da inscrição, Documents | "Pack de fin envoyé à <email>" — **nenhum e-mail é enviado** pelo pack | `end-pack.ts:320-327` vs `InscriptionDocumentsCard.tsx:114-127` |
| `/admin/emails` | "Six modèles" fixo ao lado de um contador vivo | `Emails.tsx:324` |
| Settings, identidade | "alimentent les conventions, les factures et les PDF" — faturas e e-mails **não** leem `fli_identity` | `OrganizationIdentityCard.tsx:89-92` |

### 5.4 Duplicações e sobreposições

- **Finance:** CA faturado aparece em 4 páginas; "Taux de Conversion" (Analyses) e "Taux de recouvrement" (Payments) são a mesma razão; repartição por atividade renderizada 3 vezes; balance formateurs em 2 páginas (uma acionável, outra exportável). `/invoices` é a única página que age sobre faturas e a única **sem totais**.
- **Sessões:** três modelos de "quando acontece a aula" que não se conhecem: `sessions` (calendário), `instructor_sessions` (aba Planning do formador), `course_intakes` (Dates de formation dos monitores). Dois componentes chamados `SessionFormDialog` escrevem em tabelas diferentes e checam conflitos só na própria tabela.
- **Importadores de frases:** `/admin/phrases` (colar JSON, sem dedupe) e `/admin/import-phrases` (órfão, com dedupe).
- **Documentos:** `/documents` (maquete) vs `document_sendings` por inscrição vs `/student/documents`.
- **Taxonomias:** 8 constantes divergentes de idioma/modalidade (`"Portugais"` vs `"Portugais brésilien"`, `"Présentiel"` vs `"presentiel"`) alimentam um lookup de preço por igualdade exata que devolve `null` em silêncio (`useSeasons.ts:184-209`).

---

## 6. Fluxos sem entrada ou sem saída

### 6.1 Avaliações orais SNMSF (`test_bookings` = 0)

| Etapa | UI? |
|---|---|
| Candidato pede teste em `/reserver-test` | ✅ público, mas **sem nenhum link de entrada** |
| Staff vê o pedido | ❌ grava em `test_candidates`; **nenhuma tela lê essa tabela** |
| Criar a reserva (data, idioma, formador, sponsor) | ❌ **nada escreve `test_bookings`** |
| Atribuir avaliador · marcar `completed` | ❌ |
| Avaliar · submeter · verificar (Paula) · PDF · export DSF | ✅ completo e bem-acabado |
| Marcar `envoye` | ❌ status existe no tipo, no label e num toast; nenhuma ação o define |
| Ligar a um certificado / ao aluno | ❌ |

A metade de trás está pronta; a metade da frente não existe. É por isso que a tabela está em zero.

### 6.2 Planning (`sessions` = 0)

Calendário completo (semana/mês, criar, editar, inscrever, checar conflito) sobre uma tabela vazia. "Inscriptions non affectées" lista inscrições reais atrás de um botão **que nunca pode ser habilitado** (tooltip "Sélectionnez une session d'abord"). Semana limitada a 07h–18h; painel direito desaparece abaixo de 1024 px; `recurrence` gravada e nunca expandida; `season_id` sempre `null`.

### 6.3 Satisfação (`satisfaction_surveys` = 0)

A única forma de criar uma enquete é o botão "QR Satisfaction" na página **Évaluations** (`EvaluationsList.tsx:189`). `/satisfaction-stats` não cria, não envia, não relança. O relatório PDF Qualiopi exporta "0 %" sem aviso.

### 6.4 Formador

Sem portal. Com o papel `formateur` o usuário cai no layout de staff com um único item. Não vê planning, perfil, alunos, pagamentos, banco de frases (0 linhas, e o formulário de avaliação depende dele), histórico de recusas. Conta só pode ser criada em `/admin/users` escolhendo um `instructors` sem `auth_user_id`; a ficha do formador não tem "Inviter".

### 6.5 Documents

Maquete: array vazio hardcoded (`Documents.tsx:114`), categorias com `cursor-pointer` sem `onClick`, upload sem handler, busca sem estado.

### 6.6 Comercial / monitores / parceiros

- Conversão lead → inscrição existe, mas descarta `estimated_students`, usa as datas da temporada inteira e mapeia idioma para valores sem regra de preço (`useLeads.ts:214-221,277-300`).
- `<SelectItem value="">` em `LeadFormDialog.tsx:223` e `InvoiceCreateDialog.tsx:204`: Radix lança erro; seletor de parceiro em leads B2B/DSF e "Aucune inscription" na nova fatura estão **quebrados em runtime**.
- Congelamento da prospecção (`PROSPECTION_MONITEURS_GELEE = true`, constante) deixa 2/3 da página de monitores inerte, e a **ficha do parceiro não aplica o congelamento**: "Modifier" e "Supprimer" falham com erro cru depois de preencher o formulário (`PartnerDetails.tsx:82-87`).
- `schools_invoice_policy` tem tabela, RLS e tipos, e **zero referências** em `src/`.

---

## 7. Papéis, permissões e segurança de uso

| Constatação | Evidência |
|---|---|
| `ProtectedRoute` nunca chama `canView`/`canEdit` | `ProtectedRoute.tsx:31-67` |
| Sub-itens da sidebar não são filtrados; sub-item sem chave = concedido → menu **Inscriptions** visível para todos | `Sidebar.tsx:204-213, 304-309` |
| Chaves configuráveis vs rotas: `dashboard` e `admin.seasons` mapeadas e não configuráveis; `formateurs` em "Formation" no editor e grupo próprio na sidebar; `classes` rotulada "Sessions" com 2 caminhos | `route-permissions.ts:35-36,57,78` |
| Rotas de detalhe sem chave: usuário sem `inscriptions` acessa `/inscriptions/<uuid>` | `Sidebar.tsx:302` |
| `can_edit` usado em pouquíssimos lugares; view-only vê e clica em tudo | grep `canEdit` |
| `/admin/users`: sem busca, sem mudar papel, sem reset de senha, sem convite por e-mail; `is_active=false` **não é verificado** no login | `UserManagement.tsx:126-147` |
| `signInWithOtp` sem `shouldCreateUser:false`; usuário sem linha em `user_roles` não é barrado por nenhum guard | `useAuth.ts:51-58` |
| `/mockup/dashboard-gestao` público | `App.tsx:82` |
| Purge de tabela inteira em `/admin/import` acessível a qualquer `user`, sem export prévio | `Import.tsx:325-329` |

---

## 8. Nova arquitetura de navegação

### 8.1 Princípios

1. **Dois níveis, nunca três.** Seções são cabeçalhos fixos (não colapsáveis); itens são links. Sub-navegação vive **dentro da página**, em abas, com a aba na URL (`?tab=` ou sub-rota) para ser compartilhável.
2. **Organizado por quem usa e para quê**, não por tabela: Operação (alunos e formações), Comercial, Finance, Qualité, Portais, Administração.
3. **Toda ficha é um hub**: cabeçalho com status + ações primárias, abas, e um bloco padrão **Accès & communication** (link de acompanhamento, portal, e-mails enviados, próximo passo).
4. **Toda referência é link.** Nome de aluno, formador, parceiro, código de inscrição, número de fatura: sempre navegável, em tabela, card, KPI ou notificação.
5. **Toda contagem tem destino.** KPI clicável abre a lista filtrada correspondente.
6. **Sidebar em modo `icon`** (trilho de ícones quando recolhida) com tooltips; busca global com comandos ("aller à…") e todas as entidades.
7. **O que não funciona sai do menu** até funcionar (Documents, Sessions vazio, Import phrases órfão, mockup).

### 8.2 Sidebar proposta

Rótulos em francês (idioma da interface). Entre parênteses, o que cada item absorve.

```
Tableau de bord                                  /

OPÉRATIONS
  Inscriptions                                   /inscriptions
      abas: Toutes · À traiter · Horaires J-10 · Brouillons · Terminées
      (absorve /inscriptions/schedule-validation)
  Stagiaires                                     /stagiaires        (ex /students)
  Formateurs                                     /formateurs
  Planning                                       /planning          (ex /formation/sessions, unificado — §9 onda 3)
  Tests de niveau                                /tests
      abas: Statistiques · Tests individuels · Liens publics
  Tests oraux SNMSF                              /tests-oraux       (ex /formateur/evaluations)
      abas: Demandes · Réservations · À évaluer · Complétées · Banque de phrases (admin)
      (absorve /admin/phrases, /admin/import-phrases, /reserver-test como link público)
  Documents                                      /documents         (só após implementação real — onda 3)

COMMERCIAL & PARTENAIRES
  Pipeline commercial                            /commercial        (ex /gestion/commercial)
  Partenaires                                    /partenaires       (ex /gestion/partenaires)
  Moniteurs de ski                               /moniteurs         (ex /gestion/moniteurs; badge "gelé" enquanto congelado)
      abas: Dates de formation · Écoles de ski · Base moniteurs

FINANCE
  Facturation                                    /finance/facturation   (ex /invoices + /finance/payments)
      abas: Factures · Paiements · Relances
      + rota de detalhe /finance/facturation/:id (nova)
  Pilotage                                       /finance               (ex Vue d'ensemble + Analyses + Rentabilité)
      abas: Vue d'ensemble · Analyses · Rentabilité
  Trésorerie & charges                           /finance/tresorerie    (ex Trésorerie + Charges fixes)
      abas: Prévisionnel · Charges fixes

QUALITÉ
  Satisfaction                                   /qualite/satisfaction  (ex /satisfaction-stats)
      abas: Statistiques · Enquêtes (criar, enviar, relançar) · Comparaison
  Amélioration continue                          /qualite/amelioration  (ex /amelioration)
  Audit Qualiopi                                 /qualite/audit
      abas: Indicateurs · Preuves · Rapport

PORTAILS  (admin e user com permissão; "voir comme")
  Espace stagiaire                               /portails/stagiaire    → escolher aluno → /portails/stagiaire/:id/*
  Espace formateur                               /portails/formateur    → escolher formador → /portails/formateur/:id/*

ADMINISTRATION  (admin)
  Utilisateurs & accès                           /admin/utilisateurs    (ex /admin/users)
      abas: Utilisateurs · Rôles & permissions · Invitations
  Paramètres                                     /admin/parametres      (ex /settings + /admin/seasons)
      abas: Organisation · Saisons & tarifs · Langues & modalités · Intégrations · Valeurs par défaut
  Communications                                 /admin/communications  (ex /admin/emails)
      abas: Modèles d'emails · Journal des envois · Notifications
  Données                                        /admin/donnees         (ex /admin/import + /admin/testing + /qualite/historique)
      abas: Import · Recette & nettoyage · Journal d'audit
```

Rodapé da sidebar: apenas versão/organização. Idioma e logout vão para o **menu do avatar** no header (Mon profil · Langue · Déconnexion), junto com "Mes notifications" (nova página `/notifications`).

Contagem: hoje 5 grupos colapsáveis + 26 destinos em 3 níveis. Proposta: 6 seções fixas + 21 destinos em 2 níveis, todos visíveis sem clique de abertura.

### 8.3 Mapeamento antigo → novo (redirects a manter por 1 temporada)

| Rota atual | Nova rota |
|---|---|
| `/students`, `/students/:id` | `/stagiaires`, `/stagiaires/:id` |
| `/students/:id/portal-preview` | `/portails/stagiaire/:id` |
| `/inscriptions/schedule-validation` | `/inscriptions?tab=horaires` |
| `/formation/sessions`, `/classes` | `/planning` |
| `/formateur/evaluations` | `/tests-oraux` |
| `/formateur/evaluation/:bookingId[/edit]` | `/tests-oraux/:bookingId/saisie` |
| `/formateur/evaluation-view/:id` | `/tests-oraux/evaluations/:id` |
| `/formateur/evaluations/:id/verifier` | `/tests-oraux/evaluations/:id/verification` |
| `/admin/phrases`, `/admin/import-phrases` | `/tests-oraux?tab=phrases` |
| `/gestion/commercial` · `/gestion/partenaires[/:id]` · `/gestion/moniteurs` | `/commercial` · `/partenaires[/:id]` · `/moniteurs` |
| `/invoices` | `/finance/facturation` |
| `/finance/payments` | `/finance/facturation?tab=paiements` |
| `/finance/analyses` · `/finance/rentabilite` | `/finance?tab=analyses` · `/finance?tab=rentabilite` |
| `/finance/charges-fixes` | `/finance/tresorerie?tab=charges` |
| `/satisfaction-stats` · `/amelioration` | `/qualite/satisfaction` · `/qualite/amelioration` |
| `/qualite/historique` | `/admin/donnees?tab=audit` |
| `/documents` | removido do menu até a onda 3 |
| `/settings` · `/admin/seasons` | `/admin/parametres` (abas) |
| `/admin/emails` | `/admin/communications` |
| `/admin/import` · `/admin/testing` | `/admin/donnees` (abas) |
| `/admin/users` | `/admin/utilisateurs` |
| `/mockup/dashboard-gestao` | removido |
| `/student/*` | mantido (portal real), passa a aceitar contexto de preview |

Portal do formador (novo): `/formateur/*` deixa de ser área de staff e vira o portal, com `FormateurLayout`: `/formateur/tableau-de-bord`, `/formateur/evaluations`, `/formateur/planning`, `/formateur/stagiaires`, `/formateur/profil`, `/formateur/paiements`, `/formateur/documents`.

### 8.4 Chaves de permissão alinhadas à nova árvore

Uma chave por item de menu, mesma hierarquia do menu, editada em `/admin/utilisateurs?tab=permissions` com as **mesmas seções e rótulos** da sidebar. Rotas de detalhe herdam a chave do item pai. `ProtectedRoute` recebe `routeKey` e bloqueia com página "Accès non autorisé" (não redirect mudo). `canEdit=false` esconde toda ação de mutação da página (padrão `useCanEdit(routeKey)` consumido por todos os botões).

---

## 9. Redesenho das telas-chave (abas internas)

### 9.1 Ficha da inscrição `/inscriptions/:id`

Cabeçalho: código · aluno (link) · idioma · período · `InscriptionStatusMenu` · ações: Modifier · Horaire · Pack de fin · Créer facture (sempre visível, com aviso se já existe) · ⋯ (Supprimer, Dupliquer).

| Aba | Conteúdo |
|---|---|
| **Résumé** | Aluno (link), formador (link), parceiro/ESF (link), lead de origem (link, se houver), próximas datas, alertas (dates à confirmer, horaire pending, documents manquants, solde dû) |
| **Formation** | idem hoje + sessões/planning ligados + teste de nível com link para o registro |
| **Financier** | faturas **clicáveis** com aperçu/PDF/marquer payée + **pagamentos** (movidos de Accès client) + "Enregistrer un paiement" + saldo calculado de `payments`, não da coluna |
| **Accès & communication** | *Lien de suivi* (copiar/abrir/renovar) · status do portal (Compte créé · Invité le · Dernière connexion · botão Inviter/Renvoyer) · e-mails enviados (incluindo convites) · botão "Envoyer un email" (modelo + prévia) · nota interna |
| **Documents** | envios + certificado + **upload** + "Renvoyer" |
| **Évaluation** (se houver teste oral) | link para a avaliação/PDF |
| **Historique** | timeline atual + notas manuais ("Ajouter une note") |

### 9.2 Ficha do aluno `/stagiaires/:id`

Cabeçalho com Modifier (hoje inexistente) e "Envoyer un email" funcional.

Abas: **Profil** · **Inscriptions** (linhas clicáveis; corrigir filtro que compara com rótulos FR, `StudentDetails.tsx:364,396-409`) · **Facturation** (faturas + pagamentos do aluno) · **Tests & évaluations** (testes de nível individuais + orais) · **Documents** · **Portail & accès** (status, convite, "Voir comme", lien de suivi de cada inscrição) · **Historique**.

### 9.3 Ficha do formador `/formateurs/:id`

Abas: **Profil** (expor os ~20 campos hoje invisíveis) · **Planning** (a partir de **inscrições atribuídas**, BL-041, + sessões unificadas) · **Stagiaires** (inscrições onde é `instructor_id`) · **Évaluations** (as que escreveu, com status) · **Paiements** (com "Enregistrer un paiement" e link para Finance) · **Administratif** (contrato, attestation de vigilance, statut, BL-042) · **Accès portail** (Inviter, Voir comme).

### 9.4 Ficha do parceiro `/partenaires/:id`

Abas atuais + **Écoles de ski liées** + **Moniteurs** + **Politique de facturation** (`schools_invoice_policy`). Contatos e contratos editáveis; exclusões com `AlertDialog`; aplicar o congelamento como na lista; linhas de faturas clicáveis.

### 9.5 Fatura `/finance/facturation/:id` (nova)

Cabeçalho com número, status, cliente (link), inscrição (link). Blocos: linhas, pagamentos (com "Enregistrer un paiement"), histórico de envios/relances, **PDF/Impression** (hoje inexistente — `InvoiceTemplate` só renderiza em tela), botão Envoyer (que envia de fato, via template). Lista: totais HT/TTC/à encaisser no topo, busca por cliente, ordenação, paginação server-side.

### 9.6 Tableau de bord `/`

Remover "Prévision Mensuelle", aba "Facturation" e a checklist simulada (BL-032). Cada KPI abre a lista filtrada. Listas com linhas clicáveis e "Voir tout". Filtro de período/temporada (o `PeriodSelector` já existe). Rail "À traiter aujourd'hui": horaires J-10 pendentes, demandes de test, faturas vencidas, avaliações a verificar, inscrições sem formador. O mockup em `docs/DASHBOARD_GESTAO_REDESIGN.md` já cobre a estrutura; ele deve ser ligado a dados reais e o `/mockup` removido.

### 9.7 Tests oraux `/tests-oraux`

**Demandes** (inbox de `test_candidates`, com "Créer la réservation" e "Rapprocher à un stagiaire") · **Réservations** (criar/editar `test_bookings`: data, idioma, formador, sponsor, preço; marcar `completed`) · **À évaluer** · **Complétées** (com "Envoyer" → `envoye`) · **Banque de phrases** (admin; com dedupe do importador órfão). Link público `/reserver-test` copiável em "Liens publics" ao lado dos de `/register`.

### 9.8 Finance consolidado

`/finance` com abas Vue d'ensemble · Analyses · Rentabilité, **um** seletor de período+temporada, **uma** definição de cada KPI (glossário), cards clicáveis, "Dépenses" real (`formation_costs` + `fixed_costs`), objetivos vindos de `seasons.revenue_target` (que hoje é gravado e não lido). Projeções por média móvel ficam em **uma** aba, rotuladas "Tendance (moyenne mobile 3 mois)".

---

## 10. Roadmap em ondas

Esforço: **P** ≤ 1 dia · **M** 2–4 dias · **G** 1–2 semanas. IDs BL-* referenciam o `BACKLOG.md`. As ondas A e B podem começar em paralelo às vagas 1–3 de outubro, pois tocam arquivos diferentes; a onda C depende de decisões da direção (§11).

### Onda A — Fundação (limpar, conectar, proteger)

| # | Item | Esforço | Arquivos-chave |
|---|---|---|---|
| A1 | Nova sidebar 2 níveis, modo `icon`, seções fixas, redirects §8.3, breadcrumbs sem links para 404 | M | `Sidebar.tsx`, `App.tsx`, `Breadcrumbs.tsx` |
| A2 | `ProtectedRoute` com `routeKey`; chaves alinhadas ao menu; página "Accès non autorisé"; `can_edit` respeitado nas ações; `is_active` verificado; `shouldCreateUser:false`; usuário sem papel bloqueado | M | `ProtectedRoute.tsx`, `route-permissions.ts`, `useAuth.ts` |
| A3 | Hook genérico `usePaginatedList` (server-side `range` + `count: 'exact'`) e componente `DataTablePager`; aplicar às 9 listas de §5.2 (BL-037) | G | `hooks/*`, páginas de lista |
| A4 | Remover/ligar os 14 botões mortos e o código morto do Anexo A e B | P | vários |
| A5 | Links cruzados: 20 arestas 📄 → ✅ da matriz §3 | M | fichas e tabelas |
| A6 | Bugs bloqueantes: `SelectItem value=""` (2), `QualiopiAudit useState` (`:273,305`), status FR vs código em `StudentDetails`, congelamento em `PartnerDetails`, invoice N+1 → join server-side | M | citados |
| A7 | Busca global: incluir parceiros, leads, pagamentos, sessões; fatura → detalhe; inscrição por nome; debounce | P | `GlobalSearch.tsx` |

### Onda B — Acesso do cliente e fichas-hub

| # | Item | Esforço |
|---|---|---|
| B1 | `inscriptions.access_token` + página pública `/suivi/:token` (RPC `security definer` com dados mínimos) + exibição/copiar em `/register` sucesso, e-mail de confirmação, lista e ficha | M |
| B2 | `student_portal_enabled` em `app_settings` substituindo a constante; convite com `inscription_id` no log; status "Invité le / Dernière connexion" (via edge function que lê `auth.users.last_sign_in_at`) | M |
| B3 | `StudentViewContext` + `/portails/stagiaire/:id/*` reutilizando `StudentLayout` e as páginas reais; apagar `StudentPortalPreview.tsx`; corrigir botão "Portail (compte lié)" | M |
| B4 | Ficha da inscrição §9.1 (pagamentos na aba Financier, faturas clicáveis, upload, "Envoyer un email", notas) | G |
| B5 | Ficha do aluno §9.2 e do formador §9.3 (Planning via inscrições — BL-041; Administratif — BL-042) | G |
| B6 | Detalhe de fatura + PDF/impressão + envio real; totais e busca por cliente na lista | G |
| B7 | Dashboard `/` §9.6 (sem previsões — BL-032; tudo clicável; rail "À traiter") | M |
| B8 | Pack de fin: envio real por e-mail (ou rótulo honesto "disponible dans le portail"), tela de sucesso com copiar/abrir enquete e certificado | P |

### Onda C — Fluxos incompletos

| # | Item | Esforço |
|---|---|---|
| C1 | Tests oraux: Demandes (inbox `test_candidates`), Réservations (CRUD `test_bookings`), atribuição, `completed`, `envoye`; link público de `/reserver-test` | G |
| C2 | Portal do formador (`FormateurLayout`, 7 páginas) + `/portails/formateur/:id/*` "voir comme" + "Inviter" na ficha | G |
| C3 | Planning unificado: decidir **um** modelo (recomendado: `sessions` + `session_enrollments` ligados a `inscriptions` e `instructors`; `instructor_sessions` vira view); atribuir inscrições; grade 24h; overflow clicável; responsivo | G |
| C4 | Satisfaction: criar/enviar/relançar enquetes em `/qualite/satisfaction`; verbatim ligado à inscrição; "Créer une réclamation" → Amélioration | M |
| C5 | Documents real: tabela `documents` (título, categoria, visibilidade staff/stagiaire/public, path no bucket privado), upload, download assinado, contadores, presença no portal | M |
| C6 | Notificações: produtores para fatura vencida, pagamento recebido, demande de test, avaliação a verificar, inscrição sem formador; página `/notifications`; ativar crons hoje `keep_active=false` (BL-007) | M |

### Onda D — Consolidação

| # | Item | Esforço |
|---|---|---|
| D1 | Finance 6 → 3 páginas com abas (§9.8); glossário de KPIs; "Dépenses" real; objetivos de `seasons.revenue_target` (BL-039); corrigir dupla contagem da tesouraria | G |
| D2 | Taxonomia única de idiomas e modalidades em tabela referencial (ou `app_settings.taught_languages`, hoje gravado e não lido) consumida por register, inscrição, pricing, sessions, intakes, filtros | M |
| D3 | Filtro de temporada global (contexto `SeasonContext`) em Inscriptions, Stagiaires, Facturation, Planning, Commercial | M |
| D4 | Journal des envois (`email_log` global, por aluno/lead/parceiro, falhas); "Envoyer un test" de qualquer template em qualquer idioma | M |
| D5 | Identidade da organização consumida por faturas e e-mails (promessa do card de Settings); upload de logo | P |
| D6 | i18n do *chrome* (sidebar, header, breadcrumbs, auth) e das páginas 100 % em francês; hoje 34 de ~190 arquivos traduzidos | G |
| D7 | Import: upsert idempotente por chave natural, export antes do purge, erros na tela (não no console), importadores de leads/parceiros/tarifs | M |
| D8 | Comercial: `loss_reason`, `assigned_to`, `estimated_students` na conversão, datas do projeto, delete de lead, ligação Moniteurs ↔ `ski_monitors` | M |

---

## 11. Decisões que dependem da direção

1. **Lien de suivi público sem login** (B1) é aceitável em termos de dados expostos (status, datas, horário, "documents disponibles", "solde: réglé / à régler")? Recomendação: sim, sem valores nem dados de terceiros; o detalhe fica atrás do login do portal.
2. **Modelo único de planning** (C3): sessões coletivas com capacidade, ou uma "sessão" = uma inscrição individual com blocos de horas? A escola trabalha principalmente com grupos matin/après-midi por estação; recomendação: `sessions` com `session_enrollments`.
3. **O formador deve ver os dados do aluno** além do teste oral (contato, nível de entrada, expectativas)? Define o escopo RLS de C2.
4. **Descongelar prospecção de monitores** como configuração (`app_settings`) em vez de constante + migration? Hoje 2/3 daquela página são inertes.
5. **Objetivos financeiros** por temporada: quem preenche `revenue_target`, e os objetivos de "stagiaires" e "marge" existem? (BL-039)
6. **Finance: quais dos 6 painéis atuais realmente são consultados?** A consolidação D1 pressupõe que Analyses/Rentabilité/Trésorerie são leitura ocasional.

---

## 12. Critérios de aceite (como saber que deu certo)

- De qualquer ficha (inscrição, aluno, formador, parceiro, fatura, pagamento) chega-se a qualquer entidade relacionada em **1 clique**.
- Após criar uma inscrição (público ou back-office), o staff **vê e copia** o link de acompanhamento e o status do portal na lista e na ficha, e o cliente recebe os dois por e-mail.
- Um admin abre "Voir comme" e vê **exatamente** a tela do aluno / do formador, com o mesmo componente que eles usam.
- Nenhum botão visível sem ação; nenhuma lista truncada sem paginação; nenhum KPI sem destino ou com rótulo que não corresponde ao cálculo.
- Um usuário `user` sem permissão em uma chave não vê o item **nem** acessa a rota por URL.
- Sidebar com no máximo 2 níveis, todos os destinos visíveis sem clique de abertura, chegando a qualquer página em 1 clique (2 com aba).

---

## Anexo A — Controles sem ação (remover ou ligar)

| Arquivo:linha | Controle |
|---|---|
| `src/pages/Inscriptions.tsx:351-354` | `Exporter` |
| `src/pages/Inscriptions.tsx:405-407` | ícone `Filter` |
| `src/pages/Inscriptions.tsx:600-606` | Précédent/Suivant `disabled` |
| `src/pages/Students.tsx:197-200` | `Exporter` |
| `src/pages/Students.tsx:225-227` | ícone `Filter` |
| `src/pages/Students.tsx:328-333`, `:400-405` | `Mail`, `Phone` por linha |
| `src/pages/Students.tsx:419-425` | Précédent/Suivant `disabled` |
| `src/pages/students/StudentDetails.tsx:169-172` | `Envoyer un email` |
| `src/components/students/StudentPortalAccessCard.tsx:145-152` | `Portail (compte lié)` (abre e é expulso) |
| `src/pages/Documents.tsx:156,166,172,232-241` | upload, busca, categorias, ações de linha |
| `src/components/layout/TopHeader.tsx:157-166` | avatar de perfil |
| `src/pages/Sessions.tsx:405-407` | `+N autres` no mês |
| `src/components/sessions/UnassignedSidebar.tsx:56` | `UserPlus` nunca habilitável |
| `src/pages/Invoices.tsx:658-666` | reset de filtros como funil sem rótulo |
| `src/pages/qualite/QualiopiAudit.tsx:195` | linhas `cursor-pointer` sem ação para não-admin |
| `src/pages/qualite/AuditHistory.tsx:13,92` | ícone `Search` sem campo de busca |
| `src/pages/Settings.tsx:204-206` | "Voir les envois" → templates, não envios |
| `src/pages/moniteurs/MoniteursSki.tsx` | `handleSend(true)` (dry-run) sem botão |
| `src/components/dashboard/UpcomingClasses.tsx:115-117` | "Gérer toutes les sessions" |

## Anexo B — Código morto (remover)

`src/pages/Classes.tsx` (309 l.) · `src/components/endpack/CertificatePreview.tsx` (229 l.) · `src/components/registration/TrainingConfigStep.tsx` (194 l.) · `src/components/dashboard/UpcomingClasses.tsx` · `src/components/dashboard/RecentInscriptions.tsx` (versão melhor da lista do dashboard, não usada — **reaproveitar**) · rota `/admin/import-phrases` · rota `/mockup/dashboard-gestao` (mover para dentro de `ProtectedRoute` ou remover após ligar o redesign) · hooks exportados e nunca chamados: `useDeleteSession`, `useDeleteInstructor`, `useDeleteLead`, `useDeleteSkiMonitor`, `useUpdatePricingRule`, `useInvoiceWithDetails`, `useAuth().signUp` · campos calculados e nunca exibidos: `stats.upcomingTests.confirmed`, `averageScore` (aluno), `inscription_count` (aluno), `seasons.revenue_target`, `app_settings.taught_languages`.

## Anexo C — Fontes

Relatórios de auditoria por módulo produzidos em 16/09/2026 sobre `src/pages/**`, `src/components/**`, `src/hooks/**`, `src/lib/**`, `supabase/functions/**`, `supabase/migrations/**`; `docs/ETAT_APP_2026-09.md`; `docs/BACKLOG.md`; `docs/DASHBOARD_GESTAO_REDESIGN.md`; `docs/POINT_C1_ROLE_FORMATEUR.md`; `docs/POINT_PORTAIL_PLACEHOLDER.md`.
