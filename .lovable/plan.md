

# Menus Laterais com Categorias Colapsaveis

## Problema atual
As categorias (Gestion, Formation, Qualite, Administration) sao labels estaticos (`SidebarGroupLabel`) que ficam sempre visiveis. O usuario quer que funcionem como menus dropdown colapsaveis, semelhante ao comportamento atual do item "Finance".

## O que sera feito

Transformar a estrutura de navegacao para que cada categoria seja um item colapsavel com icone e seta, contendo seus sub-itens. O Dashboard permanece no topo como item direto.

### Nova estrutura visual

```text
  FLI Logo
  ─────────────
  Dashboard
  ─────────────
  > Gestion          (colapsavel)
      Finance >      (com sub-sub-itens)
      Inscriptions
      Factures
      Stagiaires
  > Formation         (colapsavel)
      Tests de niveau
      Evaluations
      Sessions
  > Qualite           (colapsavel)
      Satisfaction
      Amelioration
      Documents
  > Administration    (colapsavel)
      Import
      Phrases
      Tests QA
      Parametres
  ─────────────
  Langue | Deconnexion
```

### Alteracoes tecnicas em `src/components/layout/Sidebar.tsx`

1. **Reestruturar `navigationGroups`**: Cada grupo com label passa a ser um item `Collapsible` com icone proprio:
   - Gestion: icone `Briefcase`
   - Formation: icone `GraduationCap`
   - Qualite: icone `Shield` ou `Award`
   - Administration: icone `Settings`

2. **Novo componente `NavGroupCollapsible`**: Renderiza o grupo como um `Collapsible` com `SidebarMenuButton` (icone + nome + seta), e dentro dele os itens filhos. Se um filho tiver `subItems` (como Finance), renderiza aninhado com outro nivel de `Collapsible`.

3. **Auto-abrir grupo ativo**: O grupo que contem a rota atual abre automaticamente via `useState` inicializado com base no `location.pathname`.

4. **Dashboard sem grupo**: Permanece como item simples no topo, fora de qualquer grupo colapsavel.

5. **Modo colapsado (icon)**: Quando o sidebar esta em modo icone, cada grupo mostra apenas seu icone com tooltip do nome da categoria.

