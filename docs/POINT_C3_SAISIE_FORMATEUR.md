# C.3 — Saisie formateur et compléments C.2

Migration : `supabase/migrations/20260911130000_c3_dsf_partner_scores.sql`

Journaux : `exception_gel_partenaire_dsf`, `c3_dsf_partner_scores` (aucune donnée personnelle)

C.4 (vérification Paula) et C.5 (PDF / prix) ne sont pas dans cette étape.
`attestation_type` reste en colonne.

## 1. Compléments C.2

### 1.1 Partenaire DSF (exception gel point 5)

Une ligne `partners` : nom **Domaines Skiables de France**, `type = dsf`, `status = actif`.

Le déclencheur `gel_prospection_partners` a été **désactivé le temps de l'INSERT**, puis
rétabli. Le gel n'est pas levé. Fonction `dsf_partner_id()`. Les réservations
`sponsor_type = 'dsf'` reçoivent `sponsor_id` = cet id.

FK : `test_bookings.sponsor_id` → `partners.id` (`ON DELETE RESTRICT`, nullable pour
esf/ecole_ski sans partenaire lié).

### 1.2 `cecrl_scale` — demi-points = niveau de base + « + »

Colonne `base_label`. Contrainte : entier → `cecrl_label = base_label` ;
demi-point → `cecrl_label = base_label || '+'`.

| score | base_label | cecrl_label |
|-------|------------|-------------|
| 0.0 | A1 | A1 |
| 0.5 | A1 | A1+ |
| 1.0 | A2 | A2 |
| 1.5 | A2 | A2+ |
| 2.0 | B1 | B1 |
| 2.5 | B1 | B1+ |
| 3.0 | B2 | B2 |
| 3.5 | B2 | B2+ |
| 4.0 | C1 | C1 |
| 4.5 | C1 | C1+ |
| 5.0 | C2 | C2 |

### 1.3 Contrainte `score_general`

Toujours (y compris brouillon) :

- `|score_general − score_general_calcule| ≤ 1` sinon refus
- écart ≠ 0 ⇒ `note_methodologique` obligatoire sinon refus

## 2. Écran formateur `/formateur/evaluation/:bookingId`

- cinq notes 0–5 (pas de sixième note indépendante) ; moyenne calculée au demi-point
- note générale ajustable de ±1 avec note méthodologique
- quatre blocs : introduction, compréhension, technique, conclusion + sélecteur de phrases
- contrôle de vouvoiement (tutoiement affiché, soumission bloquée, brouillon possible)
- **Enregistrer brouillon** → `status = brouillon`
- **Soumettre pour vérification** → `status = a_verifier` (C.4)

Kit de 8 phrases `ZZTEST-*` (dont une en tutoiement pour le contrôle) : la banque métier est vide.

## 3. Hors C.3

- C.4 : écran de vérification Paula
- C.5 : PDF trois habillages, prix 45 €, DROP `attestation_type`
- C.6 : export xlsx

## 4. Retour arrière (down)

Ne pas exécuter sans validation. Le partenaire DSF peut rester (référencé par FK).

```sql
BEGIN;

ALTER TABLE public.test_bookings DROP CONSTRAINT IF EXISTS test_bookings_sponsor_id_fkey;
DROP FUNCTION IF EXISTS public.dsf_partner_id();
DELETE FROM public.app_settings WHERE key = 'dsf_partner';

ALTER TABLE public.cecrl_scale DROP CONSTRAINT IF EXISTS cecrl_scale_plus_matches_base_check;
ALTER TABLE public.cecrl_scale DROP COLUMN IF EXISTS base_label;

ALTER TABLE public.test_evaluations DROP CONSTRAINT IF EXISTS test_evaluations_score_adjust_check;
ALTER TABLE public.test_evaluations DROP CONSTRAINT IF EXISTS test_evaluations_note_methodo_check;
ALTER TABLE public.test_evaluations
  ADD CONSTRAINT test_evaluations_score_adjust_check
  CHECK (status = 'brouillon' OR abs(score_general - score_general_calcule) <= 1);
ALTER TABLE public.test_evaluations
  ADD CONSTRAINT test_evaluations_note_methodo_check
  CHECK (
    status = 'brouillon'
    OR abs(score_general - score_general_calcule) = 0
    OR (note_methodologique IS NOT NULL AND length(btrim(note_methodologique)) > 0)
  );

DELETE FROM public.test_phrases WHERE code LIKE 'ZZTEST-%';

-- Recréer test_bookings_complete sans evaluation_status (voir C.2).
-- Ne pas DROP le partenaire DSF s'il est encore référencé.

COMMIT;
```
