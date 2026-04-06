

# Correction des chaines portugaises dans le module Finance

## Probleme
6 fichiers finance contiennent des chaines hardcodees en portugais melangees avec du francais. Aucun de ces fichiers n'utilise le systeme i18n existant (`useLanguage` / `t`).

## Chaines a corriger

| Fichier | Portugais | FR | PT-BR | EN |
|---|---|---|---|---|
| **FinanceDashboard.tsx** | "Receitas vs Despesas" | Recettes vs Depenses | Receitas vs Despesas | Revenue vs Expenses |
| | "Receitas" (legende) | Recettes | Receitas | Revenue |
| | "Despesas" (legende) | Depenses | Despesas | Expenses |
| | "Receita Trimestral" | CA Trimestriel | Receita Trimestral | Quarterly Revenue |
| | "Novos Stagiaires" | Nouveaux stagiaires | Novos Estagiarios | New Trainees |
| | "Metas do Trimestre" | Objectifs du trimestre | Metas do Trimestre | Quarterly Goals |
| **RevenueChart.tsx** | "Receita e Projecoes" | CA et Projections | Receita e Projecoes | Revenue & Projections |
| | "Receita Real" | CA Reel | Receita Real | Actual Revenue |
| | "Projecao" | Projection | Projecao | Projection |
| **RevenueSources.tsx** | "Fontes de Receita" | Sources de revenus | Fontes de Receita | Revenue Sources |
| **QuarterlyForecast.tsx** | "Previsao Trimestral" | Prevision Trimestrielle | Previsao Trimestral | Quarterly Forecast |
| | "Projection pour Q..." | Projection pour Q... | Projecao para Q... | Forecast for Q... |
| **AnalysesKPIGrid.tsx** | "Receita Mensal" | CA Mensuel | Receita Mensal | Monthly Revenue |

## Approche

Pour chaque fichier :
1. Importer `useLanguage` depuis `@/contexts/LanguageContext`
2. Definir un objet `translations` local avec les 3 langues pour chaque chaine
3. Remplacer les chaines hardcodees par `t(translations.xxx)`

## Fichiers modifies (6)

1. `src/pages/finance/FinanceDashboard.tsx` - 6 chaines
2. `src/components/finance/RevenueChart.tsx` - 3 chaines
3. `src/components/finance/RevenueSources.tsx` - 1 chaine
4. `src/components/finance/QuarterlyForecast.tsx` - 2 chaines
5. `src/components/finance/AnalysesKPIGrid.tsx` - 1 chaine
6. `src/pages/admin/TestingChecklist.tsx` - 4 descriptions en portugais (bonus)

Aucun changement de structure, uniquement remplacement de texte par appels `t()`.

