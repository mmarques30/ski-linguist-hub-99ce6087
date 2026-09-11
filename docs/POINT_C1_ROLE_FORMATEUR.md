# C.1 — Rôle formateur et RLS des évaluations

Migrations :

- `supabase/migrations/20260911100000_app_role_formateur.sql` (enum, transaction isolée)
- `supabase/migrations/20260911101000_role_formateur_rls.sql`
- `supabase/migrations/20260911102000_j10_subject_fr.sql` (sujet J-10 FR, indépendant)

Journal : `audit_log.action = 'c1_role_formateur_rls'` (aucune donnée personnelle)

Pas de rôles `ecole_de_ski` / `dsf` dans cette étape.

## 1. Comportement

| Élément | Après C.1 |
|---------|-----------|
| `app_role` | `admin`, `user`, `student`, **`formateur`** |
| `is_staff()` | `user_roles.role IN ('admin','user')` — un formateur n’est plus « tout compte non stagiaire » |
| `instructors.auth_user_id` | UUID unique, FK `auth.users`, `ON DELETE SET NULL` |
| Connexion formateur | redirection `/formateur/evaluations` ; le reste du back-office est fermé |
| Sidebar formateur | uniquement Évaluations |
| Création de compte | `/admin/users` + `create-user` : rôle Formateur + fiche `instructors` |

Les politiques Point A (candidat, hors DSF) restent. Le staff (admin / user) voit toujours toutes les évaluations.

## 2. Ce que le formateur peut faire

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `test_evaluations` | ses bookings | ses bookings | ses bookings | non |
| `test_bookings` | les siens | non | les siens (statut `evaluated`) | non |
| `test_candidates` | candidats de ses bookings | non | non | non |
| `test_phrases` / `test_criteria` | oui (référentiel) | non | non | non |
| `instructors` | sa fiche | non | non | non |

Vue `test_bookings_complete` (et les autres vues `public`) : `security_invoker = true`, pour que la RLS des tables s’applique. Sans cela un formateur lisait **toutes** les réservations via la vue.

## 3. Sujet J-10

`email_templates.slug = 'schedule_validation_reminder'` :

`Validation des horaires J-10 — {{total_count}} inscription(s)`

L’enrichissement de l’e-mail de confirmation (lieu, modalité, piste, ligne paiement) est **reporté au point 8 complet**, texte à fournir — pas inventé ici.

## 4. Hors C.1 (C.2 et suivants)

- `test_bookings.sponsor_type` / `sponsor_id` et réécriture des politiques Point A
- écran d’entrée formateur + sélecteur de phrases (C.3)
- écran de vérification Paula (C.4)
- PDF trois habillages (C.5)
- export xlsx (C.6)

## 5. Retour arrière (down)

L’enum `formateur` ne peut pas être retiré (limitation PostgreSQL). Ne pas exécuter en production sans validation.

```sql
BEGIN;

DROP POLICY IF EXISTS "rls_instructors_select_formateur" ON public.instructors;
DROP POLICY IF EXISTS "rls_test_bookings_select_formateur" ON public.test_bookings;
DROP POLICY IF EXISTS "rls_test_bookings_update_formateur" ON public.test_bookings;
DROP POLICY IF EXISTS "rls_test_candidates_select_formateur" ON public.test_candidates;
DROP POLICY IF EXISTS "rls_test_evaluations_select_formateur" ON public.test_evaluations;
DROP POLICY IF EXISTS "rls_test_evaluations_insert_formateur" ON public.test_evaluations;
DROP POLICY IF EXISTS "rls_test_evaluations_update_formateur" ON public.test_evaluations;
DROP POLICY IF EXISTS "rls_test_phrases_select_formateur" ON public.test_phrases;
DROP POLICY IF EXISTS "rls_test_criteria_select_formateur" ON public.test_criteria;
DROP POLICY IF EXISTS "rls_ski_schools_select_formateur" ON public.ski_schools;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'student'
  ) AND auth.uid() IS NOT NULL
$$;

DROP FUNCTION IF EXISTS public.formateur_owns_booking(uuid);
DROP FUNCTION IF EXISTS public.formateur_owns_candidate(uuid);
DROP FUNCTION IF EXISTS public.formateur_sees_ski_school(uuid);
DROP FUNCTION IF EXISTS public.is_formateur();
DROP FUNCTION IF EXISTS public.get_my_instructor_id();

ALTER TABLE public.instructors DROP CONSTRAINT IF EXISTS instructors_auth_user_id_fkey;
DROP INDEX IF EXISTS public.idx_instructors_auth_user_id;
ALTER TABLE public.instructors DROP COLUMN IF EXISTS auth_user_id;

UPDATE public.email_templates
SET subject_fr = 'FLI — Validation des horaires (J-10) — {{total_count}} inscription(s)'
WHERE slug = 'schedule_validation_reminder';

-- Les vues public restent en security_invoker (plus sûr). Pour rétablir le
-- definer par défaut : ALTER VIEW … RESET (security_invoker);

COMMIT;
```
