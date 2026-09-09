# Point 3 — Import formateur·rices

**Branche :** `cursor/point3-complement-backfill-7435`  
**Date :** 2026-09-09  
**Statut :** **CLÔTURÉ** (C 805 · B2 doublons 35 · 35 créations · Exception Courchevel fusionnée/supprimée)

> **Confidentialité :** aucun nom de personne dans `docs/`. Listes nominatives → `/opt/cursor/artifacts/` uniquement.

## Synthèse agrégée

| Étape | Résultat |
|-------|----------|
| A — complément instructors | **71** en base (29 actif / 40 inactif / 2 candidat) |
| B — backfill formateur | **837** lignes (`formateur` / email / téléphone) |
| C — `instructor_id` | **805** (707 email + 65 alias_exact + 32 alias_fuzzy + 1 manuel) |
| B2 — doublons encodage | **35** supprimés (plan 31 + paire 27 + Julie/Lana + Sofie + Courchevel Exception) |
| B2 — matching 25 facturée | dry-run **21** match / **4** unmatched → traités (écriture 21 + Felix manuel + Sofie dedup + Exception delete) |
| B2 — orphelines | **35** créées (34 avec `instructor_id`) · colonne `groupe_code` |

## Règles figées

- Aucun rattachement `alias_fuzzy` avec score &lt; **0,5** sans validation explicite (`ALIAS_FUZZY_MIN_SCORE` dans `scripts/build-formateur-rapprochement.ts`).
- Matching backfill : espaces/NBSP normalisés, casse/accents ignorés, noms ordre-indépendants (`src/lib/formateur-backfill-match.ts`).
- Zéro nom de personne dans `docs/`.

## Journaux `audit_log` (ids)

| Point | dry-run | import |
|-------|---------|--------|
| 3C instructor_id | `a14f2b90-…` | `9f4ce9fb-…` |
| 3B2 dedup 31 | — | `8c9239a2-…` |
| 3B2 Lana/Julie fix | — | `4057e26e-…` |
| 3B2 create 35 | `862d06d2-…` | `a3a9f5bb-…` |
| 3B2 Courchevel Exception | — | `0eda24f1-…` |

Détails nominatifs : artifacts `point3_C_*`, `point3_B2_*`.

## Clôture 2026-09-09

| Métrique | n |
|----------|---|
| Inscriptions | **906** |
| Avec formateur | **861** |
| Avec instructor_id | **840** |
| Doublons encodage supprimés | **35** |
| Orphelines créées | **35** |

Détail hors dépôt : `/opt/cursor/artifacts/point3_cloture.md`.  
Exception Courchevel `ce975956` : keep `7b1e217c-9b8f-…` (1800 + formateur) ; schedule/adresse fusionnés ; delete (montant 0, pas de note).  
Horaires J-10 → **BL-019 / point 10** (ne pas générer de code depuis les horaires).
