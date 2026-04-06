

# Module de gestion des formateurs

## Contexte

La table `instructors` existe deja avec : `languages`, `hourly_rate`, `siret`, `status`, `specialties`, `geographic_zones`, etc. La table `instructor_payments` existe aussi avec des colonnes en francais (`montant`, `statut`, `periode_debut`, etc.) et est deja utilisee par le module financier. Il ne faut donc PAS recreer `instructor_payments`.

## 1. Migration SQL

### Enrichir `instructors` (colonnes manquantes uniquement)
```sql
ALTER TABLE public.instructors
  ADD COLUMN IF NOT EXISTS tax_status text DEFAULT 'auto_entrepreneur',
  ADD COLUMN IF NOT EXISTS availability_status text DEFAULT 'disponible',
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS rating_average numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS certifications jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
```
- `languages` existe deja (= languages_taught)
- `hourly_rate` et `siret` existent deja

### Creer `instructor_sessions`
```sql
CREATE TABLE public.instructor_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  inscription_id uuid REFERENCES public.inscriptions(id) ON DELETE SET NULL,
  session_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  duration_hours numeric NOT NULL,
  status text NOT NULL DEFAULT 'planifiee',
  location text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.instructor_sessions ENABLE ROW LEVEL SECURITY;
-- RLS: same pattern as other tables (authenticated SELECT/INSERT/UPDATE, admin DELETE)
```

### `instructor_payments` - Pas de changement
La table existe et est deja integree au module financier. On la reutilise telle quelle.

### Trigger updated_at sur instructors
```sql
CREATE TRIGGER set_instructors_updated_at
  BEFORE UPDATE ON public.instructors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 2. Fichiers a creer (6)

### `src/hooks/useInstructors.ts`
- `useInstructors(filters?)` : liste avec filtres par langue, disponibilite, recherche
- `useInstructorDetails(id)` : profil complet + stats (heures ce mois, note moyenne)
- `useCreateInstructor()` / `useUpdateInstructor()` / `useDeleteInstructor()`
- `useInstructorSessions(instructorId)` : sessions planifiees et passees
- `useCreateSession()` / `useUpdateSession()`
- `useCheckScheduleConflict(instructorId, date, startTime, endTime)` : verification de conflit

### `src/pages/formateurs/InstructorsList.tsx`
- Grille de cartes avec : photo (avatar fallback), nom, langues enseignees (badges), statut de disponibilite (badge colore), heures ce mois, note moyenne (etoiles)
- Filtres : langue, disponibilite, recherche texte
- Bouton "Ajouter un formateur"
- Clic sur une carte → navigation vers `/formateurs/:id`

### `src/pages/formateurs/InstructorDetails.tsx`
- Header avec photo, nom, statut, contact
- 4 onglets (Tabs) :
  - **Profil** : infos personnelles, certifications (jsonb affiché en liste), tarif horaire, statut fiscal, SIRET, bio
  - **Planning** : calendrier/liste des sessions a venir depuis `instructor_sessions`
  - **Historique** : sessions passees (status = 'realisee'), evaluations recues (jointure avec `test_evaluations`)
  - **Paiements** : releve depuis `instructor_payments` existant (montant, periode, statut)

### `src/components/formateurs/InstructorFormDialog.tsx`
- Formulaire creation/edition : nom, prenom, email, telephone, langues (multi-select), specialites, tarif horaire, statut fiscal, SIRET, bio, certifications, zones geographiques
- Upload photo vers storage bucket `documents`

### `src/components/formateurs/SessionFormDialog.tsx`
- Formulaire creation de session : formateur (pre-selectionne si depuis la fiche), inscription (select), date, heure debut/fin, lieu, notes
- Verification automatique de conflit d'horaire avant enregistrement (appel a `useCheckScheduleConflict`)

### `src/components/formateurs/InstructorCard.tsx`
- Composant carte reutilisable pour la liste : avatar, nom, langues, disponibilite, heures/mois, note

## 3. Fichiers a modifier (3)

### `src/App.tsx`
- Ajouter routes `/formateurs` et `/formateurs/:id` (protegees)

### `src/components/layout/Sidebar.tsx`
- Ajouter groupe "Formateurs" entre "Formation" et "Qualite" avec icone `UserCog`
- Un seul item : "Formateurs" → `/formateurs`

### `src/lib/route-permissions.ts`
- Ajouter `{ key: "formateurs", label: "Formateurs" }` dans un nouveau groupe ou dans Formation
- Ajouter `"/formateurs": "formateurs"` dans `PATH_TO_ROUTE_KEY`

## 4. Integration Sessions
- Dans `src/pages/Classes.tsx` : ajouter un select "Formateur" lors de la creation d'une session, qui cree aussi une entree dans `instructor_sessions`
- La verification de conflit affiche un warning si le formateur a deja une session au meme creneau

## 5. i18n
Toutes les chaines suivent le pattern existant avec `useLanguage()` et objets `translations` locaux (FR, PT-BR, EN).

## Resume
- 1 migration (enrichir instructors + creer instructor_sessions + RLS + trigger)
- 6 fichiers crees
- 3 fichiers modifies
- 0 impact sur instructor_payments existant

