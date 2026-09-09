# Backlog FLI — hors point en cours

Règle : noter ici, **ne pas corriger** tant que le point courant n’est pas validé.

Dernière mise à jour : 2026-09-09 (rapport d’état + fusion points validés).

## Ouvert

| ID | Constat | Priorité |
|----|---------|----------|
| BL-001 | Cartes FLI import sans dry-run/audit alignés `/admin/import` | Avant point 9 |
| BL-002 | `entry_level` corrompus historiques | SQL |
| BL-006 | Outreach sans unsubscribe | Point 5 |
| BL-007 | Crons `pg_net` | Point 8 |
| BL-008 | STRIPE_SETUP obsolète | Point 6 |
| BL-009 | Docs « purger toutes les données » | Faible |
| BL-010 | Phrases 321 vs 540 | Point 7 |
| BL-011 | `soustraitance` vs `sous_traitance` | Plus tard |
| BL-014 | UI candidat → actif | Recrutement |
| BL-015 | Backfill formateur CSV (si restes) | Avant rattachement |
| BL-017 | Imports massifs hors UI | Avant point 9 |
| BL-019 | J-10 horaires FLI exacts + pas de code depuis horaires | Point 10 |
| BL-020 | Vue `inscriptions_complete` + policies storage certificats | Ops |

## Clos / remplacé

| ID | Note |
|----|------|
| BL-003 | Colonnes formateur — point 3 |
| BL-004 | Exercice fiscal + numérotation — point 2 |
| BL-005 | CECRL hors UI stagiaire (pistes) — point 4 |
| BL-013 | Statut `candidat` |
| BL-018 | Mapping certificat→piste remplacé par bilan Entrée/Sortie |

## Validations points

| Point | Statut livré (= main + déployé) |
|-------|----------------------------------|
| 1 — Import sécurisé | Voir en-tête `ETAT_APP_2026-09.md` |
| 2 — Fiscal | idem |
| 3 — Formateurs | idem |
| 4A — Pistes | Sur main (PR #10) |
| Certificat bilan | Sur main (PR #10) |
| 5–10 | Non démarrés |
