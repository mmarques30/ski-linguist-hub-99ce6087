# C.2 — `sponsor_type` et schéma des évaluations de test

Migration : `supabase/migrations/20260911120000_c2_sponsor_type.sql`

Journal : `audit_log.action = 'c2_sponsor_type'` (aucune donnée personnelle)

Pas de rôles `ecole_de_ski` / `dsf`. Pas d’UI formateur (C.3). Pas de PDF (C.5).
`attestation_type` est **conservé** (le formulaire actuel l’envoie encore) ;
le DROP est C.3 / C.5.

## 1. `test_bookings`

| Colonne | Valeurs | Rôle |
|---------|---------|------|
| `sponsor_type` | `esf` \| `ecole_ski` \| `dsf` | source de vérité (3 habillages PDF en C.5) |
| `sponsor_id` | uuid, **sans FK unique** | `ski_schools.id` si esf/ecole_ski ; `partners.id` si dsf connu |

Défaut d’insert : `sponsor_type = 'ecole_ski'` (le formulaire actuel n’envoie pas encore ces colonnes).

Backfill : candidat → `ski_schools.school_kind` / `partners.type`. Reste → `ecole_ski`.

`test_booking_is_dsf(_booking_id)` lit **uniquement** `sponsor_type = 'dsf'`
(plus d’inférence école / partenaire).

## 2. `test_evaluations`

| Colonne | Défaut / règle |
|---------|----------------|
| `status` | `brouillon` \| `a_verifier` \| `valide` \| `envoye` — défaut `brouillon` |
| six notes | 0–5 par pas de 0,5 |
| `score_general_calcule` | moyenne des cinq, arrondie au demi-point (colonne générée) |
| ajustement | hors brouillon : \|`score_general` − calculé\| ≤ 1, et `note_methodologique` obligatoire si écart |
| `cecrl_label` | rempli depuis `cecrl_scale` si vide |
| `bloc_introduction` / `_comprehension` / `_technique` / `_conclusion` | repris des `appreciation_*` puis `comments_*` correspondants |

Les anciens champs (`appreciation_*`, `comments_*`, `attestation_type`, `scoring_system`) restent.

## 3. `cecrl_scale` (11 lignes)

Correspondance naturelle, aucun autre seuil :

| Note | CECRL |
|------|-------|
| 0.0 | A1 |
| 0.5 | A1+ |
| 1.0 | A2 |
| 1.5 | A2+ |
| 2.0 | B1 |
| 2.5 | B1+ |
| 3.0 | B2 |
| 3.5 | B2+ |
| 4.0 | C1 |
| 4.5 | C1+ |
| 5.0 | C2 |

Lecture : staff ou formateur. Écriture : staff.

## 4. RLS candidat

| Politique | Après C.2 |
|-----------|-----------|
| `rls_test_evaluations_select_candidate` | `is_student() AND owns_test_booking(booking_id) AND NOT test_booking_is_dsf(booking_id)` |
| `rls_test_bookings_select_candidate` | `is_student() AND owns_test_booking(id) AND NOT test_booking_is_dsf(id)` |

`attestation_type <> 'dsf'` est retiré. Un stagiaire **ne voit jamais** `sponsor_type = 'dsf'`,
même si `attestation_type` vaut `generique`. Inversement, `attestation_type = 'dsf'` sur
un booking `esf` **n’est plus masqué**.

Staff (admin / user) et formateur (C.1) inchangés.

Vue `test_bookings_complete` : `sponsor_type`, `sponsor_id` en fin de liste ;
`security_invoker = true` conservé.

## 5. Rapport des anciens champs (live, 2026-09-11)

**0** `test_bookings`, **0** `test_evaluations`, **0** `test_candidates`.
Aucun backfill réel. Répartition écoles / partenaires (contexte, pas des bookings) :

| Origine | Dénombrement |
|---------|--------------|
| `ski_schools.school_kind` | 13 `esf`, 2 `ecole_ski` |
| `partners.type` | magasin 456, directeur 342, esf 209, autre 23, ecole_ski 2 — **aucun `dsf`** |

| Champ `test_evaluations` | Lignes non nulles / non vides |
|--------------------------|-------------------------------|
| `attestation_type` generique / alpe_huez / prosneige / dsf / autre | 0 / 0 / 0 / 0 / 0 |
| `scoring_system` sur_5 / sur_20 | 0 / 0 |
| `appreciation_intro` | 0 |
| `appreciation_comprehension` | 0 |
| `appreciation_grammar` | 0 |
| `appreciation_technique` | 0 |
| `appreciation_conclusion` | 0 |
| `comments_introduction` | 0 |
| `comments_comprehension` | 0 |
| `comments_expression` | 0 |
| `comments_grammar` | 0 |
| `comments_technique` | 0 |
| `comments_conclusion` | 0 |
| `comments` | 0 |
| `grammar_points` (tableau non vide) | 0 |

Champs **non repris** dans les 4 blocs (conservés, à traiter en C.3 si besoin) :
`appreciation_grammar`, `comments_grammar`, `comments_expression`, `comments`, `grammar_points`.

Après backfill : 0 ligne `sponsor_type` (table vide). Défaut d’insert `ecole_ski`.

## 6. Preuve ZZTEST (live)

Jeu `@example.invalid`, usurpation `SET ROLE authenticated` + `request.jwt.claims.sub`,
puis suppression. Langue `anglais`, paiement `school_invoice`, source `manual`.

Deux stagiaires, une école ESF, un partenaire DSF. Trois bookings **rattachés à l’école ESF**
(l’ancienne inférence `school_kind` / `partners.type` ne verrait **aucun** DSF) :

| Booking | `sponsor_type` | `attestation_type` | Attendu ancien Point A | Attendu C.2 |
|---------|----------------|--------------------|------------------------|-------------|
| A-esf | `esf` | `dsf` | masqué (attestation) | **visible** |
| A-dsf | `dsf` | `generique` | visible (école ESF) | **masqué** |
| B-esf | `esf` | `generique` | visible | **visible** |

*(Tableau de résultats rempli après exécution live.)*

## 7. Hors C.2

- C.3 : entrée formateur + sélecteur de phrases + remplissage des blocs / statut
- C.4 : écran de vérification Paula
- C.5 : PDF trois habillages, vouvoiement, `evaluation_price_ttc` 45 €, DROP `attestation_type`
- C.6 : export xlsx
- Politiques storage (A2) : non concernées

## 8. Retour arrière (down)

Ne pas exécuter en production sans validation. `cecrl_scale` est droppée.

```sql
BEGIN;

DROP TRIGGER IF EXISTS trg_test_evaluations_cecrl_label ON public.test_evaluations;
DROP FUNCTION IF EXISTS public.test_evaluations_set_cecrl_label();
DROP FUNCTION IF EXISTS public.cecrl_label_from_score(numeric);

DROP POLICY IF EXISTS "rls_cecrl_scale_select" ON public.cecrl_scale;
DROP POLICY IF EXISTS "rls_cecrl_scale_write_staff" ON public.cecrl_scale;
DROP TABLE IF EXISTS public.cecrl_scale;

CREATE OR REPLACE FUNCTION public.test_booking_is_dsf(_booking_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.test_bookings b
    LEFT JOIN public.test_candidates c ON c.id = b.candidate_id
    LEFT JOIN public.ski_schools s ON s.id = c.ski_school_id
    LEFT JOIN public.partners p ON p.id = s.partner_id
    WHERE b.id = _booking_id
      AND (
        lower(coalesce(s.school_kind, '')) IN (
          'dsf', 'domaines_skiables', 'remontees_mecaniques'
        )
        OR lower(coalesce(p.type, '')) IN (
          'dsf', 'domaines_skiables', 'domaines skiables de france'
        )
      )
  )
$function$;

DROP POLICY IF EXISTS "rls_test_evaluations_select_candidate" ON public.test_evaluations;
CREATE POLICY "rls_test_evaluations_select_candidate" ON public.test_evaluations
  FOR SELECT TO authenticated USING (
    is_student()
    AND public.owns_test_booking(booking_id)
    AND lower(coalesce(attestation_type, '')) <> 'dsf'
    AND NOT public.test_booking_is_dsf(booking_id)
  );

DROP POLICY IF EXISTS "rls_test_bookings_select_candidate" ON public.test_bookings;
CREATE POLICY "rls_test_bookings_select_candidate" ON public.test_bookings
  FOR SELECT TO authenticated USING (
    is_student()
    AND public.owns_test_booking(id)
    AND NOT public.test_booking_is_dsf(id)
  );

CREATE OR REPLACE VIEW public.test_bookings_complete
WITH (security_invoker = true)
AS
SELECT
  tb.id, tb.candidate_id, tb.instructor_id, tb.language, tb.datetime,
  tb.status, tb.payment_type, tb.stripe_payment_id, tb.google_meet_link,
  tb.google_event_id, tb.previous_test, tb.previous_result, tb.source, tb.created_at,
  tc.name AS candidate_name, tc.email AS candidate_email, tc.phone AS candidate_phone,
  tc.profession AS candidate_profession, tc.photo_face_url AS candidate_photo, tc.student_id,
  ss.name AS ski_school_name, ss.id AS ski_school_id,
  CONCAT(i.first_name, ' ', i.last_name) AS instructor_name, i.email AS instructor_email,
  te.id AS evaluation_id, te.score_general, te.attestation_url, te.attestation_sent_at
FROM public.test_bookings tb
LEFT JOIN public.test_candidates tc ON tb.candidate_id = tc.id
LEFT JOIN public.ski_schools ss ON tc.ski_school_id = ss.id
LEFT JOIN public.instructors i ON tb.instructor_id = i.id
LEFT JOIN public.test_evaluations te ON tb.id = te.booking_id;

ALTER TABLE public.test_evaluations DROP CONSTRAINT IF EXISTS test_evaluations_note_methodo_check;
ALTER TABLE public.test_evaluations DROP CONSTRAINT IF EXISTS test_evaluations_score_adjust_check;
ALTER TABLE public.test_evaluations DROP CONSTRAINT IF EXISTS test_evaluations_scores_half_step_check;
ALTER TABLE public.test_evaluations DROP CONSTRAINT IF EXISTS test_evaluations_status_check;
ALTER TABLE public.test_evaluations DROP COLUMN IF EXISTS score_general_calcule;
ALTER TABLE public.test_evaluations DROP COLUMN IF EXISTS bloc_conclusion;
ALTER TABLE public.test_evaluations DROP COLUMN IF EXISTS bloc_technique;
ALTER TABLE public.test_evaluations DROP COLUMN IF EXISTS bloc_comprehension;
ALTER TABLE public.test_evaluations DROP COLUMN IF EXISTS bloc_introduction;
ALTER TABLE public.test_evaluations DROP COLUMN IF EXISTS cecrl_label;
ALTER TABLE public.test_evaluations DROP COLUMN IF EXISTS note_methodologique;
ALTER TABLE public.test_evaluations DROP COLUMN IF EXISTS status;

ALTER TABLE public.test_bookings DROP CONSTRAINT IF EXISTS test_bookings_sponsor_type_check;
DROP INDEX IF EXISTS public.idx_test_bookings_sponsor_type;
ALTER TABLE public.test_bookings DROP COLUMN IF EXISTS sponsor_id;
ALTER TABLE public.test_bookings DROP COLUMN IF EXISTS sponsor_type;

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'retour_arriere_c2_sponsor_type',
  'test_bookings',
  jsonb_build_object('migration', '20260911120000_c2_sponsor_type')
);

COMMIT;
```
