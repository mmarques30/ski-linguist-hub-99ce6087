# Backlog FLI — problèmes repérés hors point en cours

Règle : noter ici, **ne pas corriger** tant que le point courant n’est pas validé et que Paula n’a pas ouvert le sujet.

Dernière mise à jour : 2026-09-09 (point 3 — import 69 formateur·rices écrit).

## Ouvert

| ID | Constat | Où | Priorité suggérée |
|----|---------|-----|-------------------|
| BL-001 | Cartes `FliInscriptionsImportCard` / `FliFormResponsesImportCard` sans dry-run / audit alignés | `src/components/admin/Fli*.tsx` | Avant gros imports via ces cartes |
| BL-002 | Libellés `entry_level` corrompus (« Faux d�butant ») | `inscriptions` | SQL réversible |
| BL-005 | CECRL affiché au stagiaire sur `/register` et portail | Placement / portail | Point 4 |
| BL-006 | `process-intake-outreach` sans unsubscribe | edge function | Point 5 |
| BL-007 | Crons charges / relances en échec (`pg_net` absent) | `cron.job` | Point 8 |
| BL-008 | `docs/STRIPE_SETUP.md` obsolète | docs | Point 6 |
| BL-009 | Vérifier docs externes « purger toutes les données » | docs | Faible |
| BL-010 | Phrases test 321 vs 540 metadata | `src/data/` | Point 7 |
| BL-011 | Type DB `soustraitance` vs `sous_traitance` | invoices CHECK | Plus tard |
| BL-012 | Mocks dashboard codes `FLI-YYYY-…` | mockData | Cosmétique |
| BL-014 | Pas d’UI « candidat → actif » (action Paula) | formateurs | Avec module recrutement |
| BL-015 | Colonne texte `inscriptions.formateur` pour matching alias (si absente à l’import historique) | inscriptions | Avant rapprochement historique |
| BL-016 | `date_entree` formateur toujours absente (CSV n’en avait pas) | instructors | Si besoin BPF |

## Clos

| ID | Résolution |
|----|------------|
| BL-003 | Colonnes dédiées formateur (alias, consentements, statut_administratif, etc.) — migration point 3 |
| BL-004 | Point 2 : exercice AA-AA + numérotation |
| BL-013 | Statut `candidat` ajouté au CHECK (`actif`/`inactif`/`candidat`) |

## Validations points

| Point | Statut |
|-------|--------|
| 1 — Import sécurisé | Validé Paula 2026-09-09 |
| 2 — Exercice + numérotation | Validé Paula 2026-09-09 |
| 3 — Import formateur·rices | 69 écrits — en attente validation Paula |
| 4–10 | Non démarrés |
