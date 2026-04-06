

# Module de gestion des saisons FLI

## Résumé

Création d'un système complet de saisons avec tables de tarification, liaison aux inscriptions/factures, filtrage financier par saison, et UI d'administration.

## 1. Migration SQL

### Table `seasons`
```sql
CREATE TABLE public.seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'planifiee',
  is_current boolean NOT NULL DEFAULT false,
  revenue_target numeric DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### Table `pricing_rules`
```sql
CREATE TABLE public.pricing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  language text NOT NULL,
  level text NOT NULL,
  duration_hours numeric NOT NULL,
  modality text NOT NULL,
  base_price numeric NOT NULL,
  group_discount_percent numeric DEFAULT 0,
  esf_partner_price numeric,
  opco_eligible boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### Colonnes FK sur tables existantes
```sql
ALTER TABLE public.inscriptions ADD COLUMN season_id uuid REFERENCES public.seasons(id);
ALTER TABLE public.invoices ADD COLUMN season_id uuid REFERENCES public.seasons(id);
```

### Fonction d'activation unique
```sql
CREATE OR REPLACE FUNCTION public.activate_season(p_season_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.seasons SET is_current = false, status = 'terminee'
    WHERE is_current = true AND id != p_season_id;
  UPDATE public.seasons SET is_current = true, status = 'active'
    WHERE id = p_season_id;
END;
$$;
```

### RLS
- `seasons` : SELECT `authenticated`, INSERT/UPDATE `authenticated`, DELETE `is_admin()`
- `pricing_rules` : SELECT `authenticated`, INSERT/UPDATE `authenticated`, DELETE `is_admin()`
- Trigger `updated_at` sur les deux tables

## 2. Fichiers à créer

### `src/hooks/useSeasons.ts`
- `useSeasons()` : liste toutes les saisons triées par date
- `useCurrentSeason()` : retourne la saison `is_current = true`
- `useActivateSeason()` : mutation qui appelle `activate_season()`
- `useCreateSeason()` / `useUpdateSeason()` / `useDeleteSeason()`
- `usePricingRules(seasonId)` : liste les règles tarifaires d'une saison
- `useCreatePricingRule()` / `useUpdatePricingRule()` / `useDeletePricingRule()`
- `usePriceLookup(seasonId, language, level, modality, duration)` : cherche le tarif correspondant

### `src/pages/admin/Seasons.tsx`
- Liste des saisons en cartes avec badge visuel (Planifiée/Active/Terminée)
- Badge doré pour la saison active
- Bouton "Activer" sur chaque saison non-active (avec confirmation)
- Bouton "Nouvelle saison" ouvrant le formulaire
- Clic sur une saison ouvre le détail avec les règles tarifaires

### `src/components/admin/SeasonFormDialog.tsx`
- Formulaire création/édition : name, slug (auto-généré), dates, revenue_target, notes
- En mode édition, section inférieure avec la grille des règles tarifaires
- Bouton "Ajouter une règle" pour chaque combinaison langue/niveau/durée/modalité

### `src/components/admin/PricingRulesTable.tsx`
- Tableau éditable des règles tarifaires (inline editing)
- Colonnes : Langue, Niveau, Durée, Modalité, Prix de base, Remise groupe %, Prix ESF, OPCO
- Filtres par langue et niveau

### `src/components/finance/SeasonSelector.tsx`
- Dropdown compact qui liste les saisons
- Saison active pré-sélectionnée par défaut
- Émet `onSeasonChange(seasonId, startDate, endDate)` pour piloter les filtres financiers

## 3. Fichiers à modifier

### `src/App.tsx`
- Ajouter route `/admin/seasons` → `Seasons`

### `src/components/layout/Sidebar.tsx`
- Ajouter entrée "Saisons" dans le groupe Administration (icône `Calendar`)

### `src/lib/route-permissions.ts`
- Ajouter `{ key: "admin.seasons", label: "Saisons" }` dans le groupe Administration ou Gestion

### `src/pages/finance/FinanceDashboard.tsx`
- Ajouter `SeasonSelector` à côté du `PeriodSelector`
- Quand une saison est sélectionnée, les dates start/end du PeriodSelector se calent automatiquement sur la saison
- Passer `season_id` aux hooks financiers si on veut filtrer aussi par FK (optionnel, le filtre par dates suffit)

### `src/components/inscriptions/InscriptionFormDialog.tsx`
- Ajouter champ caché `season_id` auto-rempli avec la saison active
- Quand langue + niveau + modalité + durée sont renseignés, lookup automatique du prix via `usePriceLookup` et pré-remplissage du champ `price`
- Tooltip "Tarif saison X" à côté du champ prix

### `src/hooks/useInscriptions.ts` (type `InscriptionComplete`)
- Ajouter `season_id` au type

## 4. Détails techniques

- Le slug est auto-généré depuis le nom (ex: "Hiver 2025-2026" → "hiver-2025-2026")
- `activate_season()` est une fonction DB SECURITY DEFINER qui garantit qu'une seule saison est active à la fois
- Le lookup de prix utilise une correspondance exacte (language + level + modality + duration_hours) ; si aucune règle ne correspond, le champ prix reste vide et éditable manuellement
- Les traductions i18n suivront le pattern existant avec `useLanguage()` et objets `translations` locaux (FR, PT-BR, EN)
- 11 fichiers touchés au total (1 migration, 5 créés, 5 modifiés)

