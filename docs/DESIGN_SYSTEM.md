# Design system FLI

Référence courte. Toute page back-office s’écrit avec ces briques ;
on ne recrée pas une carte, une tuile ou un graphique à la main.

---

## Règle d’or — une seule brique par besoin

| Besoin | Utiliser | Ne pas utiliser |
|---|---|---|
| Page admin | `PageShell` + `PageHeader` | `h1` / layout maison |
| Carte | `SurfaceCard` | `ui/card` |
| Statut métier | `StatusPill` + `toneForStatus` | `Badge`, `span` coloré |
| Chip / filtre | `Badge` (rare) | `StatusPill` |
| Tableau | `TableFrame` / kit `DataTable` | `ui/table` |
| Liste vide (tableau) | `TableEmpty` | message ad hoc |
| Vide hors tableau | `EmptyState` | autre empty custom |
| Toast / notification | `toast` de **Sonner** | Radix `Toaster` / ancien stack |
| Confirmation destructive | `AlertDialog` | `Dialog` « normal » |
| KPI | `StatTile` | `StatCard` / KPI maison |
| Graphique | kit `ui-kit/charts` | Recharts brut |
| Couleur / ombre / rayon | jetons CSS | hex ou `text-[11px]` |

Nouveau code : **Sonner uniquement**  
(`import { toast } from "sonner"` ou `toast` via `@/hooks/use-toast`, qui délègue à Sonner).

---

## Principes

1. **Une seule grammaire** — même titre, carte, tableau, graphique d’un écran à l’autre.
2. **Rien ne disparaît** — refonte visuelle, pas de retrait de données ou d’actions.
3. **Tout compteur mène quelque part** — tuile / segment → liste filtrée.
4. **La couleur n’est jamais seule** — libellé, légende ou texte de gravité.
5. **Jetons uniquement** — si un jeton manque, l’ajouter dans `src/index.css`.

---

## Jetons (`src/index.css`)

| Famille | Usage |
|---|---|
| `--surface-page / raised / sunken / overlay` | Fonds |
| `--shadow-xs … xl` | Profondeur (navy, jamais noir) |
| `--radius` · `--radius-card` · `--radius-panel` · `--radius-pill` | Rayons |
| Teintes KPI (`gold`…`neutral`, `-bg/-fg/-ring`) | Tuiles — pas les séries |
| `--chart-1…6` | Séries data-viz (ordre figé, validé CVD) |
| `--status-good/warning/serious/critical` | Gravité viz — jamais une série |

Classes : `.fli-surface`, `.fli-surface-interactive`, `.fli-sunken`, `.fli-glass`, `.fli-icon-chip`.

Au-delà de 6 catégories de graphique : replier sur « Autre » (`foldToSeriesCap`).

---

## Kit (`@/components/ui-kit`)

```tsx
<PageShell>
  <PageHeader title="…" actions={…} tabs={<SubNav items={[…]} />} />
  <StatTileGrid cols={4}>…</StatTileGrid>
  <SurfaceCard title="…" flush>…</SurfaceCard>
</PageShell>
```

| Zone | Composants |
|---|---|
| Structure | `PageShell`, `PageHeader`, `SectionHeading`, `SurfaceCard`, `CardGrid`, `SplitLayout` |
| Indicateurs | `StatTile`, `StatTileGrid`, `IconChip`, `DeltaBadge`, `StatusPill` |
| Tableaux | `TableFrame`, `TableHead*`, `TableRow`, `TableCell`, `IdentityCell`, `TablePagination`, `TableSkeleton`, `TableEmpty`, `CardList` |
| Contrôles | `SegmentedControl`, `SubNav`, `FilterBar` |
| Graphiques | `TrendChart`, `BarsChart`, `DonutChart`, `RadialRings`, `RankedBarList`, `ProgressRing`, `GaugeMeter`, `MeterRow`, `Sparkline`, `FunnelBars` |
| Listes | `ActivityFeed`, `AvatarStack`, `DefinitionList` |

Mobile tableaux : doubler avec `CardList` sous `md`.

Graphiques : un seul axe Y ; légende dès 2 séries ; pas de 7ᵉ teinte.

---

## Thème & accessibilité

- Thème : `initTheme()` + `ThemeToggle` (classe `dark` sur `<html>`, `localStorage`).
- Focus global `:focus-visible`, `prefers-reduced-motion`, vrais `<table>` / `<dl>`, `aria-label` sur boutons icône.

---

## Migrer un écran

1. `PageShell` + `PageHeader` (toutes les actions existantes).
2. Compteurs → `StatTile` cliquables.
3. `<Card>` → `SurfaceCard`.
4. Filtres → `FilterBar`.
5. Tableau → kit `DataTable` + `CardList` mobile.
6. Badges d’état → `StatusPill` + `toneForStatus`.
7. Graphiques → kit charts.
8. Vérifier : rien perdu ; thème sombre ; 360px.

Référence : `src/components/dashboard/DashboardGestao.tsx`.
