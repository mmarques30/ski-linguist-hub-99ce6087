

# Melhorar Rentabilite com Dashboard visual + Tabs

## Objetivo
Reorganizar a pagina Rentabilite em 2 abas internas (como feito em Analyses): uma aba "Dashboard" com KPIs visuais, grafico e cards de custos, e uma aba "Tableaux" com a tabela detalhada existente.

## Estrutura Final

```text
Titre: Rentabilite des Formations
PeriodSelector (dropdown) + Botao "Ajouter un cout"
[Dashboard] [Tableaux]    <-- TabsList

-- Tab Dashboard --
  6 KPI Cards (2x3)
  Grafico "Couts et Projections" (LineChart)
  2 cards lado a lado: Couts par Categorie | Prevision de Couts

-- Tab Tableaux --
  Tabela detalhada por formacao (existente, sem alteracao)
```

## Detalhes por secao

### Secao 1 - KPI Cards (2 linhas x 3)
**Linha 1:**
- **Marge Brute** - margeMoyenne (%), evolucao badge, subtitulo "CA - Couts directs"
- **Couts Directs** - coutsTotal (EUR), subtitulo "Formateurs + materiel"
- **CA Formations** - caTotal (EUR), subtitulo "total mensuel"

**Linha 2:**
- **Depenses Mensuelles** - media mensal de custos (coutsTotal / nb meses do periodo)
- **Cout par Aluno** - custo medio por formacao (coutsTotal / nb formations)
- **Margem de Lucro** - margeMoyenne (%), subtitulo "vs mes anterior"

Dados calculados localmente a partir do `useFormationProfitability` existente.

### Secao 2 - Grafico "Couts et Projections"
- `LineChart` (recharts) com 2 linhas:
  - Linha solida vermelha/laranja: custos reais agrupados por mes (a partir dos dados de formations)
  - Linha tracejada laranja: projecao (media movel dos ultimos 3 meses)
- Eixo X: meses, Eixo Y: EUR

### Secao 3 - Grid 2 colunas
**Coluna esquerda - "Couts par Categorie":**
- Card com lista: Formateur, Hebergement, Deplacement, Salle, Autres
- Cada item com nome, barra de progresso proporcional, valor EUR
- Dados agregados de todas as formations do periodo

**Coluna direita - "Prevision de Couts":**
- Card com projecao dos proximos 3 meses (media movel)
- Linha total + badge "Lucro Projete Q[X]"

### Tab Tableaux
- Tabela detalhada existante (linhas 124-228 do ficheiro atual) movida para esta aba sem alteracao

## Ficheiros

### Novos componentes
- `src/components/finance/RentabiliteDashboard.tsx` - contem KPIs + grafico + cards visuais
- `src/components/finance/CostsByCategory.tsx` - card "Couts par Categorie" com barras
- `src/components/finance/CostForecast.tsx` - card "Prevision de Couts" trimestral

### Ficheiro modificado
- `src/pages/finance/FinanceRentabilite.tsx` - adicionar Tabs, mover tabela para tab Tableaux, adicionar RentabiliteDashboard na tab Dashboard

## Detalhes tecnicos
- Imports: `Tabs, TabsList, TabsTrigger, TabsContent` de `@/components/ui/tabs`
- Imports recharts: `LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend`
- Calculos de custos por mes: agrupar `formations` por `start_date.substring(0,7)` e somar `couts_totaux`
- Calculos de custos por categoria: somar `cout_formateur`, `cout_hebergement`, etc. de todas as formations
- Projecao: media movel dos ultimos 3 meses projetada para os 3 proximos
- Cores: BRAND_GOLD (`hsl(var(--fli-yellow))`) para linhas solidas, vermelho para custos reais
- Nenhuma migration de banco necessaria

