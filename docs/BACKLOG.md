# Backlog FLI — hors point en cours

Règle : noter ici, **ne pas corriger** tant que le point courant n’est pas validé.

Dernière mise à jour : 2026-09-11 (emails + kit sur main ; C.1 rôle formateur ouvert).

## Ouvert

| ID | Constat | Priorité |
|----|---------|----------|
| BL-001 | Cartes FLI import sans dry-run/audit alignés `/admin/import` | Avant point 9 |
| BL-002 | `entry_level` corrompus historiques | SQL |
| BL-007 | Crons `pg_net` | Point 8 |
| BL-008 | STRIPE_SETUP obsolète | Point 6 |
| BL-009 | Docs « purger toutes les données » | Faible |
| BL-010 | Phrases 321 vs 540 | Point 7 |
| BL-011 | `soustraitance` vs `sous_traitance` | Plus tard |
| BL-014 | UI candidat → actif | Recrutement |
| BL-015 | Backfill formateur CSV (si restes) | Avant rattachement |
| BL-017 | Imports massifs hors UI | Avant point 9 |
| BL-019 | J-10 horaires FLI exacts + pas de code depuis horaires | Point 10 |
| BL-020 | Policies storage certificats (vue `inscriptions_complete` OK live) | Ops |
| BL-022 | `instructors.cv_url` : 16 liens `drive.google.com`, hors Supabase Storage — rapatriement à cadrer | Faible |

## Clos / remplacé

| ID | Note |
|----|------|
| BL-003 | Colonnes formateur — point 3 |
| BL-004 | Exercice fiscal + numérotation — point 2 |
| BL-005 | CECRL hors UI stagiaire (pistes) — point 4 |
| BL-013 | Statut `candidat` |
| BL-018 | Mapping certificat→piste remplacé par bilan Entrée/Sortie |
| BL-021 | Bucket `documents` privé — point A2, `docs/SECURITE_A2_BUCKET_DOCUMENTS.md` |
| BL-006 | Outreach sans unsubscribe — traité par le gel, point 5, `docs/GEL_PROSPECTION_MONITEURS.md`. Condition de réouverture vérifiée à l'exécution. |

## Validations points

| Point | Statut livré (= main + déployé) |
|-------|----------------------------------|
| 1 — Import sécurisé | **Livré** — `https://ski-linguist-hub.lovable.app` |
| 2 — Fiscal | **Livré** |
| 3 — Formateurs | **Livré** |
| 4A — Pistes | **Livré** |
| Certificat bilan | **Livré** (vue + backfill live OK) |
| A — `test_evaluations` + certificats | **Livré** — `docs/SECURITE_A_TEST_EVALUATIONS.md` |
| A2 — buckets privés | **Livré** — `docs/SECURITE_A2_BUCKET_DOCUMENTS.md` |
| 5 — Gel prospection moniteurs | Fusionné main (PR #18) — `docs/GEL_PROSPECTION_MONITEURS.md` ; fonction Edge à déployer |
| 8-minimal emails | Fusionné main (PR #20) — attente `RESEND_API_KEY` — `docs/EMAILS_8_MINIMAL.md` |
| Kit ZZTEST | Fusionné main (PR #21) |
| C.1 — rôle formateur | Ouvert — `docs/POINT_C1_ROLE_FORMATEUR.md` |
| 6, 7, 9, 10 | Non démarrés. Confirmation email (lieu, modalité, piste, paiement) : texte au point 8 complet |
