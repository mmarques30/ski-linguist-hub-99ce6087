# Design system FLI — refonte visuelle 2026-09

Ce document est la référence d'implémentation. Toute page du back-office
s'écrit avec ces briques ; on ne recrée pas une carte, une tuile ou un
graphique à la main.

---

## 1. Principes

1. **Une seule grammaire.** Un titre de page, une carte, un tableau et un
   graphique se ressemblent d'un écran à l'autre. La nouveauté visuelle ne
   vient jamais d'un écran isolé.
2. **Rien ne disparaît.** La refonte est visuelle : chaque donnée, chaque
   bouton, chaque lien et chaque action existants restent présents. On peut
   déplacer et regrouper — jamais retirer.
3. **Tout compteur mène quelque part.** Une tuile KPI, un segment de
   répartition ou une ligne de liste qui représente un ensemble de lignes
   ouvre la liste filtrée correspondante.
4. **La couleur n'est jamais seule.** Un état porte un libellé ; une série
   porte une légende ; une gravité porte un texte.
5. **Jetons uniquement.** Aucune couleur, ombre ou rayon en dur dans un
   composant. Si un jeton manque, on l'ajoute à `src/index.css`.

---

## 2. Jetons (`src/index.css`)

### Surfaces et profondeur

| Jeton | Usage |
|---|---|
| `--surface-page` | Fond de page (teinté navy, les cartes s'en détachent) |
| `--surface-raised` | Cartes |
| `--surface-sunken` | Zones encastrées : en-têtes de tableau, pistes, segments |
| `--surface-overlay` | Popovers, feuilles |
| `--shadow-xs … --shadow-xl` | Profondeur. Ombres teintées navy, jamais noires |
| `--radius` (12px) · `--radius-card` (16px) · `--radius-panel` (20px) · `--radius-pill` | Rayons |

Classes utilitaires : `.fli-surface`, `.fli-surface-interactive`, `.fli-sunken`,
`.fli-glass`, `.fli-icon-chip`.

### Teintes des tuiles KPI

Huit tons, chacun avec `-bg` / `-fg` / `-ring` :
`gold`, `blue`, `teal`, `purple`, `orange`, `rose`, `navy`, `neutral`.
Elles n'ont rien à voir avec la palette des séries : une tuile n'est pas une
série.

### Palette data-viz — **ordre figé**

| Emplacement | Teinte | Clair | Sombre |
|---|---|---|---|
| 1 | bleu | `#0077B3` | `#3B90CC` |
| 2 | orange | `#E5701A` | `#D2712F` |
| 3 | sarcelle | `#00918A` | `#00A099` |
| 4 | or | `#C98500` | `#B88015` |
| 5 | violet | `#8E4A8E` | `#A96BA9` |
| 6 | vert | `#2E8B57` | `#46996A` |

Validée avec `scripts/validate_palette.js` de la compétence dataviz :
séparation CVD adjacente minimale ΔE 11,8 (clair) et 9,3 (sombre) ; vision
normale 22,3 / 19,9. **Ne pas réordonner sans revalider.**

Au-delà de 6 catégories : replier sur « Autre » (`foldToSeriesCap`). On ne
génère jamais une 7e teinte.

Les statuts data-viz (`--status-good/warning/serious/critical`) sont réservés :
jamais utilisés comme couleur de série.

---

## 3. Kit (`@/components/ui-kit`)

### Structure de page

```tsx
<PageShell>
  <PageHeader
    title="Inscriptions"
    description="Suivi des dossiers de formation"
    icon={ClipboardList}
    meta={<StatusPill tone="info">Saison 2026-2027</StatusPill>}
    actions={<Button>Nouvelle inscription</Button>}
    tabs={<SubNav items={[…]} />}
  />
  <StatTileGrid cols={4}>…</StatTileGrid>
  <SurfaceCard title="…" actions={…} flush>…</SurfaceCard>
</PageShell>
```

| Composant | Rôle |
|---|---|
| `PageShell` | Racine du contenu : espacement, largeur max 1600px, animation d'entrée |
| `PageHeader` | Titre, description, icône, badges de contexte, actions, sous-navigation, lien de retour |
| `SectionHeading` | Titre de section à l'intérieur d'une page longue |
| `SurfaceCard` | Carte : en-tête (titre + description + actions), barre d'outils, corps, pied. `flush` pour un tableau pleine largeur, `accent` pour un filet coloré |
| `CardGrid` | Grille de cartes (2 / 3 / 4 colonnes) |
| `SplitLayout` | Contenu principal + rail droit, empilés sous 1280px |

### Indicateurs

| Composant | Rôle |
|---|---|
| `StatTile` | Tuile KPI : chip d'icône, valeur, libellé, `delta`, `to`/`onClick`, `loading` |
| `StatTileGrid` | Bandeau de tuiles |
| `IconChip` | Chip d'icône teintée, réutilisable |
| `DeltaBadge` | Écart vs période précédente. `inverted` quand une hausse est une mauvaise nouvelle (impayés, retards) |
| `StatusPill` + `toneForStatus` | Pastille d'état. Le libellé reste calculé par les helpers métier |

### Tableaux

`TableFrame`, `TableHeadRow`, `TableHeadCell` (avec `sort`), `TableRow`,
`TableCell` (avec `hideBelow`), `IdentityCell`, `TablePagination`,
`TableSkeleton`, `TableEmpty`.

En dessous de `md`, doubler le tableau d'une `CardList` / `CardListItem` :

```tsx
<table className="hidden w-full md:table">…</table>
<CardList className="md:hidden">…</CardList>
```

### Contrôles

| Composant | Rôle |
|---|---|
| `SegmentedControl` | Pastilles « Jour / Semaine / Mois ». Paramétrer le générique au besoin : `<SegmentedControl<"a" \| "b">` |
| `SubNav` | Même grammaire, mais par routes |
| `FilterBar` | Recherche + filtres + actions, avec rappel des filtres actifs en chips effaçables |

### Graphiques

| Composant | Quand |
|---|---|
| `TrendChart` | Évolution dans le temps (aire dégradée ou ligne) |
| `BarsChart` | Comparaison par catégorie, verticale ou couchée, empilée ou non |
| `DonutChart` | Répartition d'un total, avec total au centre et légende détaillée |
| `RadialRings` | Quelques parts en anneaux concentriques |
| `RankedBarList` | Classement : libellé, piste, valeur |
| `ProgressRing` / `GaugeMeter` / `MeterRow` | Une valeur face à sa cible |

Règles héritées de la compétence dataviz :

- **Un seul axe Y.** Deux ordres de grandeur → deux graphiques.
- Légende dès 2 séries, jamais pour une seule (le titre nomme la série).
- Infobulle au survol par défaut.
- Marques fines : traits 2px, extrémités arrondies 4px côté donnée,
  2px de fond entre segments empilés.
- La couleur suit l'entité, jamais son rang : un filtre qui retire une série
  ne repeint pas les autres.
- Jamais de camembert plein quand un anneau avec total au centre dit la même
  chose en plus lisible.

### Listes et fiches

`ActivityFeed` (avec `connected` pour un fil chronologique), `AvatarStack`,
`DefinitionList`.

---

## 4. Responsivité

| Palier | Comportement attendu |
|---|---|
| `< 480px` | Une colonne. Tuiles empilées. Tableaux → `CardList`. Barre latérale en tiroir |
| `480–768px` | Tuiles sur 2 colonnes. Filtres empilés |
| `768–1024px` | Colonnes secondaires des tableaux réapparaissent (`hideBelow="md"`) |
| `1024–1280px` | Barre latérale fixe (rail d'icônes possible). Cartes sur 2–3 colonnes |
| `≥ 1280px` | `SplitLayout` actif : contenu + rail |
| `≥ 1600px` | Le contenu se centre au lieu de s'étirer |

Règles : les titres passent à la ligne au lieu d'être tronqués ; tout texte
variable est en `min-w-0` + `truncate` quand la coupe est inévitable ; les
chiffres sont en `tabular` ; aucun défilement horizontal de page — seuls les
tableaux et les barres de segments défilent, à l'intérieur de leur cadre.

---

## 5. Thème sombre

Wiré par `initTheme()` (dans `src/main.tsx`) et `ThemeToggle`
(`src/components/layout/ThemeToggle.tsx`), rendu en pied de barre latérale et
dans l'en-tête. La classe `dark` est posée sur `<html>`, le choix est gardé
en `localStorage`, et le thème système sert de valeur initiale.

Un composant correctement écrit avec les jetons bascule sans modification.
Si un écran « casse » en sombre, c'est qu'il porte une couleur en dur.

---

## 6. Accessibilité

- Anneau de focus global (`:focus-visible`), homogène partout.
- Les jauges et barres portent `role="meter"` avec `aria-valuenow/min/max`.
- Les graphiques portent un `aria-label` décrivant leur contenu.
- Un bouton icône seul porte toujours un `aria-label`.
- `prefers-reduced-motion` neutralise les animations.
- Les listes de définition sont de vraies `<dl>`, les tableaux de vrais
  `<table>` avec `<th scope="col">`.

---

## 7. Migration d'un écran

1. Remplacer la racine par `PageShell` + `PageHeader` (titre, description,
   actions déjà présentes — **toutes**).
2. Remonter les compteurs existants en `StatTile`, en leur donnant la
   destination qu'ils n'avaient pas.
3. Remplacer chaque `<Card>` porteuse d'un en-tête par `SurfaceCard`.
4. Remplacer les filtres épars par une `FilterBar`.
5. Habiller le tableau avec les briques `DataTable` ; ajouter la `CardList`
   mobile ; brancher `TablePagination` sur la pagination réelle si elle existe.
6. Remplacer les badges d'état par `StatusPill` + `toneForStatus`, en gardant
   le libellé calculé par le helper métier.
7. Remplacer les graphiques par les composants du kit.
8. Vérifier : aucune information, action ou lien perdu ; `npx tsc --noEmit`
   propre ; rendu correct à 360px et en thème sombre.

Écran de référence : `src/components/dashboard/DashboardGestao.tsx`.
