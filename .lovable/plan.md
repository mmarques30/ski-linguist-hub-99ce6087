
# Eliminar Sub-abas Internas -- Usar Filtros em Painel Unico

## Problema
Duas paginas do modulo Finance possuem sub-abas internas que fragmentam a visualizacao dos dados em visoes separadas. O objetivo e unificar tudo em um unico painel com filtros, mostrando as informacoes comparativas lado a lado.

## Paginas afetadas

### 1. `src/pages/finance/FinanceChargesFixes.tsx`
**Sub-abas atuais:** "Tableau de bord" | "Charges du mois" | "Modèles récurrents"

**Nova estrutura (painel unico):**
- **Topo:** 4 KPI cards (Total impaye, En retard, Ce mois, Mensuel prevu) -- mantidos
- **Filtro de mes:** Select de mes movido para o header da pagina (ao lado do titulo), funciona como filtro global
- **Secao 1 - Grid 2 colunas:**
  - Coluna esquerda: Repartition des impayes (PieChart) -- do antigo tab "dashboard"
  - Coluna direita: Charges en retard (lista) -- do antigo tab "dashboard"
- **Secao 2 - Charges du mois:** Tabela de charges do mes selecionado com botao "Generer les charges" no header -- do antigo tab "month"
- **Secao 3 - Evolution des 6 derniers mois:** Barras de progresso pagas/impagas -- do antigo tab "dashboard"
- **Secao 4 - Modeles recurrents:** Tabela de templates com switch actif/inactif e edicao de montant -- do antigo tab "templates"

Tudo visivel em scroll vertical, sem abas.

### 2. `src/pages/finance/FinanceAnalyses.tsx`
**Sub-abas atuais:** "Par activité" | "Par client/ESF" | "Par formateur"

**Nova estrutura (painel unico):**
- **Topo:** 3 KPI cards (Nb activites, Ticket moyen, CA mensuel moyen) -- mantidos
- **PeriodSelector:** Mantido como filtro global
- **Secao 1 - CA par type d'activite:** Tabela com colunas CA N, CA N-1, Evolution, % du total + botao Export CSV
- **Secao 2 - CA par client/ESF:** Tabela com colunas CA HT, Nb factures + botao Export CSV
- **Secao 3 - Balance formateurs:** Tabela com colunas Total du, Paye, A payer + botao Export CSV

As 3 tabelas ficam empilhadas verticalmente, cada uma dentro de seu proprio Card, todas visiveis simultaneamente. Sem abas.

## Resultado
- Todas as informacoes comparativas visiveis no mesmo painel
- Navegacao simplificada: sem cliques extras para trocar entre categorias
- Filtros (periodo, mes) aplicados globalmente a todas as secoes
- Layout em scroll vertical, organizado por secoes com Cards
