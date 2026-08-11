# Redesign do Dashboard de Gestão — avaliação e proposta

Documento de apoio ao mockup de validação disponível em `/mockup/dashboard-gestao`.

Escopo: a tela da rota `/`, hoje renderizada por
`src/components/dashboard/DashboardGestao.tsx`.

---

## 1. Avaliação da tela atual

### 1.1 Responsividade

| Ponto | Situação atual | Impacto |
| --- | --- | --- |
| Cabeçalho | `flex items-center justify-between` sem `flex-wrap` | Título e badge "Atualizado agora" se comprimem e colidem em telas estreitas |
| Grid de KPIs | `md:grid-cols-2 lg:grid-cols-4` | Salta de 1 para 2 colunas só a partir de 768px; nenhum passo em `sm` |
| Abas | `grid-cols-4` com rótulos em `hidden sm:inline` | Abaixo de 640px sobram apenas ícones, sem rótulo — navegação ambígua |
| Linhas das listas | `flex items-center justify-between` sem wrap | Nome longo + data + badge estouram a linha no celular |
| Checklist de preparação | `grid-cols-2` fixo | Duas colunas apertadas mesmo em 360px |
| Tabelas | Não existem; tudo é lista `div` | Sem estratégia tabela → cartão, e sem colunas de valor |

### 1.2 Análise de negócio

- **Apenas 4 indicadores, todos de contagem operacional.** Não há margem,
  rentabilidade, ticket médio, taxa de conversão, ocupação de turma,
  satisfação nem posição de caixa/recebíveis.
- **Números sem comparação.** Nenhum KPI mostra variação contra período
  anterior, então nada é acionável: 148 inscrições é bom ou ruim?
- **Sem filtro de período.** O app tem temporadas (`seasons`) e um
  `PeriodSelector` no módulo financeiro, mas o dashboard fixa 30 dias / 7 dias /
  mês corrente no próprio hook.
- **Nenhum gráfico**, apesar de `recharts` já ser dependência e o módulo
  financeiro usá-lo.
- **Sem visão de processo.** Leads, testes, inscrições, turmas, faturas e
  pagamentos aparecem como contagens isoladas; não se vê onde o funil perde.

### 1.3 Objetividade dos dados

- **Progresso de preparação é heurística fictícia.** Em
  `DashboardGestao.tsx` os quatro checks derivam da contagem de alunos
  (`data.count >= 1`, `>= 2`) e não de registros reais — o percentual exibido
  induz a erro.
- **"Previsão Mensal" não é previsão.** O hook soma `invoices.amount_ttc` do mês
  corrente, isto é, o **já faturado**. O rótulo diverge do dado.
- **Turmas são agrupadas por idioma**, não pela entidade real `sessions`.
- **Sem exceções em destaque.** Faturas vencidas, testes a avaliar e turmas sem
  formador não aparecem, embora existam em banco.
- **Abas escondem 3/4 da informação** a cada momento — densidade baixa demais
  para uma tela de direção.

### 1.4 Reaproveitamento

`StatCard`, `FinanceKPICard` e `RecentInscriptions` já existem e não são usados:
o dashboard reimplementa a lista de inscrições inline. `UpcomingClasses` é um
stub com array vazio e um botão sem destino.

---

## 2. Estrutura proposta

A tela passa a ler de cima para baixo como um caminho de decisão:

> **Como estamos?** → **De onde vem a receita?** → **Onde o funil perde?** →
> **O que eu preciso resolver hoje?**

| Zona | Conteúdo | Pergunta que responde |
| --- | --- | --- |
| **0. Barra de comando** | Título, temporada, seletor de período (Hoje / 7 dias / Mês / Trimestre / Temporada), exportar, tema | Qual recorte estou olhando? |
| **1. Faixa de KPIs** | Receita faturada · Margem líquida · Meta da temporada (medidor) · Novas inscrições — todos com variação vs. período anterior | Como estamos? |
| **2. Receita** | Rosca de composição por atividade + ticket médio + taxa de conversão + área de CA vs. custos diretos | De onde vem e quanto sobra? |
| **3. Funil** | Leads → Testes → Inscrições → Turmas ativas → Faturadas → Recebidas, com conversão etapa a etapa | Onde o processo perde? |
| **4. Operação** | Tabela ordenável de inscrições recentes + preparação de turmas com checklist real | O que está entrando e o que trava? |
| **5. Acompanhamento** | Exceções a tratar, satisfação, atividade recente, carga da equipe | O que exige decisão agora? |

### 2.1 Nada é perdido

Todo indicador da tela atual continua presente:

| Hoje | No redesign |
| --- | --- |
| Novas Inscrições (total + confirmadas) | KPI 4, com confirmadas/pendentes e variação |
| Testes Agendados | Etapa "Testes programados" do funil + alerta "Testes a avaliar" |
| Previsão Mensal | KPI 1 (receita faturada) + medidor de meta + área CA vs. custos — com rótulos corretos |
| Turmas Ativas | Etapa "Formações ativas" do funil + card de preparação |
| Aba Inscrições | Zona 4, tabela ordenável com valor e código |
| Aba Testes | Funil + rail de exceções |
| Aba Preparação | Zona 4, com checklist ligado a registros reais |
| Aba Faturamento | Zona 2 (área CA vs. custos) + medidor de meta + alerta de faturas vencidas |

### 2.2 O que é novo

Margem líquida, ticket médio, taxa de conversão leads→inscrições, meta de
temporada, conversão etapa a etapa do funil, exceções acionáveis, satisfação,
carga da equipe, ordenação da tabela e filtro de período.

---

## 3. Especificação de responsividade

| Faixa | Layout |
| --- | --- |
| `< 640px` | Coluna única. KPIs empilhados. Tabela vira lista de cartões (sem scroll horizontal). Seletor de período rola horizontalmente. Sidebar vira gaveta. Rail no fim da página. |
| `640–1024px` | KPIs em 2 colunas. Rosca e legenda lado a lado. Cards do rail em 2 colunas. |
| `1024–1280px` | Sidebar fixa. Divisões 2/3 + 1/3 ativas. Tabela completa (coluna "Modalidade" oculta). |
| `1280–1536px` | KPIs em 4 colunas. Rail em 4 colunas abaixo do conteúdo. |
| `≥ 1536px` | Três zonas: sidebar · conteúdo · rail fixo à direita. |

Regras adotadas: títulos quebram em vez de truncar; todo texto variável usa
`min-w-0` + `truncate` onde a quebra não cabe; números usam `tabular-nums`.

---

## 4. Branding: referência → FLI

A referência visual é escura com verde neon. A energia (acento vibrante sobre
superfície profunda) foi mantida, o vocabulário cromático foi trocado:

| Referência | FLI |
| --- | --- |
| Verde neon `#B4F461` | **Amarelo FLI `#FCAF17`** (`--fli-yellow`) — acento único |
| Preto neutro | **Navy FLI `#14213D`** (`--fli-navy`) — sidebar, header e superfície escura |
| Categorias multicolor | `--fli-blue` `#0095DA`, `--fli-teal` `#00B5AD`, `--fli-orange` `#F58220`, `--fli-purple` `#A154A1` |

Elementos estruturais herdados da referência: faixa de KPIs com variação, um KPI
como medidor de meta, rosca com total ao centro, gráfico de área com total
destacado, tabela com cabeçalho ordenável, rail direito de notificações /
atividade / pessoas, seletor de período no topo à direita, cards arredondados.

O mockup traz um **alternador claro/escuro**: o app é claro por padrão, a
referência é escura. No modo escuro os tokens semânticos são remapeados para
navy FLI dentro da subárvore (`fliDarkSurface` em `MockupShell.tsx`), sem tocar o
tema global. Assim o desenho é nativo no tema atual do app e ganha a estética da
referência quando desejado.

---

## 5. Ligação com dados reais (pós-aprovação)

O mockup usa dados fictícios, mas foi modelado sobre hooks que já existem:

| Bloco | Origem |
| --- | --- |
| Receita, margem, custos | `useFinancialKPIs`, `useFormationProfitability`, `useCAByMonth` |
| Composição da receita | `useCAByType` |
| Meta da temporada | `useCurrentSeason` + alvo a definir (novo campo em `seasons`) |
| Inscrições e tabela | `useInscriptions` / `useRecentInscriptions` |
| Funil | `useLeadKPIs`, `useUpcomingTests`, `useInscriptionStats`, `useSessions`, `useInvoiceStats`, `usePaymentKPIs` |
| Preparação de turmas | `useSessions` + `session_enrollments` + `instructors` + `document_sendings` |
| Exceções | `usePendingInvoices`, `useTestBookingsToEvaluate`, `useSessions`, `usePartnerContracts`, `useSatisfactionStats` |
| Satisfação | `useSatisfactionStats` |
| Atividade | `useAuditLog` |

Pendências identificadas para a fase de ligação:

1. **Meta de temporada** não existe no schema — exige campo em `seasons`.
2. **Comparação com período anterior** exige que os hooks aceitem um intervalo
   (hoje vários fixam o próprio recorte internamente).
3. **Checklist de preparação** depende de flags reais (local, formador,
   material) que hoje são inferidas.
4. **Ordenação/paginação** da tabela idealmente no servidor.
5. Cada bloco deve respeitar `useUserPermissions().canView(routeKey)`.

---

## 6. Pontos para validação

1. A ordem das zonas corresponde à sua leitura de prioridade?
2. Os quatro KPIs de topo são os certos, ou algum deve ceder lugar a caixa /
   recebíveis / ocupação?
3. A composição da receita deve ser por atividade (atual), por idioma ou por
   parceiro/ESF?
4. O modo escuro navy deve ser o padrão da tela, ou o claro?
5. O rail de acompanhamento deve ser fixo à direita, ou recolhível?
