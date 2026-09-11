# C.4 — Vérification Paula

Migration : `supabase/migrations/20260911140000_c4_verification_paula.sql`

Journal : `audit_log.action = 'c4_verification_paula'` (aucune donnée personnelle)

Route : `/formateur/evaluations/:id/verifier` (`:id` = `test_evaluations.id`)

## Règles absolues (affichées en tête)

- Vouvoiement obligatoire
- Quatre blocs renseignés
- Écart de note ≤ 1 ; note méthodologique dès que l'écart est non nul
- Orthographe : propositions acceptées **une à une**, jamais de réécriture automatique
- Valider → `valide` ; Refuser → `brouillon` + commentaire au formateur

## Motifs de structure

Quatre blocs, vouvoiement, cinq notes, écart, note méthodologique, libellé CECRL.
La validation est bloquée tant qu'un motif est non conforme.

## Colonnes

`reviewer_comment`, `reviewed_at`, `reviewed_by`

Le déclencheur `test_evaluations_verification_guard` : seul `is_admin()` valide
ou renvoie en brouillon ; le refus exige un commentaire ; le formateur ne peut
pas poser `valide`.

## Hors C.4

C.5 PDF / 45 € / DROP `attestation_type`. C.6 export xlsx.

## Retour arrière

```sql
BEGIN;
DROP TRIGGER IF EXISTS test_evaluations_verification_guard ON public.test_evaluations;
DROP FUNCTION IF EXISTS public.test_evaluations_verification_guard();
ALTER TABLE public.test_evaluations
  DROP COLUMN IF EXISTS reviewer_comment,
  DROP COLUMN IF EXISTS reviewed_at,
  DROP COLUMN IF EXISTS reviewed_by;
COMMIT;
```
