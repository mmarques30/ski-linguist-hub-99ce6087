# Navegação em 3 níveis — submenus correlatos (22/09/2026)

Execução do pedido de produto: **agrupar os dados de forma inteligente**, criando
submenus correlacionados aos menus em vez de uma lista plana de 26 links.

Referência: `docs/PLANO_PRODUTO_2026-09.md` §8. Este documento **altera** o
princípio 8.1.1 ("dois níveis, nunca três"): a sub-navegação continua existindo
dentro da página (abas), mas agora **também** aparece na sidebar, porque o que o
usuário não vê no menu ele não descobre.

---

## 1. O problema

A sidebar anterior tinha 6 seções e 26 links de primeiro nível, todos visíveis ao
mesmo tempo. Consequências medidas na leitura do código:

- Destinos irmãos ficavam lado a lado sem hierarquia (`Factures`, `Paiements`,
  `Pilotage`, `Trésorerie` — quatro entradas planas para um só assunto).
- Sub-páginas reais ficavam **invisíveis**: `/finance/analyses`,
  `/finance/rentabilite`, `/finance/charges-fixes`, `/admin/import-phrases` só
  eram alcançáveis por abas internas ou digitando a URL.
- Páginas funcionais ficavam fora do menu por falta de lugar
  (`/formation/sessions`, com calendário, criação e painel de detalhe completos).
- As abas internas não estavam na URL: não dava para linkar, favoritar ou
  mandar "abra o journal des envois" para alguém.

## 2. A nova árvore

Fonte única: `src/lib/navigation.ts` (`NAV_SECTIONS`). A sidebar apenas renderiza.

```
Tableau de bord                          /

OPÉRATIONS
  Inscriptions                     ▾
    · Toutes les inscriptions            /inscriptions
    · À traiter                          /inscriptions?status=en_attente
    · Constitution des groupes           /inscriptions/schedule-validation
    · Terminées                          /inscriptions?status=terminee
  Stagiaires                             /students
  Formateurs                             /formateurs
  Planning & sessions                    /formation/sessions      ← reentra no menu
  Tests & évaluations              ▾
    · Tests de niveau                    /tests
    · Évaluations orales                 /formateur/evaluations
    · Phrases (admin)                    /admin/phrases

COMMERCIAL & PARTENAIRES
  Pipeline commercial              ▾
    · Pipeline                           /gestion/commercial
    · Analyses                           /gestion/commercial?tab=analytics
  Partenaires                            /gestion/partenaires
  Moniteurs de ski  [gelé]         ▾
    · Dates de formation                 /gestion/moniteurs
    · Écoles de ski                      /gestion/moniteurs?tab=ecoles
    · Base moniteurs                     /gestion/moniteurs?tab=base

FINANCE
  Facturation                      ▾
    · Factures                           /invoices
    · À vérifier                         /invoices?status=a_verifier
    · Paiements                          /finance/payments
  Pilotage                         ▾
    · Vue d'ensemble                     /finance
    · Analyses                           /finance/analyses        ← saía do menu
    · Rentabilité                        /finance/rentabilite     ← saía do menu
  Trésorerie                       ▾
    · Prévisionnel                       /finance/tresorerie
    · Charges fixes                      /finance/tresorerie?tab=charges

QUALITÉ
  Satisfaction                     ▾
    · Statistiques                       /satisfaction-stats
    · Comparaison                        /satisfaction-stats?tab=comparison
  Amélioration                           /amelioration
  Qualiopi                         ▾
    · Audit Qualiopi                     /qualite/audit
    · Journal d'audit                    /qualite/historique

PORTAILS
  Espace stagiaire                       /portails/stagiaire
  Espace formateur                       /portails/formateur

ADMINISTRATION (admin)
  Communications                   ▾
    · Modèles d'emails                   /admin/emails
    · Journal des envois                 /admin/emails?tab=journal
    · Modèles documents                  /admin/registration-documents
  Données & recette                ▾
    · Import                             /admin/import
    · Import de phrases                  /admin/import-phrases    ← saía do menu
    · Tests QA                           /admin/testing
  Configuration                    ▾
    · Organisation                       /settings
    · Saisons                            /admin/seasons
    · Langues & modalités                /settings?tab=languages
    · Notifications                      /settings?tab=notifications
    · Intégrations                       /settings?tab=integrations
    · Utilisateurs                       /admin/users
```

**Contagem** : 26 links planos → 20 linhas de primeiro nível, das quais 11 são
pais recolhíveis que abrem 36 destinos. Nada foi removido; o que estava
escondido passou a ser navegável.

## 3. Regras aplicadas

1. **Todo submenu é uma URL compartilhável.** Nenhum item do menu abre uma aba
   puramente local: ou é uma sub-rota, ou é um `?tab=` / `?status=` que a página
   respeita e restaura ao recarregar.
2. **O pai leva ao primeiro filho.** Clicar no pai (ou clicar nele com a sidebar
   recolhida em modo ícone) navega para o primeiro submenu **que o usuário tem
   permissão de ver** — nunca para uma página bloqueada.
3. **Permissão por folha.** Cada destino resolve sua própria chave
   (`navRouteKey`); um pai cujos filhos foram todos filtrados desaparece, e uma
   seção sem itens desaparece.
4. **Submenus recolhidos por padrão, um grupo aberto por vez.** Clicar no pai
   abre o dele e fecha o anterior; mudar de página abre o grupo da página
   atual. Nada fica aberto acumulando.
5. **O item ativo é o mais específico.** Entre irmãos que apontam para a mesma
   página, ganha aquele cujos parâmetros de URL batem
   (`/inscriptions?status=terminee` vence `/inscriptions` quando o filtro está
   aplicado) — lógica em `matchScore` / `activeChildHref`, coberta por testes.
6. **Modo ícone preservado.** Recolhida, a sidebar continua sendo um trilho de
   ícones com tooltip; os submenus somem e o pai vira link simples.
7. **Hierarquia visual por afordância.** Primeiro nível tem superfície e
   contorno em repouso — lê-se como botão, não como texto fixo; o item da
   página atual ganha barra amarela. Segundo nível não tem superfície em
   repouso, só no hover, com texto mais discreto e guia de indentação:
   clicável, mas subordinado.

## 4. O que mudou no código

| Arquivo | Mudança |
|---|---|
| `src/lib/navigation.ts` | **novo** — árvore declarativa + `matchScore`, `activeChildHref`, `isItemActive`, `navRouteKey` |
| `src/hooks/useTabParam.ts` | **novo** — aba de página sincronizada com `?tab=` (apaga o parâmetro ao voltar à aba padrão) |
| `src/components/layout/Sidebar.tsx` | reescrito: só renderiza a árvore, filtra por permissão e controla a abertura (acordeão) |
| `src/lib/chrome-i18n.ts` | `CHROME_NAV_GROUPS` — rótulos FR / PT-BR / EN dos pais e submenus |
| `src/pages/admin/Emails.tsx` | abas Modèles / Journal na URL |
| `src/pages/Settings.tsx` | abas Organisation / Notifications / Intégrations / Langues na URL |
| `src/pages/moniteurs/MoniteursSki.tsx` | abas Dates / Écoles / Base na URL |
| `src/pages/commercial/CommercialDashboard.tsx` | abas Pipeline / Analyses na URL |
| `src/pages/SatisfactionStats.tsx` | abas Statistiques / Comparaison na URL |
| `src/lib/route-permissions.ts` | chaves para `/formation/sessions`, `/classes`, `/documents` |
| `src/lib/navigation-sousmenus.test.ts` | **novo** — 17 testes: forma da árvore, rotas existentes, permissões, estado ativo, abas na URL |

Testes das ondas anteriores (`usabilite-navigation`, `vague-a-…`, `vague-c-…`)
foram reescritos para verificar o **modelo** `NAV_SECTIONS` em vez de procurar
strings no JSX da sidebar — não quebram mais a cada mudança de layout.

## 5. Fora do menu, de propósito

- `/documents` — a página ainda não entrega documentos reais (C5 do plano).
- `/notifications` — fica no sino do header, como já estava.
- `/mockup/*`, `/students/:id/portal-preview` — internos / substituídos pelos
  portais "Assister".

## 6. Próximos passos sugeridos

1. Renomear as rotas conforme §8.3 do plano (`/students` → `/stagiaires`,
   `/gestion/*` → raiz, `/formateur/evaluations` → `/tests-oraux`) com redirects
   de uma temporada. Agora é barato: os caminhos estão em um só arquivo.
2. Levar as mesmas seções e rótulos para `/admin/users` (edição de permissões),
   para que o admin veja a árvore que está liberando.
3. Contadores nos submenus de fila (`À traiter`, `À vérifier`).
4. Busca global com "aller à…" alimentada por `NAV_SECTIONS`.
