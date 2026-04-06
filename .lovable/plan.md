

# Refactoring des politiques RLS - Plan detaille

## Analyse de l'architecture actuelle

Le systeme a **deux roles auth** : `admin` et `user` (personnel staff). Les stagiaires et formateurs ne sont **pas** des utilisateurs auth -- ce sont des enregistrements dans les tables `students` et `instructors`. La separation "formateur voit ses sessions / stagiaire voit ses donnees" ne s'applique donc pas directement aux policies RLS car ces acteurs n'ont pas de comptes auth.

Les formulaires publics (anon) existants qui doivent continuer a fonctionner :
- `/register` : INSERT dans `students`, `inscriptions`, `ski_schools`
- `/survey/:token` : SELECT/UPDATE sur `satisfaction_surveys`
- Tests de placement : SELECT/INSERT sur `placement_tests`, `placement_test_questions`
- Booking de tests : INSERT sur `test_candidates`, `test_bookings`
- Signature de contrats : SELECT/UPDATE sur `instructor_contracts`

## Strategie RLS

```text
Role         | SELECT          | INSERT         | UPDATE         | DELETE
-------------|-----------------|----------------|----------------|--------
admin        | tout            | tout           | tout           | tout
user (staff) | tout            | tout           | tout           | NON (sauf tables non-sensibles)
anon         | tables publiques| formulaires    | surveys/contrats| NON
```

Les `user` (staff) conservent un acces large en lecture/ecriture car ils operent le systeme au quotidien. La restriction fine est deja geree cote frontend par `canView/canEdit`. Le DELETE est restreint aux admins pour les tables sensibles (invoices, students, inscriptions, fixed_costs, formation_costs, instructor_payments).

## Migration SQL (une seule migration)

### 1. Fonction helper `get_user_role()`
```sql
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.user_roles
  WHERE user_id = auth.uid()
  LIMIT 1
$$;
```

### 2. Fonction helper `is_admin()`
```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
$$;
```

### 3. Policies par categorie de table

**Tables internes sensibles** (invoices, fixed_costs, formation_costs, cost_templates, instructor_payments, payments) :
- SELECT : `authenticated` + `USING (true)` (tout staff voit)
- INSERT : `authenticated` + `WITH CHECK (true)` (tout staff peut creer)
- UPDATE : `authenticated` + `USING (true)` (tout staff peut modifier)
- DELETE : `authenticated` + `USING (public.is_admin())` (admin uniquement)

**Tables de gestion** (students, inscriptions, instructors, accommodations, ski_schools, continuous_improvement, document_sendings, certificates, scheduled_reminders, availability_requests) :
- SELECT : `authenticated` + `USING (true)`
- INSERT : `authenticated` + `WITH CHECK (true)`
- UPDATE : `authenticated` + `USING (true)`
- DELETE : `authenticated` + `USING (public.is_admin())`

**Tables avec acces public (formulaires)** :
- `students` : ajouter INSERT pour `anon` + `WITH CHECK (true)` (formulaire inscription)
- `inscriptions` : ajouter INSERT pour `anon` + `WITH CHECK (true)`
- `placement_tests` : SELECT `public` + `USING (true)`, INSERT `public` + `WITH CHECK (true)`, UPDATE `public` + `USING (true)`
- `placement_test_questions` : SELECT `public` + `USING (is_active = true)`, ALL `authenticated`
- `satisfaction_surveys` : SELECT/UPDATE `public` (par token), INSERT/DELETE `authenticated`
- `test_candidates` / `test_bookings` : INSERT `anon`, SELECT/UPDATE/DELETE `authenticated`
- `instructor_contracts` : SELECT/UPDATE `public` (signature par token), INSERT/DELETE `authenticated`

**Tables admin** (profiles, user_roles, user_permissions) : pas de changement, deja bien protegees.

**Table app_settings** :
- SELECT : `authenticated`
- INSERT/UPDATE/DELETE : `authenticated` + `is_admin()`

### 4. Tables prospects et test_evaluations, test_phrases, test_criteria
- SELECT/INSERT/UPDATE : `authenticated`
- DELETE : `authenticated` + `is_admin()`
- test_phrases et test_criteria gardent SELECT public pour `active = true`

## Changements cote code

**Aucun changement de code necessaire.** Le frontend utilise deja le client Supabase avec le token auth. Les formulaires publics utilisent le client anon. Le systeme de permissions frontend (`canView`/`canEdit`) reste inchange.

## Risques et precautions

- La migration DROP toutes les policies existantes puis les recree. En cas d'erreur, un rollback est possible.
- Les formulaires publics (`/register`, `/survey/:token`) continueront a fonctionner car les policies `anon` INSERT sont maintenues sur `students`, `inscriptions`, `placement_tests`.
- Le changement principal : **DELETE restreint aux admins** sur les tables sensibles. Les utilisateurs staff ne pourront plus supprimer (invoices, students, inscriptions, etc.) sauf s'ils sont admin.

## Resume des fichiers

- **1 migration SQL** : drop + recreate de ~80 policies sur ~25 tables, creation de 2 fonctions helpers

