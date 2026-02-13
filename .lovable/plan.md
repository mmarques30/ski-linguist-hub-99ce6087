

# Melhorar Interface de Analyses Financieres

## Referencia Visual
As imagens mostram um layout moderno com:
- 2 linhas de 3 KPI cards com badges de evolucao em laranja
- Grafico de linhas "Receita e Projecoes" (linha solida laranja = real, tracejada escura = projecao)
- 2 cards lado a lado: "Fontes de Receita" (lista por tipo) e "Previsao Trimestral" (projecao por mes)

## Estrutura Nova do `FinanceAnalyses.tsx`

### Secao 1 - KPI Cards (2 linhas x 3 cards)
**Linha 1:**
- **CA par Activite** - Total CA do periodo, com evolucao vs N-1, subtitulo "Formations"
- **CA par Client** - Ticket moyen (CA / nb clients), com evolucao, subtitulo "ticket moyen"
- **CA par Formateur** - Moyenne mensuelle formateur, com evolucao, subtitulo "moyenne mensuelle"

**Linha 2:**
- **Receita Mensal** - CA mensuel moyen, com evolucao, subtitulo com mes de referencia
- **Ticket Moyen** - Valor medio por factura, com evolucao, subtitulo "por aluno"
- **Taxa de Conversao** - Ratio faturas pagas/emitidas, com evolucao, subtitulo "leads para alunos"

Todos os cards usam `FinanceKPICard` com badge de evolucao (estilo laranja existente).

### Secao 2 - Grafico "Receita e Projecoes"
- `LineChart` do recharts com 2 linhas:
  - Linha solida laranja: CA real por mes (dados de `useCAByMonth`)
  - Linha tracejada escura: projecao simples (media movel dos ultimos 3 meses projetada para frente)
- Eixo X: meses (Jan, Fev, Mar...)
- Eixo Y: valores em EUR
- Legenda: "Receita Real" / "Projecao"

### Secao 3 - Grid 2 colunas
**Coluna esquerda - "Fontes de Receita":**
- Card com subtitulo "Distribution par type de cours"
- Lista simples (sem tabela) com icone + nome + valor alinhado a direita
- Dados de `useCAByType`

**Coluna direita - "Previsao Trimestral":**
- Card com subtitulo "Projection pour Q[X] [ano]"
- Lista dos 3 proximos meses com valores projetados
- Linha total no final
- Dados calculados a partir da media dos meses anteriores

### Secao 4 - Tabelas detalhadas (mantidas)
As 3 tabelas existentes (CA par activite, CA par client, Balance formateurs) ficam abaixo, empilhadas, com Export CSV.

## Dados adicionais necessarios
- `useCAByMonth(startDate, endDate, true)` - ja existe, sera adicionado ao componente
- `useFinancialKPIs(startDate, endDate, true)` - ja existe, sera adicionado para KPIs extras
- Projecao: calculo local baseado na media movel dos dados existentes

## Detalhes Tecnicos
- Arquivo modificado: `src/pages/finance/FinanceAnalyses.tsx`
- Imports adicionais: `LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend` de recharts
- Imports adicionais: `useCAByMonth, useFinancialKPIs` de useFinancialDashboard
- Icones: `DollarSign, Users, Target, TrendingUp, BookOpen, UserCheck` de lucide-react
- Cores: BRAND_GOLD e BRAND_NAVY (mesmo padrao do FinanceDashboard)
- Nenhuma tabela ou migration de banco necessaria

