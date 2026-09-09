# Backlog FLI — problèmes repérés hors point en cours

Règle : noter ici, **ne pas corriger** tant que le point courant n’est pas validé et que Paula n’a pas ouvert le sujet.

Dernière mise à jour : 2026-09-09 (pendant le point 1 — import sécurisé).

## Ouvert

| ID | Constat | Où | Priorité suggérée |
|----|---------|-----|-------------------|
| BL-001 | Cartes `FliInscriptionsImportCard` / `FliFormResponsesImportCard` sur `/admin/import` n’ont pas encore le même dry-run / journal `audit_log` / CSV rejets que l’import générique | `src/components/admin/Fli*.tsx` | Après point 1, avant gros imports via ces cartes |
| BL-002 | Libellés `entry_level` corrompus (« Faux d�butant ») — mauvais encodage historique | table `inscriptions` | Après validation du parseur (point 1) — correction données avec SQL réversible |
| BL-003 | Colonne dédiée `date_entree` absente sur `instructors` ; le point 1 stocke provisoirement la date dans `status_notes` | `instructors` | Point 3 (import formateur·rices) — décider colonne vs status_notes |
| BL-004 | `get_fiscal_year` = année civile ; numérotation `FLI-YYYY-NNNN` ≠ règle FLI | SQL + finance | Point 2 |
| BL-005 | CECRL affiché au stagiaire sur `/register` et portail | PlacementTestStep, ConfirmationStep, StudentDashboard | Point 4 |
| BL-006 | `process-intake-outreach` sans unsubscribe ; capable de mass-mail | edge function | Point 5 |
| BL-007 | Crons `generate-monthly-charges` / `process-invoice-reminders` actifs mais en échec (`pg_net` absent) | `cron.job` | Point 8 |
| BL-008 | `docs/STRIPE_SETUP.md` obsolète vs secret saisi le 09/09 | docs | Point 6 |
| BL-009 | Instructions UI historiques encourageaient « purger toutes les données » avant import — retiré du générique ; vérifier qu’aucune doc externe ne le répète | docs / onboarding | Faible |
| BL-010 | Metadata `test_phrases_import.json` dit 540, fichier en contient 321 — remplacé par fichier Paula au point 7 | `src/data/` | Point 7 |

## Clos

_(vide)_
