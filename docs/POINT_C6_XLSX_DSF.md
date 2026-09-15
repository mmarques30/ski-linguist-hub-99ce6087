# C.6 — Export xlsx DSF et visibilité

Migration : `supabase/migrations/20260914190000_c6_xlsx_dsf.sql`

Journaux : `c6_xlsx_dsf`, `c6_zztest_proof` (aucune donnée personnelle)

C.5 PDF non modifié.

## Export

Bouton **Exporter DSF** sur `/formateur/evaluations` (staff uniquement, pas le rôle formateur).
Lignes `sponsor_type = 'dsf'` après les filtres courants.

Filtres : période, entreprise, station, langue, évaluateur·rice, statut.

Colonnes xlsx :

| Colonne | Source |
|---------|--------|
| Date | `test_bookings.datetime` |
| Candidat | `test_candidates.name` |
| Entreprise | DSF : `partners.name` sinon école |
| Station | `ski_schools.station` |
| Langue | libellé FR |
| Cinq notes + CECRL | `formatScoreCecrl` (même barème que le PDF) |
| Appréciation générale | `score_general` + `cecrl_label` |
| Évaluateur·rice | formateur·rice du booking |
| Lien PDF | URL signée 7 jours (`evaluation-pdfs`), vide si pas de PDF |

Vue `test_bookings_complete` : `score_*` (cinq), `cecrl_label`, `partner_name`, `company_name`, `station`. `security_invoker` conservé.

## Visibilité ZZTEST (live 2026-09-14)

Jeu `@example.invalid`, usurpation `SET ROLE authenticated` + JWT `sub`, puis suppression.

| Acteur | évaluations | bookings | dont DSF | Attendu |
|--------|-------------|----------|----------|---------|
| Candidat A | 1 | 1 | 0 | ESF visible, DSF masqué |
| Formateur F (A) | 2 | 2 | 1 | ses tests, y compris DSF |
| Formateur G (B) | 1 | 1 | 0 | pas les tests de A |
| Staff | 3 | 3 | 1 | tout ; entreprise + station + cinq notes sur la ligne DSF |

Script : `scripts/sql/c6_zztest_visibility_proof.sql` (one-shot, pas une migration).

## Retour arrière

```sql
-- Recréer la vue C.5 (20260911153000_c5_score_general_rule.sql) sans les colonnes C.6.
```
