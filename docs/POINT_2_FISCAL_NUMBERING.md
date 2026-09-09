# Point 2 — Exercice fiscal FLI + numérotation factures

**Branche :** `cursor/invoice-fiscal-numbering-7435`  
**Date :** 2026-09-09  
**Statut :** en attente de validation Paula  
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
- Import historique : si `invoice_number` est fourni au format `AA-AA.N`, la séquence est synchronisée sans écraser le numéro

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
- **Appliquée en live** sur le projet Supabase FLI le 2026-09-09 (fonctions remplacées).

### DOWN (si besoin de rollback)

Voir le bas de `supabase/migrations/20260909140000_fiscal_year_invoice_numbering.sql` : restaure année civile + `FLI-YYYY-NNNN`. À n’exécuter qu’avec validation Paula écrite.

## Tests effectués (puis nettoyés)

Trois factures fictives (`notes = 'POINT2_TEST'`) puis suppression :

| Date facture | Type | Numéro obtenu | TVA |
|--------------|------|---------------|-----|
| 20/06/2026 | formation | `25-26.14298` | 0 |
| 05/07/2026 | test | `26-27.14299` | 20 |
| 12/11/2026 | soustraitance | `26-27.14300` | 20 |

Après nettoyage : `invoices` = **0** lignes → prochaine séquence auto = **14298**.

Smoke TS (`getFiscalYear`) : dates ci-dessus + bornes `25-26` OK.

## UI

- Sélecteur de période finance : libellés **exercice** (plus « saison » seule pour ces options).
- Liste factures : filtres période basés sur les bornes fiscales FLI.

## Hors scope (volontaire)

- Import historique des factures Excel (point 9)
- Relances / `pg_net` (point 8)
- Stripe E2E (point 6)
- Rename type `soustraitance` → `sous_traitance`
- Remplacement des mocks dashboard qui affichent encore `FLI-2026-…` (données fictives)

## Validation demandée

Paula, merci de confirmer par écrit :

1. Règles d’exercice (transition + juil–juin) correctes  
2. Format `{exercice}.{séquence}` + reprise après **14297** OK  
3. TVA formation 0 / test & sous-traitance 20 OK  
4. On peut enchaîner sur le **point 3** (import formateur·rices)  
