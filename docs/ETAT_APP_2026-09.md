# État de l’application FLI Formation — 21/09/2026

Photographie destinée à une analyse externe. **Aucune donnée personnelle.**  
Convention : **livré** = fusionné dans `main` **et** déployé sur l’app publiée ; sinon **prêt sur branche** / **sur main non déployé**.

---

## 0. Fusion & déploiement (tête de rapport)

### Fusionné dans `main` (rafraîchi 21/09/2026 — incl. #85)

| Élément | PR | Note |
|---------|----|------|
| Points 1–4A, certificat, A/A2, C.1–C.6, 5, 7–10, emails | divers | Voir `docs/BACKLOG.md` § Validations |
| Vague 1 register/settings | #44 | + BL-029 #45, BL-033 #42, BL-002 #30/#43 |
| **Plan produit UX Vague A** | #60, #61 | `/suivi/:token`, Assister stagiaire/formateur, `student_portal_enabled`, `/tests` pistes |
| **Plan produit UX Vague B** | #63 | Checklist inscription, Financier, rail « À traiter », `/student/test` |
| **Plan produit UX Vague C** | #64 | Sidebar Portails/Trésorerie, Pilotage, `canView` |
| **Plan produit UX Vague D** | #65 | États vides, GlobalSearch, `/notifications`, pont éval↔stagiaire |
| **PLANO Onda D (D1–D4)** | #67 | Pilotage finance, taxonomie langues, `SeasonContext`, journal `email_log` |
| Hotfix saison / objectif CA | #68 | Défaut filtre « toutes », bornes dates, `revenue_target ≤ 0` → non défini |
| **PLANO Onda D (D5–D8)** | #70 | Identité org sur PDF/emails + logo ; chrome i18n FR ; import upsert/export ; CRM leads |
| **BL octobre lot 1** | #71 | BL-032, 037, 040, 045 (affichage), 049 |
| **BL octobre lot 2** | #72 | BL-041, 044, 048 |
| **BL octobre lot 3** | #73 | BL-043 ; BL-042 Administratif (statut + contrats) |
| **BL octobre lot 4** | #74 | BL-034 saison ; vigilance ; GlobalSearch multi-jetons |
| **BL octobre lot 5** | #75 | BL-035 compte test ; BL-030 en-tête ; BL-050 badge banque |
| **BL octobre lot 6** | #76 | BL-027 OPCO/FIFPL séparés ; BL-038 signaux soft partenaires |
| **BL octobre lot 7** | #77 | Qualiopi ; statuts stagiaire ; dashboard ; BL-014 CTA candidat |
| **BL octobre lot 8** | #78 | `/documents` honnête ; pagination morte ; STRIPE_SETUP |
| **BL-038 hard dedup** | #80 | Détection doublons + fusion (filtre Doublons, mapping sous gel) |
| **BL-027 règle OPCO** | #82 | Questionnaire register ; propositions BO ; montants éditables |
| **Édition admin partout** | #83 | `useConfirmAction` ; confirmation avant chaque mutation BO |
| **BL-007 crons + notifs** | #85 | Crons email + avancement actifs ; producteurs notifs BO |
| Sync types Lovable | — | `types.ts` leads + `funding_requests.payer_type` |

**SHA `main` au moment de ce refresh :** `aa7098e` (republish edge + merge #85).

### Déploiement app publiée

| Statut | Détail |
|--------|--------|
| App | **https://plateforme.fli.fr** (alias Lovable → `ski-linguist-hub.lovable.app`) |
| Alignement front ↔ `main` | **Aligné** 21/09 — publié après #82–#85 |
| Edges / Resend | **19/19** ; `RESEND_API_KEY` OK ; Stripe OK ; BL-047 **clos** ; crons BL-007 **actifs** ; `process-invoice-reminders` **republie** 21/09 (notif facture échue) |

### Branches non fusionnées (reste)

Historique / hors plan : voir anciennes notes ; les vagues UX A–D et C.1–C.6 sont sur `main`.

---

## 1. Identité

| Champ | Valeur |
|-------|--------|
| Dépôt | `mmarques30/ski-linguist-hub-99ce6087` |
| Branche de référence | `main` @ `a2d13ab` |
| App | SPA Vite + React 18 + TypeScript « FLI Formation » (Lovable) |
| Projet Lovable | `34e71e1a-49f7-433e-bb36-fc4d26e86f8e` (Ski School Connect / ski-linguist-hub) |
| Backend | Supabase hébergé `nghkrmvakjomzmfwdhbo` — `https://nghkrmvakjomzmfwdhbo.supabase.co` |
| App publiée (URL) | **https://plateforme.fli.fr** (`ski-linguist-hub.lovable.app` → redirect) |
| Preview Lovable | https://id-preview--34e71e1a-49f7-433e-bb36-fc4d26e86f8e.lovable.app |
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
| `contexts/` | i18n + `SeasonContext` (filtre saison header) |
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
| `/suivi/:token` | public | Suivi inscription (Vague A) | Fonctionnel |
| `/conditions-generales` | public | CG formation | Fonctionnel |
| `/mockup/dashboard-gestao` | staff | Mockup dashboard | Maquette (protégé) |
| `/` | staff | Dashboard + rail « À traiter » | Fonctionnel (Vague B) |
| `/finance` (+ analyses, rentabilité) | staff | Pilotage (sous-nav) | Fonctionnel (Vague C) |
| `/finance/tresorerie` (+ charges-fixes) | staff | Trésorerie | Fonctionnel |
| `/finance/payments` | staff | Paiements | Fonctionnel |
| `/gestion/commercial` | staff | Leads | Fonctionnel |
| `/gestion/moniteurs` | staff | Moniteurs ski | Fonctionnel |
| `/gestion/partenaires` `/:id` | staff | Partenaires | Fonctionnel (+ dedup BL-038) |
| `/inscriptions` | staff | Liste | Fonctionnel |
| `/inscriptions/schedule-validation` | staff | Horaires J-10 | Fonctionnel (valeurs horaires FLI → BL-019) |
| `/inscriptions/:id` | staff | Détail + checklist + Financier | Fonctionnel (Vague B) |
| `/invoices` | staff | Factures | Fonctionnel |
| `/students` `/:id` | staff | Stagiaires | Fonctionnel |
| `/students/:id/portal-preview` | staff | redirect Assister | Redirige (Vague A) |
| `/portails/stagiaire` `/:id/*` | staff | Assister stagiaire | Fonctionnel (Vague A) |
| `/portails/formateur` `/:id/*` | staff | Assister formateur | Fonctionnel (Vague A) |
| `/tests` | staff | Placement / pistes | Fonctionnel |
| `/formation/sessions` | staff | Sessions | Fonctionnel (vide honnête — Vague D) |
| `/classes` | redirect | → sessions | Legacy |
| `/documents` | staff | Bibliothèque docs | Empty state honnête + liens (#78) — pas encore de bibliothèque réelle |
| `/notifications` | staff | Centre de notifications | Fonctionnel (Vague D) |
| `/settings` | staff | Paramètres + identité org | Fonctionnel (BL-036) |
| `/admin/import` | staff | Import sécurisé | Fonctionnel (point 1) |
| `/admin/import-phrases` `/admin/phrases` | staff | Phrases | Fonctionnel |
| `/admin/testing` | staff | Checklist manuelle | Fonctionnel |
| `/admin/users` `/admin/seasons` | staff | Users / saisons | Fonctionnel |
| `/admin/emails` | staff | Modèles email | Fonctionnel |
| `/formateur/evaluations` (+ form/view/verifier) | staff / formateur | Évals SNMSF | Fonctionnel (+ pont stagiaire Vague D) |
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
| `stripe-webhook` | Events Stripe | HTTP webhook | `STRIPE_WEBHOOK_SECRET` (ou `app_settings`) | Déployée ; secret via `app_settings` (19/09) |
| `provision-stripe-webhook` | Provision endpoint | HTTP admin | `STRIPE_SECRET_KEY` | Déployée |
| `check-stripe-config` | Diagnostic | HTTP | Stripe + Supabase | Déployée |
| `create-user` | Provision users | HTTP admin | `SUPABASE_SERVICE_ROLE_KEY` | Déployée |
| `invite-student-portal` | Invite auth stagiaire | HTTP admin | Resend + service-role | Déployée |
| `import-ski-monitors` | Import moniteurs | HTTP + secret | `IMPORT_SECRET` | Déployée |
| `process-intake-outreach` | Mails intakes | HTTP / cron | Resend | Déployée ; **BL-006** sans unsubscribe |
| `process-schedule-reminders` | Alerte J-10 | cron | Resend, `ADMIN_EMAIL` | Déployée |
| `process-invoice-reminders` | Relances factures | cron | Resend | Déployée ; cron **actif** (BL-007) |
| `process-survey-reminders` | Relances survey | cron | Resend | idem |
| `generate-monthly-charges` | Charges fixes mensuelles | cron | — | idem |

Dernière exécution connue : redeploy batch 19/09 (19 fonctions via Lovable `deploy_edge_functions`).

---

## 6. Crons

Déclarés dans migrations (`pg_cron` + `pg_net` vers edge) :
- `generate-monthly-charges`
- `process-invoice-reminders`
- `process-survey-reminders`
- `process-schedule-reminders` (quotidien, J-10)

**État :** BL-007 **clos** (PR #85) — jobs email + `avancer-statuts` **actifs** via `dispatch_edge_function` / `pg_net`. Basculables depuis `/admin/emails`.

---

## 7. Intégrations

| Intégration | État |
|-------------|------|
| **Stripe** | Checkout register + webhook + settings UI ; mode **test** OK (`check-stripe-config` 19/09) ; webhook secret via `app_settings` |
| **Resend** | `RESEND_API_KEY` **présente** (19/09) ; emails register / invites / reminders |
| **Storage** | Buckets `documents`, `funding-documents` ; certificats → `documents/certificates/…` |
| **Google** | Champs Meet/event sur `test_bookings` — intégration partielle / legacy |
| **Supabase Auth** | Staff + stagiaires ; signups self-service **désactivés** (AGENTS.md) |

---

## 8. Modules fonctionnels

| Module | Fonctionne | Partiel | Absent |
|--------|------------|---------|--------|
| Inscriptions | CRUD, statuts, détail, checklist, Financier, suivi public | Encodage `entry_level` | — |
| Stagiaires | Liste, détail, invites portail, Assister | — | — |
| Formateur·rices | CRUD, candidat, import, Assister, CTA actif (#77) | UI candidat→actif (BL-014 reste à peaufiner) | — |
| Placement | Test adaptatif pistes, admin CECRL | — | — |
| Évaluations SNMSF | Formulaire + PDF + phrases + pont stagiaire | Prix test non unifié | — |
| Certificats | Bilan Entrée/Sortie, garde sortie, PDF, vue live OK | PDF storage policies (reste BL-020 partiel) | Lien email formateur |
| Facturation | CRUD, TVA, numérotation fiscale | Import historique point 9 | — |
| Paiements | Stripe + chèques/virements + notif admin | — | — |
| Finance / Pilotage | Vue d’ensemble, glossaire KPI, dépenses réelles, objectifs `revenue_target` (BL-039), retrait prévisions (BL-032) | Saisie `revenue_target` en admin | — |
| Saison globale | Header `SeasonFilterControl` + bornes dates (Onda D + #68) ; saison exercice 01/07–30/06 (BL-034 / #74) | Données historiques souvent sans `season_id` | — |
| CRM / leads | Kanban commercial + filtre saison + champs projet / moniteur | — | — |
| Moniteurs | CRM + intakes + outreach | Gel prospection | — |
| Partenaires | ESF + import + badge « À vérifier » + hard dedup (#76/#80) | Suppression physique sous gel | — |
| Portail stagiaire | Dashboard, docs, planning, pistes | Gate `app_settings` | — |
| Qualiopi | Indicateurs + PROC-026 | — | — |
| Satisfaction | Survey token + stats | — | — |
| Amélioration continue | CRUD | — | — |
| Documents | Envois welcome pack ; `/documents` empty state + liens (#78) | Bibliothèque réelle | — |
| Notifications | `/notifications` + producteurs inscription / paiement / évaluation / test / sans formateur / facture échue | — | — |
| Recherche globale | ⌘K multi-entités (Vague D) ; recherche prénom+nom stagiaires/formateurs (BL-040 / suite 3) | — | — |
| Permissions | `canView` dans `ProtectedRoute` | — | — |
| Import | Moteur dry-run/purge/audit | Cartes FLI (BL-001) | — |
| Paramètres | Stripe + identité org | Autres prefs non branchées | — |

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
| Dette | Voir §11 + `BACKLOG.md` ; policies storage certificats |

---

## 11. Backlog & plan points 1–10

Intégré depuis `docs/BACKLOG.md` (refresh 21/09/2026 — BL-007 clos) :

**Ouvert (extraits) :** BL-001, 008, 011, 014 (peaufinage), 015, 017, 019, 020, 022.

| Point / vague | État |
|---------------|------|
| 1–4A, certificat, A/A2 | **Livré** (main + déployé) |
| 5 Gel | **Livré** (main + edges 19/09) |
| 6 Stripe | Config **test** OK ; mode live hors scope |
| 7 Phrases | Fusionné main |
| 8 Emails | Fusionné main ; Resend OK (BL-047 clos) ; crons **actifs** (BL-007 clos #85) |
| 9 Facturation import | Fusionné main |
| 10 Cycle inscription | **Livré** (BL-019 horaires exacts reste) |
| C.1–C.6 | Fusionnés main |
| Vague 0 ops | **Livré** 19/09 — BL-046 / BL-047 |
| Vague 1 | Fusionnée main ; BL-027 **clos** (#76 + #82) |
| Plan UX A–D | Fusionnés main (PR #60–#65) |
| Onda D5–D8 | Fusionné main (PR #70) |
| BL octobre #71–#78 | Fusionnés main — voir `BACKLOG.md` § Validations |
| BL-038 hard dedup | Fusionné main (PR #80) |
| BL-027 règle OPCO | Fusionné main (PR #82) |
| Édition admin partout | Fusionné main (PR #83) |
| BL-007 crons + notifs | Fusionné main (PR #85) |

---

## 12. Sécurité

| Sujet | État |
|-------|------|
| Rôles | `admin` / `formateur` / staff (`is_staff`) / `student` ; `canView` via `ProtectedRoute` + `user_permissions` |
| Secrets (noms) | Frontend : `VITE_SUPABASE_*` ; Edge : `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_*`, `RESEND_API_KEY`, `IMPORT_SECRET`, `ADMIN_EMAIL`, `APP_URL` |
| Valeurs | **Jamais** dans ce rapport ni dans les bundles |
| Dépôt | GitHub privé/équipe (accès agent limité en écriture PR) |
| Exposition | Anon key dans `.env` commitée (normal Supabase) ; service-role **ne doit pas** être front |
| Signups | Désactivés ; users via `create-user` |
| Incidents connus | MCP Lovable rétabli le 09/09 (counts + deploy OK) |

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

*Fin du rapport d’état — 09/09/2026 (rafraîchi 19/09/2026 : PR #70–#80 + Vague 0 deploy, SHA `c6656dc`).*
