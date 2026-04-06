
# Refactoring Inscriptions — Approche Progressive

## Phase 1 : Machine à états + Audit (cette itération)

### 1.1 Migration SQL
- Ajouter les colonnes `status_changed_at` (timestamptz) et `status_changed_by` (uuid) à `inscriptions`
- Migrer les statuts existants vers les nouveaux codes :
  - `En cours` → `en_cours`
  - `Terminé` → `terminee`
  - `Facturé` → `facturee`
  - `Annulé` → `annulee`
  - `Confirmé` → `confirmee`
  - Tout autre → `brouillon`
- Créer une fonction PostgreSQL `validate_inscription_status_transition()` qui :
  - Autorise : brouillon→en_attente, en_attente→confirmee, en_attente→annulee, confirmee→en_cours, confirmee→annulee (si avant start_date), en_cours→terminee, terminee→facturee
  - Bloque toute autre transition avec `RAISE EXCEPTION`
  - Met à jour automatiquement `status_changed_at` et `status_changed_by`
- Créer un trigger `BEFORE UPDATE` sur `inscriptions` qui appelle cette fonction
- Mettre à jour la vue `inscriptions_complete` pour utiliser les nouveaux statuts

### 1.2 Code — Constantes et helpers
- Créer `src/lib/inscription-status.ts` : enum des statuts, map des transitions autorisées, labels traduits (FR/PT-BR/EN), couleurs de badges

### 1.3 Code — Mise à jour des composants
- Mettre à jour tous les composants qui référencent les anciens statuts français :
  - `useInscriptions.ts` (filtres, stats)
  - `useDashboardStats.ts` (compteurs)
  - `useStudentDetails.ts` (stats)
  - `RecentInscriptions.tsx` (badges, labels)
  - `DashboardGestao.tsx` (KPIs)
  - `InscriptionFormDialog.tsx` (sélection de statut)
  - `InscriptionDetails.tsx` (affichage)
  - `Inscriptions.tsx` (filtres)
  - Tout autre fichier référençant "En cours", "Terminé", "Facturé", "Annulé", "Confirmé"

### Fichiers concernés Phase 1
| Action | Fichier |
|--------|---------|
| Migration | Colonnes audit + statuts + trigger + vue |
| Créer | `src/lib/inscription-status.ts` |
| Modifier | ~8-10 fichiers existants (hooks + composants) |

---

## Phase 2 : Normalisation tables (prochaine itération)
- Créer `inscription_financials`, `inscription_pedagogy`, `inscription_logistics`
- Répartir les colonnes existantes :
  - **Core** (inscriptions) : id, student_id, instructor_id, partner_id, ski_school_id, code, status, language, modality, course_type, course_location, start_date, end_date, duration_hours, duration_days, hours_per_day, schedule, rhythm, group_name, group_size, max_participants, observations, created_at, updated_at, status_changed_at, status_changed_by
  - **Financials** : price, deposit_amount, deposit_date, balance_after_deposit, payment_method, check_number, check_date, pedagogical_cost, funding_organization, funding_details, bpf_category_c, bpf_category_f
  - **Pedagogy** : entry_level, entry_test_id, entry_test_score, exit_level, exit_test_id, progression, certification_type, certification_result, certification_date, certificate_level, final_general_level, final_specific_level, expectations
  - **Logistics** : course_address, course_materials, documents_sent_at, end_pack_sent_at, qualiopi_status, final_status
- Migrer les données existantes
- Recréer la vue `inscriptions_complete` avec jointures
- RLS sur les nouvelles tables

## Phase 3 : Mise à jour composants pour normalisation (itération suivante)
- Mettre à jour les hooks pour utiliser les jointures/vues
- Mettre à jour les formulaires pour écrire dans les bonnes tables
- Tests de non-régression
