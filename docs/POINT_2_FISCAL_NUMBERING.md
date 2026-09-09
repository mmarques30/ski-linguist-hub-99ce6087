# Point 2 — Exercice fiscal FLI + numérotation factures

**Branche :** `cursor/invoice-fiscal-numbering-7435`  
**Date :** 2026-09-09  
**Statut :** validé Paula 2026-09-09  
**Dépendance :** point 1 validé (import sécurisé)

## Objectif

Aligner l’app et Postgres sur les règles fiscales FLI avant tout import de factures historiques (point 9) et avant les relances (point 8).

## Règles livrées

### Exercice (libellé `AA-AA`)

| Période | Règle | Exemple |
|---------|--------|---------|
| Transition | 01/10/2025 → 30/06/2026 | `25-26` |
| Avant 01/10/2025 | 01/10 → 30/09 | 15/08/2025 → `24-25` |
| À partir du 01/07/2026 | 01/07 → 30/06 | 15/11/2026 → `26-27` |

### Numérotation

- Format : `{exercice}.{séquence}` (ex. `25-26.14298`)
- Séquence **globale continue** (tous exercices confondus)
- Reprise Excel : dernière facture `26-27.14297` → prochaine auto **14298**
- Plancher auto : `GREATEST(MAX(sequence_number), 14297) + 1` — même si des historiques importés ont une séquence plus basse, une facture **sans** numéro ne redescend pas sous 14298
- Import historique (colonne Fact FLI) : si `invoice_number` est fourni, le numéro est **conservé** (pas de passage par la séquence auto) ; `sequence_number` est synchronisé depuis le suffixe numérique si le format est `AA-AA.N`

### TVA (trigger)

| `invoice_type` | TVA |
|----------------|-----|
| `formation` | 0 % |
| `test` | 20 % |
| `soustraitance` | 20 % |

> Note : la valeur DB est `soustraitance` (sans underscore), contrainte CHECK existante. Un éventuel rename `sous_traitance` est noté en backlog (BL-011), hors point 2.

## Fichiers

| Fichier | Rôle |
|---------|------|
| `src/lib/fiscal-year.ts` | Helpers TS (alignés SQL) |
| `src/hooks/useFinancialDashboard.ts` | Réexporte les helpers (plus de logique juil–juin figée) |
| `src/components/finance/PeriodSelector.tsx` | Filtres « Cet exercice » / « Exercice précédent » |
| `src/pages/Invoices.tsx` | Bornes de période = exercice fiscal |
| `supabase/migrations/20260909140000_fiscal_year_invoice_numbering.sql` | `get_fiscal_year` + `before_invoice_insert` + trigger |

## Migration

- Fichier versionné dans le repo (réversible : section `DOWN` commentée).
- **Appliquée en live** sur le projet Supabase FLI le 2026-09-09 (fonctions remplacées ; plancher `GREATEST` appliqué le même jour après retest historique).

### DOWN (si besoin de rollback)

Voir le bas de `supabase/migrations/20260909140000_fiscal_year_invoice_numbering.sql` : restaure année civile + `FLI-YYYY-NNNN`. À n’exécuter qu’avec validation Paula écrite.

## Tests effectués (puis nettoyés)

### A — Scénario initial (validation Paula)

Trois factures fictives (`notes = 'POINT2_TEST'`) puis suppression :

| Date facture | Type | Numéro obtenu | TVA |
|--------------|------|---------------|-----|
| 20/06/2026 | formation | `25-26.14298` | 0 |
| 05/07/2026 | test | `26-27.14299` | 20 |
| 12/11/2026 | soustraitance | `26-27.14300` | 20 |

Après nettoyage : `invoices` = **0** lignes → prochaine séquence auto = **14298**.

### B — Exercice octobre → septembre (avant point 9)

Confirmé **SQL** (`get_fiscal_year`) et **TS** (`src/lib/fiscal-year.ts`) :

| Date | Attendu | SQL | TS |
|------|---------|-----|----|
| 15/08/2025 | `24-25` | OK | OK |
| 30/09/2025 | `24-25` | OK | OK |
| 01/10/2025 | `25-26` | OK | OK |
| 30/06/2026 | `25-26` | OK | OK |
| 01/07/2026 | `26-27` | OK | OK |

### C — Import avec numéro existant (Fact FLI)

| Action | Résultat |
|--------|----------|
| INSERT avec `invoice_number = '24-25.9999'`, date 15/08/2025, formation | Numéro **conservé** `24-25.9999` ; `fiscal_year = 24-25` ; `sequence_number = 9999` ; TVA 0 — **pas** de génération auto |
| INSERT sans numéro pendant qu’une hist. basse existe | Avant correctif plancher → `26-27.10000` (bug) ; après `GREATEST(..., 14297)` → `26-27.14298` |

Nettoyage : factures de test supprimées ; table vide.

## UI

- Sélecteur de période finance : libellés **exercice** (plus « saison » seule pour ces options).
- Liste factures : filtres période basés sur les bornes fiscales FLI.

## Hors scope (volontaire)

- Import historique des factures Excel (point 9)
- Relances / `pg_net` (point 8)
- Stripe E2E (point 6)
- Rename type `soustraitance` → `sous_traitance`
- Remplacement des mocks dashboard qui affichent encore `FLI-2026-…` (données fictives)

## Validation Paula (2026-09-09)

Point 2 validé : règles d’exercice, format `{exercice}.{séquence}`, reprise après 14297, TVA par type. Enchaînement point 3 autorisé.

Complément demandé (fait dans ce doc, section B/C) : cas antérieurs au 01/10/2025 + conservation du numéro Fact FLI à l’import.
