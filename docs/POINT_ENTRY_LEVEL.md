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

## Seconde moitié — `placement_tests.determined_level` (2026-09-15)

Migration : `supabase/migrations/20260915220000_bl002_determined_level.sql`
Journal : `audit_log.action = 'bl002_determined_level_cecrl'`

La même colonne existe côté test de positionnement, où l'import des réponses du
formulaire Google écrivait la **réponse déclarative brute**. Le portail stagiaire
dérive la piste de cette valeur : tout ce qui n'est pas du CECRL n'y produit
aucune piste, et `/tests` l'affichait « ? ».

Aucun octet abîmé dans cette colonne — le problème y est différent de BL-033.

| Source | n | Cible |
|--------|---|-------|
| `NULL` | 537 | `NULL` |
| `Je n'ai jamais été évalué(e)` | 39 | `NULL` |
| `Je ne connais pas mon niveau` | 4 | `NULL` |
| `1 - A2` | 3 | **A2** |
| `jamais pratiqué` | 2 | `NULL` |
| `Débutant` | 1 | **A1** |
| `2 - B1` | 1 | **B1** |
| 7 phrases libres | 7 | `NULL` |

**56 lignes modifiées** : 5 vers le CECRL, 51 vidées. Après : 588 vides, 1 A1,
3 A2, 1 B1.

Trois changements, au-delà de l'écriture :

1. **La table de correspondance couvre l'échelle numérotée de l'ancien tableur.**
   « 1 - A2 » était un cas particulier ; « 2 - B1 » existe aussi. La règle devient
   générale (`^[0-9]+ ?- ?(a1|…|c2)\+?$`), dans les deux fonctions SQL et dans le
   miroir TS. Un numéro seul ou une phrase commençant par un chiffre n'est pas
   lue comme un niveau (« 1 semaine de stage deja fait… » reste vidée).
2. **La réponse déclarative est conservée**, dans `answers.niveau_declare_source`
   (56 lignes). On ne perd pas l'information : on la sort d'une colonne qui doit
   porter du CECRL.
3. **La colonne est verrouillée.** La contrainte
   `placement_tests_determined_level_cecrl` n'autorise que `NULL` ou A1…C2. La
   migration d'origine la portait ; elle avait disparu à la recréation de la
   table, d'où la dérive. Contrôle négatif effectué : écrire « Je ne connais pas
   mon niveau » lève désormais `23514`.

Côté application, deux points d'écriture alignés pour que la colonne ne se
salisse plus :

- `src/hooks/useFliFormResponsesImport.ts` — l'import des réponses du formulaire
  passe la valeur par `mapEntryLevelToCecrl` et range la réponse déclarative
  dans `answers.niveau_declare_source` ;
- `submit-registration` écrivait déjà du CECRL : `currentLevel` vient du moteur
  de test (`determineLevelFromSlopes`), qui retourne A1/A2/B1/B2.

`/tests` affiche « Non renseigné » au lieu de « ? » pour les tests sans niveau
(`usePlacementTestStats`).

## Retour arrière (down)

Ne pas exécuter sans validation : l’historique brut n’est pas conservé en colonne.

```sql
-- Les fonctions peuvent rester ; elles sont immuables.
-- DROP FUNCTION IF EXISTS public.map_entry_level_to_cecrl(text);
-- DROP FUNCTION IF EXISTS public.classify_entry_level_source(text);
```
