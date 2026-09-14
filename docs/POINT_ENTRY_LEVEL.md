# BL-002 — `inscriptions.entry_level` → CECRL

Migration : `supabase/migrations/20260914180000_entry_level_cecrl.sql`

Journal : `audit_log.action = 'entry_level_cecrl'` (comptages par `source_key`, aucune donnée personnelle).

Table validée par Paula le 2026-09-14. Écriture live après dry-run (mêmes effectifs).

Référentiel cible (certificat / portail) : on **écrit le CECRL**, jamais le libellé piste.
Le portail stagiaire dérive la piste via `studentFacingPisteFromCecrl`.

| CECRL | Piste (UI stagiaire) |
|-------|----------------------|
| A1 | Début de parcours |
| A2 | Piste verte |
| B1 | Piste bleue |
| B2 | Piste rouge |
| C1 / C2 | Piste noire |

## Table validée (live 2026-09-14, n = 908)

Corruption d’encodage : octet C1 **U+008E** (`c28e`), pas latin1 0xE9. Normalisation : `replace(…, U+008E, 'é')` puis `trim` / casse / accents / faute `Perfeccionement`.

| Source (telle qu’en base) | n | Cible |
|---------------------------|---|-------|
| `NULL` | 475 | `NULL` |
| `Intermediaire` (sans accent) | 127 | **B1** |
| `Faux d[U+008E]butant` | 81 | **A2** |
| `Perfeccionement ` (faute + espace) | 68 | **B2** |
| `D[U+008E]butant` | 61 | **A1** |
| `Interm[U+008E]diaire` | 25 | **B1** |
| `Je n'ai jamais été évalué(e)` | 21 | `NULL` |
| `Débutant` (UTF-8) | 14 | **A1** |
| `n/a` | 13 | `NULL` |
| `Faux débutant` (UTF-8) | 11 | **A2** |
| `Je ne connais pas mon niveau` | 4 | `NULL` |
| `jamais pratiqué` | 2 | `NULL` |
| `1 - A2` | 2 | **A2** |
| `A1` | 1 | **A1** (inchangé) |
| 3 phrases libres | 3 | `NULL` |

`niveau_general_entree` suit la même table (même historique, 476 `NULL` dont 1 ligne déjà `entry_level = A1`). Les non reconnus sont vidés. Liste id + valeur brute **hors dépôt**.

## Écriture live (2026-09-14)

Dry-run puis `UPDATE` journalisée (`entry_level_cecrl_dry_run` / `entry_level_cecrl`).

| Après | n |
|-------|---|
| `NULL` | 518 (475 déjà vides + 43 non reconnus) |
| B1 | 152 |
| A2 | 94 (92 faux débutant + 2 `1 - A2`) |
| A1 | 76 (75 débutant + 1 déjà A1) |
| B2 | 68 |

432 `entry_level` et 433 `niveau_general_entree` (copie du A1 orphelin). Les deux colonnes sont alignées. Idempotent : rejouer la migration ne réécrit plus.

## Règles

1. Normaliser U+008E → `é` **avant** le mapping.
2. `trim` + casse ignorée + `Perfeccionement` → Perfectionnement.
3. Débutant → A1, Faux débutant → A2, Intermédiaire → B1, Perfectionnement → B2.
4. Auto-positionnement / « pas évalué » / `n/a` / phrases libres → `NULL`.
5. Ne pas écrire `entry_level` = libellé piste.

Fonction SQL `map_entry_level_to_cecrl(text)` (idempotente). Miroir TS : `src/lib/entry-level-cecrl.ts` (imports CSV / admin).

## Retour arrière (down)

Ne pas exécuter sans validation : l’historique brut n’est pas conservé en colonne.

```sql
-- Les fonctions peuvent rester ; elles sont immuables.
-- DROP FUNCTION IF EXISTS public.map_entry_level_to_cecrl(text);
-- DROP FUNCTION IF EXISTS public.classify_entry_level_source(text);
```
