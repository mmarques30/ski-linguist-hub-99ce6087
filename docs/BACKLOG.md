# Backlog FLI — problèmes repérés hors point en cours

Règle : noter ici, **ne pas corriger** tant que le point courant n’est pas validé et que Paula n’a pas ouvert le sujet.

Dernière mise à jour : 2026-09-09 (point 3 validé + compléments ; point 4 ouvert).

## Ouvert

| ID | Constat | Où | Priorité suggérée |
|----|---------|-----|-------------------|
| BL-001 | Cartes FLI inscriptions / form responses sans dry-run / audit alignés sur `/admin/import` | `Fli*.tsx` | **Avant point 9** |
| BL-002 | Libellés `entry_level` corrompus | `inscriptions` | SQL réversible |
| BL-005 | CECRL affiché au stagiaire | register / portail | **Point 4** |
| BL-006 | Outreach sans unsubscribe | edge | Point 5 |
| BL-007 | Crons `pg_net` absent | cron | Point 8 |
| BL-008 | STRIPE_SETUP obsolète | docs | Point 6 |
| BL-009 | Docs « purger toutes les données » | docs | Faible |
| BL-010 | Phrases 321 vs 540 | data | Point 7 |
| BL-011 | `soustraitance` vs `sous_traitance` | invoices | Plus tard |
| BL-012 | Mocks `FLI-YYYY-…` | mockData | Cosmétique |
| BL-014 | UI candidat → actif | formateurs | Module recrutement |
| BL-015 | Backfill `inscriptions.formateur` depuis CSV Excel (libellés perdus à l’import histo.) | inscriptions | **Avant rattachement** |
| BL-016 | `date_entree` formateur absente | instructors | Si BPF |
| BL-017 | Import point 3 écrit hors UI `/admin/import` | ops | Respecter UI avant point 9 |

## Clos

| ID | Résolution |
|----|------------|
| BL-003 | Colonnes dédiées formateur — point 3 |
| BL-004 | Point 2 fiscal |
| BL-013 | Statut `candidat` |

## Validations points

| Point | Statut |
|-------|--------|
| 1 — Import sécurisé | Validé Paula ; **à respecter avant point 9** (BL-001, BL-017) |
| 2 — Exercice + numérotation | Validé Paula |
| 3 — Import formateur·rices | Validé 69/colonnes/filtre ; rapport dry-run+audit OK ; **rapprochement bloqué** (CSV Formateur) |
| 4 — CECRL hors UI stagiaire | En cours |
| 5–10 | Non démarrés |
