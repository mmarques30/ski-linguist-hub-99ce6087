# Point 3 — Import formateur·rices

**Branche :** `cursor/point3-complement-backfill-7435` (suite de `import-formateurs-7435`)  
**Date :** 2026-09-09  
**Statut :** A fait · B écrit (837) · B2 dry-run hors dépôt · C table hors dépôt (pas d’`instructor_id`)

> **Confidentialité :** aucun nom de personne dans `docs/`. Listes nominatives et CSV sources → `/opt/cursor/artifacts/` uniquement (hors dépôt).

## 1. Rapport dry-run (moteur `prepareImport`)

Fichier source formateurs (non commité).

| Métrique | Valeur |
|----------|--------|
| Encodage | UTF-8 BOM retiré (utf-8-sig) |
| Délimiteur | `;` |
| Lignes données | **69** |
| Acceptées | **69** |
| Rejetées | **0** |
| → `actif` / `inactif` / `candidat` | 27 / 40 / 2 |

Artifact : `/opt/cursor/artifacts/point3_dry_run_report.md`.

## 2. Après import initial — base + `audit_log`

| Contrôle | Valeur |
|----------|--------|
| `instructors` total | **69** |
| actif / inactif / candidat | 27 / 40 / 2 |

Journal `import` : `42a249ed-e009-4f32-9fdf-a031e515b492` (point=3, accepted=69).

## 3. Colonnes formateur sur inscriptions

Cause du blocage initial : libellé Excel « Formateur » non persisté → 906 × `formateur` vide.

Correctifs : migration `formateur` / `formateur_email` / `formateur_telephone` ; script `scripts/build-formateur-rapprochement.ts` (aucune écriture `instructor_id`).

## 4. Chemin d’écriture vs `/admin/import`

L’écriture initiale des 69 a contourné le parcours UI (INSERT journalisé). Les modes **complément** et **backfill formateur** sont branchés dans `/admin/import` pour la suite.

---

## Compléments 2026-09-09

### A — Formateur·rices complémentaires

| Étape | Résultat |
|-------|----------|
| Dry-run | 71 acceptées / 0 rejet · 29 actif / 40 inactif / 2 candidat |
| Classification | **2 insert** + **69** déjà présentes (clé email / nom+prénom) |
| Après écriture | **71** en base — **29 / 40 / 2** |

Journal : dry-run `a40e18ec-…` · import `9d3cb213-…` (mode=complement, inserted=2).  
Détail des 2 inserts : `/opt/cursor/artifacts/point3_rapport_A_complement.md` (hors dépôt).

### B — Backfill formateur (**écrit** — 837 uniquement)

| Contrôle | Valeur |
|----------|--------|
| Lignes mises à jour | **837** |
| Formateur non vide / vide | **805** / **32** |
| Colonnes | `formateur`, `formateur_email`, `formateur_telephone` uniquement |
| Non écrits | 69 DB sans match · 41 CSV orphelines · 2 multiples |

Journal : dry-run `aaa4c1c8-…` · import `e06e5f44-…` (updated=837).

### B2 — Dry-run (aucune suppression) — hors dépôt

Listes nominatives : `/opt/cursor/artifacts/point3_B2_*.md` (+ `point3_B2_listes.json`).

| Liste | n | Contenu |
|-------|---|---------|
| Doublons encodage | 32 | keep / delete / objets à réaffecter (PT=12, pay=0, docs=0) |
| Facturée sans CSV | 25 | arbitrage manuel |
| Multiples | 2 | candidats + clé de collision |
| CSV orphelines | 41 | classées (37 effectif>1 · 1 attention · 3 autre) |

**Attente réponses ligne à ligne** avant toute suppression / création.

### C — Rapprochement → `instructors` (proposition, hors dépôt)

| Méthode (805 avec formateur) | n | Réf. croisement Excel |
|---------------------------------|-----------------------|
| email | **707** | 719 |
| alias exact | **65** | } 96 |
| alias fuzzy | **33** | } |
| ambigu | **0** | 0 |
| sans formateur (DB) | **101** | 35 CSV |

Liste des **98** alias (libellé, proposé, méthode, score) : `/opt/cursor/artifacts/point3_C_alias_98.md`.  
**Aucune écriture `instructor_id`** tant que « OK C ».

### Code

- `classifyInstructorComplement`, `prepareFormateurBackfill` — `src/lib/admin-import-engine.ts`
- `matchInscriptionsFormateur` — `src/lib/formateur-backfill-match.ts`
- Modes `/admin/import` : insert | complément | backfill formateur
- `scripts/build-formateur-rapprochement.ts` — sortie artifacts uniquement

## Validation restante

1. Accuser réception B  
2. Lire liste C-98 hors dépôt → « OK C » avant écriture `instructor_id`  
3. Réponses B2 ligne à ligne avant dédoublonnage / créations  
4. Prochains imports massifs via bouton `/admin/import`  
