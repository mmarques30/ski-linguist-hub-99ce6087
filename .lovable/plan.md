
# Integrar permissoes de edicao em todas as paginas do sistema

## Contexto
O hook `useUserPermissions` ja possui as funcoes `canView()` e `canEdit()`, e as permissoes ja sao armazenadas no banco. Porem, nenhuma pagina utiliza `canEdit()` para condicionar a exibicao dos controles de edicao (botoes de criar, editar, excluir). Todos os usuarios autenticados veem todos os botoes.

## Objetivo
Condicionar a exibicao e habilitacao dos botoes de criacao, edicao e exclusao em todas as paginas com base na permissao `can_edit` do usuario logado. Admins continuam com acesso total.

## Abordagem
Cada pagina passara a importar `useUserPermissions` e usar `canEdit(routeKey)` para esconder ou desabilitar os controles de escrita.

## Paginas afetadas e elementos condicionados

### 1. `src/pages/Students.tsx` (routeKey: `students`)
- Esconder botao "Nouveau stagiaire"
- Esconder botao de edicao (Pencil) em cada linha/card
- O botao "Voir le profil" (Eye) permanece visivel (leitura)

### 2. `src/pages/Inscriptions.tsx` (routeKey: `inscriptions`)
- Esconder botao "Nouvelle inscription"
- Esconder botao "Importer CSV"
- Esconder botao de edicao (Edit) e exclusao (Trash2) em cada linha
- Esconder dropdown de mudanca de status
- Esconder botao "End Pack" (Package)
- Manter botao "Voir" (Eye)

### 3. `src/pages/Invoices.tsx` (routeKey: `invoices`)
- Esconder botao "Nouvelle Facture"
- Esconder botao de edicao (Pencil) em cada linha
- Esconder acoes "Marquer envoyee" e "Marquer payee"
- Manter botao de visualizacao (Eye)

### 4. `src/pages/finance/FinanceDashboard.tsx` (routeKey: `finance`)
- Esconder botao "Payer" na tabela de formadores a pagar
- Graficos e KPIs permanecem visiveis (leitura)

### 5. `src/pages/finance/FinanceAnalyses.tsx` (routeKey: `finance.analyses`)
- Pagina e predominantemente leitura (graficos/tabelas)
- Sem alteracoes necessarias (nao ha botoes de edicao)

### 6. `src/pages/finance/FinanceRentabilite.tsx` (routeKey: `finance.rentabilite`)
- Esconder botao "Ajouter coût" em cada formacao
- Manter os dados de visualizacao

### 7. `src/pages/finance/FinanceTresorerie.tsx` (routeKey: `finance.tresorerie`)
- Pagina de leitura apenas - sem alteracoes

### 8. `src/pages/finance/FinanceChargesFixes.tsx` (routeKey: `finance.charges_fixes`)
- Esconder edicao inline dos templates (botao de edicao de montante)
- Esconder switch de ativo/inativo dos templates
- Esconder botao "Generer charges"
- Esconder checkbox de "pago" nas linhas de custos mensais

### 9. `src/pages/PlacementTests.tsx` (routeKey: `tests`)
- Pagina de leitura - nao ha acoes de edicao direta

### 10. `src/pages/formateur/EvaluationsList.tsx` (routeKey: `evaluations`)
- Esconder botao "Evaluer" nas avaliacoes pendentes
- Esconder botao "Modifier" nas avaliacoes completas
- Manter botao "Voir" (Eye)

### 11. `src/pages/Classes.tsx` (routeKey: `classes`)
- Esconder botao "Nouvelle session"
- Pagina atualmente sem dados, mas preparar para o futuro

### 12. `src/pages/SatisfactionStats.tsx` (routeKey: `satisfaction`)
- Pagina de leitura - sem acoes de edicao

### 13. `src/pages/ContinuousImprovement.tsx` (routeKey: `amelioration`)
- Esconder botao "Nouvelle action"
- Esconder botao de edicao (Pencil) e exclusao (Trash2) em cada linha
- Manter visualizacao dos KPIs e tabela

### 14. `src/pages/Documents.tsx` (routeKey: `documents`)
- Esconder botao "Televerser un document"
- Esconder botao de exclusao (Trash2) nos documentos

### 15. `src/pages/students/StudentDetails.tsx` e `src/pages/inscriptions/InscriptionDetails.tsx`
- Esconder botoes de edicao nos detalhes (herdam routeKey do pai: `students` / `inscriptions`)

## Detalhes tecnicos

### Padrao de implementacao (mesmo para todas as paginas)
```tsx
import { useUserPermissions } from "@/hooks/useUserPermissions";

// No componente:
const { canEdit } = useUserPermissions();
const editable = canEdit("routeKey");

// Nos botoes de edicao:
{editable && (
  <Button onClick={...}>
    <Plus /> Ajouter
  </Button>
)}
```

### Paginas sem edicao (somente leitura)
As paginas a seguir nao possuem acoes de escrita e nao precisam de alteracoes:
- FinanceAnalyses, FinanceTresorerie, PlacementTests, SatisfactionStats

### Total de ficheiros modificados: ~11 paginas
Nenhum ficheiro novo. Nenhuma migracao de banco de dados.
