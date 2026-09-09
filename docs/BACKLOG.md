# Backlog FLI — problèmes repérés hors point en cours

Règle : noter ici, **ne pas corriger** tant que le point courant n’est pas validé et que Paula n’a pas ouvert le sujet.

Dernière mise à jour : 2026-09-09 (point 3 — import formateur·rices, dry-run).

## Ouvert

| ID | Constat | Où | Priorité suggérée |
|----|---------|-----|-------------------|
| BL-001 | Cartes `FliInscriptionsImportCard` / `FliFormResponsesImportCard` sur `/admin/import` n’ont pas encore le même dry-run / journal `audit_log` / CSV rejets que l’import générique | `src/components/admin/Fli*.tsx` | Avant gros imports via ces cartes |
| BL-002 | Libellés `entry_level` corrompus (« Faux d�butant ») — mauvais encodage historique | table `inscriptions` | Correction données avec SQL réversible |
| BL-003 | Pas de colonnes dédiées civilité / pays / date_naissance / consentements / date_entree sur `instructors` — stockés en `status_notes` à l’import | `instructors` | Après cutover si besoin reporting |
| BL-005 | CECRL affiché au stagiaire sur `/register` et portail | PlacementTestStep, ConfirmationStep, StudentDashboard | Point 4 |
| BL-006 | `process-intake-outreach` sans unsubscribe ; capable de mass-mail | edge function | Point 5 |
| BL-007 | Crons `generate-monthly-charges` / `process-invoice-reminders` actifs mais en échec (`pg_net` absent) | `cron.job` | Point 8 |
| BL-008 | `docs/STRIPE_SETUP.md` obsolète vs secret saisi le 09/09 | docs | Point 6 |
| BL-009 | Vérifier qu’aucune doc externe ne répète « purger toutes les données » | docs / onboarding | Faible |
| BL-010 | Metadata `test_phrases_import.json` dit 540, fichier en contient 321 — remplacé par fichier Paula au point 7 | `src/data/` | Point 7 |
| BL-011 | Type DB `soustraitance` vs formulation `sous_traitance` | CHECK invoices | Plus tard |
| BL-012 | Mocks dashboard / checklist affichent encore `FLI-YYYY-…` | mockData, TestingChecklist | Cosmétique |
| BL-013 | CHECK `instructors.status` sans `CANDIDAT` — candidats mappés INACTIF + note | instructors | Décision Paula (point 3) |

## Clos

| ID | Résolution |
|----|------------|
| BL-004 | Point 2 (branche `cursor/invoice-fiscal-numbering-7435`) : exercice AA-AA + `{exercice}.{séquence}` |

## Validations points

| Point | Statut |
|-------|--------|
| 1 — Import sécurisé | Validé Paula 2026-09-09 |
| 2 — Exercice + numérotation | Validé Paula 2026-09-09 (+ complément oct–sep / Fact FLI) |
| 3 — Import formateur·rices | Dry-run 69/69 — en attente décisions + OK écriture |
| 4–10 | Non démarrés |
