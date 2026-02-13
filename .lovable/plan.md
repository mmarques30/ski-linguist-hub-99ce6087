
# Reorganizar Analyses com Tabs internas

## Objetivo
Separar a pagina Analyses em 2 abas internas (Tabs): uma para o dashboard visual e outra para as tabelas detalhadas. Remover os cards de exportacao CSV das tabelas "CA par type" e "CA par client".

## Alteracoes em `src/pages/finance/FinanceAnalyses.tsx`

### 1. Adicionar Tabs (Radix UI)
- Importar `Tabs, TabsList, TabsTrigger, TabsContent` de `@/components/ui/tabs`
- Colocar o `PeriodSelector` FORA das tabs (visivel em ambas)
- Criar 2 abas:
  - **"Dashboard"** (default): contem KPI Grid, RevenueChart, RevenueSources + QuarterlyForecast
  - **"Tableaux"**: contem as 3 tabelas (CA par activite, CA par client, Balance formateurs)

### 2. Remover botoes Export CSV
- Remover o botao "Export CSV" do card "CA par type d'activite" (linhas 117-119)
- Remover o botao "Export CSV" do card "CA par client / ESF" (linhas 177-179)
- Manter o botao "Export CSV" apenas no card "Balance formateurs"

### 3. Estrutura final
```text
Titre: Analyses Financieres
PeriodSelector (dropdown)
[Dashboard] [Tableaux]    <-- TabsList

-- Tab Dashboard --
  KPI Grid (2x3)
  RevenueChart
  RevenueSources | QuarterlyForecast

-- Tab Tableaux --
  CA par type d'activite (sem Export CSV)
  CA par client / ESF (sem Export CSV)
  Balance formateurs (com Export CSV)
```

### 4. Simplification CardHeader des tables sans export
- Les CardHeader des tables sans export passent d'un layout `flex-row justify-between` a un simple CardHeader standard

## Fichier modifie
- `src/pages/finance/FinanceAnalyses.tsx` uniquement
