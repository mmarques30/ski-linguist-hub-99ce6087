# État de l’application FLI Formation — 09/09/2026

Photographie exhaustive destinée à une analyse externe. **Aucune donnée personnelle.**  
Convention : **livré** = fusionné dans `main` **et** déployé sur l’app publiée ; sinon **prêt sur branche** / **sur main non déployé**.

---

## 0. Fusion & déploiement (tête de rapport)

### Fusionné dans `main` le 09/09/2026

| Élément | PR | SHA / note |
|---------|----|----|
| Point 4A — pistes UI stagiaire + certificat bilan Entrée/Sortie | #10 | inclus dans `e7571a2` puis `d84b056` |
| Point 1 — import `/admin/import` sécurisé | #11 | `d84b056` |
| Point 2 — exercice fiscal + numérotation | #11 | `d84b056` |
| Point 3 — formateur·rices (import, candidat, matching) | #11 | `d84b056` |

**SHA `main` au moment du rapport :** `1c59712` (merge #13) ; points 1–4A + certificat fusionnés via #10/#11 (`d84b056`).

### Déploiement app publiée

| Statut | Détail |
|--------|--------|
| **Livré (main + déployé)** | Lovable `deploy_project` sur `34e71e1a-49f7-433e-bb36-fc4d26e86f8e` — **https://ski-linguist-hub.lovable.app** (HTTP 200, `x-deployment-id` `57a31204-49e7-4bee-8c1a-4f90ab80e18a`) |
| Lovable commit publié | `1c597124` (= `main` post-#13) |
| Points 1–4A + certificat | **livré** (code sur `main` + app publiée) |
| Migration certificat DB | **appliquée live** — vue `inscriptions_complete` recréée avec colonnes bilan ; backfill déjà fait (435 `niveau_general_entree`) ; entrée `audit_log` `certificat_bilan` sans PII |

### Branches non fusionnées (reste)

| Branche | Raison |
|---------|--------|
| `cursor/point3-complement-backfill-7435` | Historique large / divergent ; **code utile** déjà repris dans #11 ; reste docs/ops hors dépôt + audits DB |
| `cursor/audit-pre-cutover-2026-09-7435` | Doc audit cutover — pas validé comme point produit |
| `cursor/auditoria-plano-refatoracao-fli-6852` | Plan refactor (PT) — hors plan points 1–10 |
| `cursor/dashboard-gestao-redesign-mockup-7ad2` | Mockup déjà partiellement sur main ; commits locaux restants |
| `cursor/update-ski-monitor-docs-a412` | Docs welcome pack Station 2022 — non validé |
| Anciennes `cursor/*-a412` / setup | Historique / déjà absorbées ou obsolètes |

---

## 1. Identité

| Champ | Valeur |
|-------|--------|
| Dépôt | `mmarques30/ski-linguist-hub-99ce6087` |
| Branche de référence | `main` @ `1c59712` |
| App | SPA Vite + React 18 + TypeScript « FLI Formation » (Lovable) |
| Projet Lovable | `34e71e1a-49f7-433e-bb36-fc4d26e86f8e` (Ski School Connect / ski-linguist-hub) |
| Backend | Supabase hébergé `nghkrmvakjomzmfwdhbo` — `https://nghkrmvakjomzmfwdhbo.supabase.co` |
| App publiée (URL) | **https://ski-linguist-hub.lovable.app** |
| Preview Lovable | https://id-preview--34e71e1a-49f7-433e-bb36-fc4d26e86f8e.lovable.app |
| Dernier déploiement | **09/09/2026** via Lovable MCP `deploy_project` |
| Package manager | npm (`package-lock.json` ; bun.lock aussi présent) |

---

## 2. Arborescence commentée

### `src/`
| Dossier | Rôle |
|---------|------|
| `src/` | Entrée SPA (`main.tsx`, `App.tsx`, styles) |
| `assets/` | Logos / images marque |
| `components/` | UI métier + `ui/` shadcn |
| `components/admin/` | Import, saisons, pricing |
| `components/auth/` | Routes protégées staff/stagiaire |
| `components/commercial/` | Leads |
| `components/dashboard/` | Dashboard live + `mockup/` |
| `components/endpack/` | Pack fin de formation / certificat |
| `components/evaluation/` | Évaluations orales SNMSF |
| `components/finance/` | Finance UI |
| `components/formateurs/` | Instructors UI |
| `components/inscriptions/` | Dossiers, bilan, docs, J-10 |
| `components/invoices/` | Factures |
| `components/layout/` | Shell / sidebar |
| `components/moniteurs/` | CRM moniteurs ski |
| `components/partners/` | Partenaires ESF |
| `components/registration/` | Wizard public `/register` |
| `components/sessions/` | Sessions |
| `components/settings/` | Stripe settings |
| `components/students/` | Accès portail stagiaire (staff) |
| `components/survey/` | Satisfaction |
| `contexts/` | i18n |
| `data/` | Questions placement, phrases |
| `hooks/` | React Query / Supabase |
| `integrations/supabase/` | Client + `types.ts` généré |
| `lib/` | Moteurs purs (import, fiscal, placement, certificat…) |
| `pages/` | Écrans routés |
| `services/` | Appels edge (registration) |

### `supabase/`
| Dossier | Rôle |
|---------|------|
| `migrations/` | DDL / RLS / crons / triggers (~49 fichiers) |
| `functions/` | Edge Deno (Stripe, register, invites, reminders…) |
| `functions/_shared/` | Helpers partagés |
| `config.toml` | Config CLI |

### `scripts/`
| Dossier | Rôle |
|---------|------|
| `scripts/` | Imports one-shot, rapprochement formateurs, Stripe setup |
| `scripts/sql/` | SQL ops (ex. finaliser vue certificat) |

### `docs/`
| Fichier / dossier | Rôle |
|-------------------|------|
| `BACKLOG.md` | Dette ouverte / points |
| `POINT_1…4`, `CERTIFICAT_…` | Specs points validés |
| `MIGRATION_PLAN.md` | Cutover |
| `TESTING_GUIDE.md` | Tests manuels |
| `STRIPE_SETUP.md` | Stripe (partiellement obsolète) |
| `ADR-placement-tests.md` | ADR placement |

---

## 3. Routes (`src/App.tsx`)

| Route | Auth | Écran | État |
|-------|------|-------|------|
| `/auth` | public | Login | Fonctionnel |
| `/register` | public | Inscription multi-étapes | Fonctionnel |
| `/register/payment-success` | public | Retour Stripe | Fonctionnel |
| `/register/payment-cancel` | public | Annulation Stripe | Fonctionnel |
| `/survey/:token` | public | Satisfaction | Fonctionnel |
| `/mockup/dashboard-gestao` | public | Mockup dashboard | Maquette |
| `/` | staff | Dashboard gestão | Fonctionnel |
| `/finance` (+ analyses, rentabilité, trésorerie, payments, charges-fixes) | staff | Finance | Fonctionnel |
| `/gestion/commercial` | staff | Leads | Fonctionnel |
| `/gestion/moniteurs` | staff | Moniteurs ski | Fonctionnel |
| `/gestion/partenaires` `/:id` | staff | Partenaires | Fonctionnel |
| `/inscriptions` | staff | Liste | Fonctionnel |
| `/inscriptions/schedule-validation` | staff | Horaires J-10 | Fonctionnel (valeurs horaires FLI → BL-019) |
| `/inscriptions/:id` | staff | Détail + bilan + end pack | Fonctionnel |
| `/invoices` | staff | Factures | Fonctionnel |
| `/students` `/:id` `/:id/portal-preview` | staff | Stagiaires | Fonctionnel |
| `/tests` | staff | Placement / candidats tests | Fonctionnel |
| `/formation/sessions` | staff | Sessions | Fonctionnel |
| `/classes` | redirect | → sessions | Legacy |
| `/documents` | staff | Bibliothèque docs | Maquette (liste vide) |
| `/settings` | staff | Paramètres | Partiel (Stripe OK ; prefs générales non persistées) |
| `/admin/import` | staff | Import sécurisé | Fonctionnel (point 1) |
| `/admin/import-phrases` `/admin/phrases` | staff | Phrases | Fonctionnel |
| `/admin/testing` | staff | Checklist manuelle | Fonctionnel |
| `/admin/users` `/admin/seasons` | staff | Users / saisons | Fonctionnel |
| `/formateur/evaluations` (+ form/view) | staff | Évals SNMSF | Fonctionnel |
| `/formateurs` `/:id` | staff | Formateur·rices | Fonctionnel |
| `/amelioration` | staff | Amélioration continue | Fonctionnel |
| `/satisfaction-stats` | staff | Stats satisfaction | Fonctionnel |
| `/qualite/audit` `/qualite/historique` | staff | Qualiopi / audit_log | Fonctionnel |
| `/student/*` | stagiaire | Portail | Fonctionnel |

---

## 4. Modèle de données

**Source colonnes live :** Lovable `query_database` / `information_schema` (**53 tables** + 2 vues).  
**DDL live :** `/opt/cursor/artifacts/ETAT_APP_2026-09_live_schema.sql` (+ dump enrichi `ETAT_APP_2026-09_schema.sql`, `columns.json`, `policies.json`).  
**Comptes de lignes :** `COUNT(*)` snapshot **09/09/2026** (sans PII) — `/opt/cursor/artifacts/ETAT_APP_2026-09_row_counts.tsv` ; meta : `ETAT_APP_2026-09_live_meta.json`.  
**Référence repo :** `src/integrations/supabase/types.ts`.

### Comptes de lignes (live, highlights)

| Table / vue | Lignes |
|-------------|--------|
| `ski_monitors` | 4047 |
| `audit_log` | 5194 |
| `partners` | 1032 |
| `inscriptions` / `inscriptions_complete` | 906 |
| `students` | 667 |
| `placement_tests` | 596 |
| `partner_contacts` | 209 |
| `instructors` | 71 |
| `registration_offerings` | 52 |
| `user_permissions` | 14 |
| `user_roles` / `profiles` | 3 |
| Tables vides (ex.) | `invoices`, `sessions`, `certificates`, `test_bookings` → 0 |

### Tables (nom · n colonnes live / lignes)

`accommodations` 6/0 · `app_settings` 6/1 · `audit_log` 9/5194 · `availability_requests` 11/0 · `certificates` 11/0 · `continuous_improvement` 11/0 · `cost_templates` 6/0 · `course_intakes` 16/0 · `document_sendings` 8/0 · `email_log` 10/0 · `email_templates` 12/1 · `fixed_costs` 9/0 · `formation_costs` 12/0 · `funding_documents` 6/0 · `funding_requests` 19/0 · `inscriptions` 79/906 · `instructor_availabilities` 10/0 · `instructor_contracts` 18/0 · `instructor_payments` 12/0 · `instructor_sessions` 11/0 · `instructors` 36/71 · `intake_outreach_log` 8/0 · `invoices` 24/0 · `leads` 20/0 · `notifications` 8/0 · `partner_contacts` 8/209 · `partner_contracts` 11/0 · `partners` 15/1032 · `payment_reminders` 9/0 · `payments` 22/1 · `placement_test_questions` 11/0 · `placement_tests` 12/596 · `pricing_rules` 12/0 · `profiles` 6/3 · `prospects` 13/0 · `qualiopi_indicators` 14/1 · `registration_offerings` 17/52 · `satisfaction_surveys` 18/0 · `scheduled_reminders` 8/0 · `schools_invoice_policy` 5/0 · `seasons` 11/1 · `session_enrollments` 7/0 · `sessions` 18/0 · `ski_monitors` 12/4047 · `ski_schools` 9/15 · `students` 13/667 · `test_bookings` 14/0 · `test_candidates` 12/0 · `test_criteria` 8/0 · `test_evaluations` 29/0 · `test_phrases` 13/0 · `user_permissions` 6/14 · `user_roles` 3/3

### Vues
- `inscriptions_complete` (906) — jointure stagiaire / formateur / école + **colonnes bilan** (`niveau_*_entree/sortie`, `objectif_atteint`, `commentaire_sortie`, horodatages formulaires, champs formateur texte) — **OK en live**
- `test_bookings_complete` (0)

### Bilan certificat (agrégats live uniquement)
| Mesure | Valeur |
|--------|--------|
| Backfill legacy → bilan | **fait** (`need_*_backfill` = 0) |
| `niveau_general_entree` renseigné | 435 / 906 |
| `niveau_technique_sortie` renseigné | 13 / 906 |
| Audit | `point=certificat_bilan`, `mode=legacy_levels_backfill_and_view`, `rows_updated=0` — **sans noms personnels** |
| Qualiopi PROC-026 | seed présent (`status=en_cours`) |

### RPC / fonctions SQL (signatures utiles live)
`activate_season` · `audit_trigger_func` · `before_invoice_insert` · `check_invoice_payment_status` · `generate_contract_number` · `generate_inscription_code` · `get_fiscal_year(date)` · `get_instructor_contract_by_signature_token` · `get_my_student_id` · `get_satisfaction_survey_context` · `get_user_role` · `handle_new_user` · `has_role` · `is_admin` · `is_staff` · `is_student` · `match_candidate_to_student` · `on_funding_status_change` · `set_inscription_code` · `sign_instructor_contract_by_token` · `submit_satisfaction_survey_by_token` · `update_test_phrases_updated_at` · `update_updated_at_column` · `validate_inscription_status_transition`

### RLS
Activée sur les tables métier (migrations 20260406 / 20260412 / 20260731). Politiques staff via `is_staff()` / admin via `is_admin()` / stagiaire via `is_student()` + `get_my_student_id()`.

### Triggers notables
- `before_invoice_insert` — numérotation + TVA  
- `audit_trigger_func` — journal `audit_log`  
- `updated_at` sur plusieurs tables  

---

## 5. Edge functions

| Nom | Rôle | Déclencheur | Env requises (noms) | État |
|-----|------|-------------|---------------------|------|
| `submit-registration` | Persiste inscription publique + emails | HTTP | `SUPABASE_*`, `RESEND_API_KEY`, `APP_URL` | Déployée (utilisée) |
| `create-registration-checkout` | Stripe Checkout | HTTP | `STRIPE_SECRET_KEY`, `SUPABASE_*` | Déployée |
| `verify-registration-checkout` | Vérifie session | HTTP | idem | Déployée |
| `stripe-webhook` | Events Stripe | HTTP webhook | `STRIPE_WEBHOOK_SECRET` | Déployée (config à confirmer) |
| `provision-stripe-webhook` | Provision endpoint | HTTP admin | `STRIPE_SECRET_KEY` | Déployée |
| `check-stripe-config` | Diagnostic | HTTP | Stripe + Supabase | Déployée |
| `create-user` | Provision users | HTTP admin | `SUPABASE_SERVICE_ROLE_KEY` | Déployée |
| `invite-student-portal` | Invite auth stagiaire | HTTP admin | Resend + service-role | Déployée |
| `import-ski-monitors` | Import moniteurs | HTTP + secret | `IMPORT_SECRET` | Déployée |
| `process-intake-outreach` | Mails intakes | HTTP / cron | Resend | Déployée ; **BL-006** sans unsubscribe |
| `process-schedule-reminders` | Alerte J-10 | cron | Resend, `ADMIN_EMAIL` | Déployée |
| `process-invoice-reminders` | Relances factures | cron | Resend | Déployée ; crons **BL-007** `pg_net` |
| `process-survey-reminders` | Relances survey | cron | Resend | idem |
| `generate-monthly-charges` | Charges fixes mensuelles | cron | — | idem |

Dernière exécution connue : **non lue** (pas d’accès dashboard functions ce jour).

---

## 6. Crons

Déclarés dans migrations (`pg_cron` + `pg_net` vers edge) :
- `generate-monthly-charges`
- `process-invoice-reminders`
- `process-survey-reminders`
- `process-schedule-reminders` (quotidien, J-10)

**État :** backlog **BL-007** — jobs actifs mais échecs si `pg_net` absent. Dernier résultat : non consultable sans SQL admin.

---

## 7. Intégrations

| Intégration | État |
|-------------|------|
| **Stripe** | Checkout register + webhook + settings UI ; mode live/test selon `STRIPE_SECRET_KEY` ; webhook secret env ou `app_settings` |
| **Resend** | Emails (register, invites, reminders, outreach) si `RESEND_API_KEY` ; dernier envoi non audité ici |
| **Storage** | Buckets `documents`, `funding-documents` ; certificats → `documents/certificates/…` |
| **Google** | Champs Meet/event sur `test_bookings` — intégration partielle / legacy |
| **Supabase Auth** | Staff + stagiaires ; signups self-service **désactivés** (AGENTS.md) |

---

## 8. Modules fonctionnels

| Module | Fonctionne | Partiel | Absent |
|--------|------------|---------|--------|
| Inscriptions | CRUD, statuts, détail, timeline, accès client | Encodage `entry_level` | — |
| Stagiaires | Liste, détail, invites portail | — | — |
| Formateur·rices | CRUD, candidat, import 69, matching | UI candidat→actif (BL-014) ; rattachement ligne à ligne | Portail formateur bilan (admin only) |
| Placement | Test adaptatif pistes, admin CECRL | — | — |
| Évaluations SNMSF | Formulaire + PDF + phrases | Prix test non unifié | — |
| Certificats | Bilan Entrée/Sortie, garde sortie, PDF, vue live OK | PDF storage policies (reste BL-020 partiel) | Lien email formateur |
| Facturation | CRUD, TVA, numérotation fiscale | Import historique point 9 | — |
| Paiements | Stripe + chèques/virements | — | — |
| Finance | Dashboards, rentabilité, charges | — | — |
| CRM / leads | Kanban commercial | — | — |
| Moniteurs | CRM + intakes + outreach | Unsubscribe (BL-006) | — |
| Partenaires | ESF + import directeurs | — | — |
| Portail stagiaire | Dashboard, docs, planning, pistes | — | — |
| Qualiopi | Indicateurs + PROC-026 | — | — |
| Satisfaction | Survey token + stats | — | — |
| Amélioration continue | CRUD | — | — |
| Documents | Envois welcome pack | Page `/documents` maquette | — |
| Import | Moteur dry-run/purge/audit | Cartes FLI (BL-001) | — |
| Paramètres | Stripe | Prefs générales non persistées | — |

Fichiers clés : `src/pages/**`, `src/hooks/**`, `src/lib/**`, `supabase/functions/**`.

---

## 9. Décisions métier codées

| Règle | Où |
|-------|-----|
| Exercice fiscal AA-AA (transition 25-26, puis juil–juin) | `src/lib/fiscal-year.ts` ; SQL `get_fiscal_year` migration `20260909140000_…` |
| Numérotation `{exercice}.{séquence}`, plancher 14297 | même migration `before_invoice_insert` |
| TVA formation 0 % / test & soustraitance 20 % | trigger invoices ; `admin-import-engine.ts` |
| Pistes stagiaire / CECRL staff | `placement-test-engine.ts` ; `docs/POINT_4_…` |
| Certificat = bilan Entrée/Sortie, jamais piste finale, disclaimer SNMSF | `certificate-progression.ts` ; `CERTIFICAT_BILAN_PROGRESSION.md` |
| Acompte / frais dossier **150 €** | `src/lib/registration-payments.ts` (`FRAIS_DOSSIER_EUR`) |
| J-10 horaires | `process-schedule-reminders` `DAYS_BEFORE_START=10` ; UI `ScheduleValidation` |
| Alias fuzzy formateur score ≥ 0,5 | `scripts/build-formateur-rapprochement.ts` `ALIAS_FUZZY_MIN_SCORE` |
| Prix évaluation orale | via `invoice_type=test` + bookings ; **pas** de constante € unique côté front |

---

## 10. Qualité

| Check | Résultat 09/09 |
|-------|----------------|
| `npm test` (Vitest) | **23 passed** / 6 files |
| `npm run build` | **OK** |
| `npm run lint` | **FAIL** — 102 errors / 16 warnings (surtout `@typescript-eslint/no-explicit-any`) — préexistant (AGENTS.md) |
| Dépendances majeures | React 18.3 · Vite 5.4 · Supabase-js 2.90 · TanStack Query 5.83 · Vitest 4.1 · jspdf 4 · Tailwind 3.4 |
| Dette | Voir §11 + BL-* ; `/documents` maquette ; Settings partiel ; policies storage certificats |

---

## 11. Backlog & plan points 1–10

Intégré depuis `docs/BACKLOG.md` :

**Ouvert :** BL-001, 002, 006, 007, 008, 009, 010, 011, 014, 015, 017, 019, 020 (reste policies storage).

| Point | État |
|-------|------|
| 1 Import sécurisé | **Livré** (main + déployé) |
| 2 Fiscal | **Livré** |
| 3 Formateurs | **Livré** |
| 4A Pistes | **Livré** |
| Certificat bilan | **Livré** (vue + colonnes + backfill live OK) |
| 5 Outreach | Non démarré |
| 6 Stripe docs | Non démarré |
| 7 Phrases | Non démarré |
| 8 Crons / relances | Non démarré |
| 9 Import factures / données | Non démarré |
| 10 J-10 horaires FLI | Non démarré (BL-019) |

---

## 12. Sécurité

| Sujet | État |
|-------|------|
| Rôles | `admin` / staff (`is_staff`) / `student` ; permissions par route (`user_permissions`) |
| Secrets (noms) | Frontend : `VITE_SUPABASE_*` ; Edge : `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_*`, `RESEND_API_KEY`, `IMPORT_SECRET`, `ADMIN_EMAIL`, `APP_URL` |
| Valeurs | **Jamais** dans ce rapport ni dans les bundles |
| Dépôt | GitHub privé/équipe (accès agent limité en écriture PR) |
| Exposition | Anon key dans `.env` commitée (normal Supabase) ; service-role **ne doit pas** être front |
| Signups | Désactivés ; users via `create-user` |
| Incidents connus | Crons `pg_net` (BL-007) ; MCP Lovable rétabli le 09/09 (counts + deploy OK) |

---

## 13. Livrables satellites (hors dépôt)

| Fichier | Contenu |
|---------|---------|
| `/opt/cursor/artifacts/ETAT_APP_2026-09_code.txt` | Bundle source concaténé — **374 fichiers**, **≈ 2,27 Mo** (sous 3 Mo, **1 partie**) |
| `/opt/cursor/artifacts/ETAT_APP_2026-09_schema.sql` | DDL live enrichi (pg_catalog via Lovable) — sans PII |
| `/opt/cursor/artifacts/ETAT_APP_2026-09_live_schema.sql` | DDL live (`information_schema` + `pg_get_viewdef`) — sans données |
| `/opt/cursor/artifacts/ETAT_APP_2026-09_columns.json` | Colonnes live (catalog) |
| `/opt/cursor/artifacts/ETAT_APP_2026-09_policies.json` | Policies RLS live |
| `/opt/cursor/artifacts/ETAT_APP_2026-09_row_counts.tsv` | COUNT(*) tables + vues (pas de PII) |
| `/opt/cursor/artifacts/ETAT_APP_2026-09_live_meta.json` | Meta deploy + agrégats bilan |
| `/opt/cursor/artifacts/ETAT_APP_2026-09_deploy.txt` | Trace `deploy_project` + URL |
| `/opt/cursor/artifacts/etat_deploy_verify.log` | Headers HTTP publiés |
| `/opt/cursor/artifacts/ETAT_APP_2026-09_tables_types.tsv` | Colonnes/types depuis `types.ts` |
| `/opt/cursor/artifacts/etat_vitest.log` / `etat_lint.log` | Sorties brutes qualité |

Exclusions bundle : `node_modules`, `dist`, `.env`, images/binaires, CSV/JSON de données, `src/integrations/supabase/types.ts` (remplacé par schéma + TSV).

---

*Fin du rapport d’état — 09/09/2026 (rafraîchi : counts live + déploiement).*
