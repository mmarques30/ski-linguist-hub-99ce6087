

# Refonte Completa do Modulo Finance - Alinhamento com Referencia 21st.dev

## Problema
O layout atual do modulo Finance nao segue o design de referencia fornecido. As paginas estao funcionais mas visualmente distantes do objetivo: cards sem icones de contexto, sem secao "Receitas vs Despesas" com barras horizontais customizadas, sem "Metas do Trimestre" com barras de progresso, e sub-paginas sem coerencia visual.

## Arquivos a modificar

### 1. `src/pages/finance/FinanceDashboard.tsx` -- Reestruturacao principal

O dashboard sera completamente reorganizado para seguir a estrutura da referencia:

**Secao 1 - KPI Cards (4 em linha):**
- CA Facture, Encaisse, A payer formateurs, Marge brute
- Cada card tera: titulo, valor grande, badge com porcentagem de evolucao (seta + cor verde/vermelha), descricao curta
- Usar o componente `FinanceKPICard` atualizado

**Secao 2 - Grid 2 colunas:**
- **Coluna esquerda: "Receitas vs Despesas"** -- Grafico de barras horizontais customizado em div (nao recharts), exatamente como na referencia:
  - Cada mes: nome do mes a esquerda, valores a direita, duas barras horizontais (Gold para receitas, Navy para despesas)
  - Legenda integrada no header do card
  - Dados vindos de `caByMonth` (receitas) e custos agregados (despesas)
- **Coluna direita: "Repartition par activite"** -- PieChart com cores da marca e labels

**Secao 3 - "Metas do Trimestre":**
- Card com 3 barras de progresso (cor Gold):
  - Receita Trimestral: valor atual / objetivo
  - Novos Stagiaires: contagem / objetivo
  - Marge cible: porcentagem atual / objetivo
- Valores calculados a partir dos KPIs existentes

**Secao 4 - Tabelas (grid 2 colunas):**
- Factures en attente (existente, manter)
- Formateurs a payer (existente, manter)

**Remocoes:**
- Remover o grafico "Comparaison CA mensuel N vs N-1" (BarChart redundante, ja existe no LineChart)
- Remover o `AddCostDialog` trigger do dashboard (disponivel em Rentabilite)

### 2. `src/components/finance/FinanceKPICard.tsx` -- Adicionar suporte a icone e badge de evolucao

Atualizar o componente para aceitar um icone de contexto (DollarSign, Users, etc) que aparece no canto superior direito do card, como na referencia. O badge de evolucao tera fundo colorido (verde/vermelho com opacidade) em vez de texto simples.

Estrutura visual do card:
```text
+----------------------------------+
| Titulo              [Icone]      |
| Valor Grande                     |
| [Badge +X.X%]  descricao        |
+----------------------------------+
```

### 3. `src/pages/finance/FinanceRentabilite.tsx` -- Ajustes visuais

- Adicionar 3 MetricCards no topo (Marge brute, Couts directs, Charges fixes) com icones e badges de evolucao, substituindo os cards simples atuais
- Manter a tabela de detalhe por formacao
- Cores de marge: Gold para "Excellent", badge secundario para "Correct", destructive para "Faible"

### 4. `src/pages/finance/FinanceTresorerie.tsx` -- Adicionar graficos

- Adicionar 4 MetricCards no topo: Solde actuel, Entrees prevues, Sorties prevues, Solde previsionnel
- Adicionar um LineChart "Projection de Tresorerie" (linha Gold para solde, area com opacidade) abaixo dos cards
- Manter a tabela de fluxos existente

### 5. `src/pages/finance/FinanceChargesFixes.tsx` -- Harmonizacao

- Os 4 cards do topo no tab "dashboard" estao OK (ja usam cores da marca)
- Manter estrutura atual, apenas garantir coerencia visual

### 6. `src/pages/finance/FinanceAnalyses.tsx` -- Adicionar MetricCards

- Adicionar 3 MetricCards no topo: Nb formations, Ticket moyen, CA mensuel moyen
- Calcular a partir dos dados existentes de `caByType`
- Manter tabs de analise por atividade/cliente/formador

## Detalhes tecnicos

### Componente FinanceKPICard atualizado
```text
Props:
- title: string
- value: string | number
- subtitle: string (descricao curta)
- evolution: number (porcentagem)
- icon: LucideIcon (opcional, renderizado no canto)
- variant: 'gold' | 'navy' | 'default'
- formatAsPrice: boolean
```

### Barras horizontais customizadas (Receitas vs Despesas)
Implementacao em div com Tailwind, sem recharts:
- Para cada mes, calcular a porcentagem relativa ao maximo
- Barra Gold (receitas) e barra Navy (despesas)
- Hover com valores formatados

### Metas do Trimestre
Dados calculados:
- Receita Trimestral: soma do CA dos 3 ultimos meses vs objetivo configuravel (hardcoded inicialmente)
- Novos Stagiaires: contagem de inscricoes no trimestre
- Marge cible: margePourcent dos KPIs

### Cores constantes
```text
BRAND_GOLD = '#FCA311'  ou  hsl(40, 97%, 54%)
BRAND_NAVY = '#14213D'  ou  hsl(219, 52%, 16%)
BRAND_GRAY = '#E5E5E5'
```

## Resultado esperado
- Dashboard Finance com visual profissional, denso e informativo
- Todas as 5 sub-paginas coerentes visualmente
- Sem emojis, sem icones decorativos desnecessarios
- Cores exclusivamente da paleta da marca
- Layout que funciona bem mesmo com dados zerados (estado vazio elegante)

