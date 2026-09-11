# Point A — Sécurité des évaluations de test (SNMSF / DSF)

Migration : `supabase/migrations/20260910090000_secure_test_evaluations_rls.sql`
Journal : `audit_log.action = 'securite_rls_test_evaluations'` (aucune donnée personnelle)

## 1. Constat corrigé

| Table | Politique avant | Effet |
|-------|-----------------|-------|
| `test_evaluations` | `SELECT` / `UPDATE` `TO authenticated USING (true)`, `INSERT WITH CHECK (true)` | tout compte connecté lisait et modifiait **toutes** les évaluations |
| `test_phrases` | `ALL TO authenticated USING (true)` + `SELECT` public sur `active` | référentiel modifiable par n'importe quel compte connecté |
| `test_criteria` | idem `test_phrases` | idem |
| `test_bookings` / `test_candidates` | staff seul (`is_staff()`) | aucune lecture possible par le candidat concerné |
| Storage certificats | PDF déposés dans le bucket **public** `documents`, URL publique permanente | certificat accessible sans authentification par toute personne connaissant l'URL |

## 2. Politiques après migration

### `test_evaluations`
- `rls_test_evaluations_select_staff` : `is_staff()`
- `rls_test_evaluations_select_candidate` : `is_student() AND owns_test_booking(booking_id) AND NOT test_booking_is_dsf(booking_id)` (C.2 : plus d'`attestation_type`)
- `rls_test_evaluations_insert_staff` / `rls_test_evaluations_update_staff` : `is_staff()`
- suppression : `is_admin()` (politique existante conservée)

### `test_bookings` / `test_candidates`
- lecture staff conservée (`is_staff()`)
- `rls_test_bookings_select_candidate` : ses réservations, hors commanditaire DSF
- `rls_test_candidates_select_candidate` : `student_id = get_my_student_id()`
- écriture : staff uniquement (politiques existantes)

### `test_phrases` / `test_criteria`
- lecture : `is_staff()` (le `SELECT` public est supprimé — le formulaire public `/register` n'utilise pas ces tables)
- écriture : `is_staff()` ; suppression : `is_admin()`

### Bucket `certificates` (nouveau, privé)
Chemin imposé : `<student_id>/<inscription_id>/<certificate_id>.pdf`
- `rls_certificates_storage_select_staff` : `is_staff()`
- `rls_certificates_storage_select_owner` : `is_student() AND (storage.foldername(name))[1] = get_my_student_id()::text`
- dépôt / mise à jour : `is_staff()` ; suppression : `is_admin()`

Côté application : `src/lib/certificateStorage.ts` (chemin, TTL, détection des URL historiques),
`src/components/certificates/CertificatePdfButton.tsx` (téléchargement via URL signée 10 min),
`useEndPack` dépose désormais dans le bucket privé et stocke le **chemin** dans `certificates.pdf_url`.
Les URL publiques historiques restent lisibles (`isLegacyPublicUrl`) ; aucun certificat n'existait
en base au moment de la migration, donc aucune reprise n'était nécessaire.

## 3. Fonctions d'aide

| Fonction | Rôle |
|----------|------|
| `owns_test_booking(uuid)` | rattache l'évaluation au stagiaire via `test_bookings` → `test_candidates.student_id` |
| `test_booking_is_dsf(uuid)` | commanditaire DSF (`test_bookings.sponsor_type = 'dsf'`, C.2) |

**Fait au point C.2** : `test_bookings.sponsor_type` / `sponsor_id` sont la source
de vérité ; `test_booking_is_dsf` lit `sponsor_type = 'dsf'`. Voir `docs/POINT_C2_SPONSOR_TYPE.md`.

## 4. Preuve exécutée sur la base live

Jeu de test synthétique (préfixe `ZZTEST`, e-mails `@example.invalid`), supprimé après contrôle :
deux comptes stagiaires, une école ESF, une entreprise commanditaire de type `dsf`, trois évaluations
(A hors DSF, B hors DSF, A sous commanditaire DSF).

Lecture en tant que compte stagiaire A (`request.jwt.claims.sub` + `role authenticated`) :

| Contrôle | Vu | Attendu |
|----------|----|---------|
| `test_evaluations` | 1 | 1 (la sienne, hors DSF) |
| `test_evaluations` DSF | 0 | 0 |
| `test_bookings` | 1 | 1 |
| `test_candidates` | 2 | ses fiches uniquement |
| `test_phrases` | 0 | 0 |
| `test_criteria` | 0 | 0 |
| `UPDATE test_evaluations` | 0 ligne modifiée | 0 |
| `INSERT test_phrases` | refus RLS (`42501`) | refus |
| Objets du bucket `certificates` | 1 (son dossier) | 1 |

Compte stagiaire B : ne voit que sa propre évaluation.
Compte staff : 3 évaluations, 3 réservations, 3 candidats, 2 objets de certificat.

### Vérification après déploiement (2026-09-10, commit `e0f90ab7`)

Contrôle refait sur <https://ski-linguist-hub.lovable.app> avec des comptes réels
(mot de passe bcrypt, connexion par l'API auth), supprimés après contrôle :

| Acteur | Opération | Résultat |
|--------|-----------|----------|
| anonyme | `GET /object/public/certificates/…` | `400 NoSuchBucket` — les URL publiques historiques sont mortes |
| staff | dépôt d'un PDF de certificat | `200` |
| stagiaire A | dépôt dans son propre dossier | `403`, violation de politique RLS |
| stagiaire A | `POST /object/sign/…` sur **son** certificat | `200` + `signedURL` |
| stagiaire A | téléchargement par l'URL signée | `200`, PDF identique à l'original |
| stagiaire A | `POST /object/sign/…` sur le certificat de **B** | refus `NoSuchKey` |
| anonyme | `POST /object/sign/…` | refus `NoSuchKey` |

Le même parcours a été rejoué depuis le portail stagiaire : `/student/documents`,
bouton « Télécharger », ouverture de l'URL signée
`/storage/v1/object/sign/certificates/<student_id>/…?token=…` et affichage du PDF.
Le refus sur le certificat d'un autre stagiaire ne révèle pas l'existence du fichier :
la politique le masque, donc l'API de signature ne le trouve pas.

## 5. Retour arrière (down)

```sql
-- Rétablit l'état antérieur à 20260910090000. À n'utiliser qu'en cas d'incident :
-- la politique restaurée est volontairement permissive.
BEGIN;

DROP POLICY IF EXISTS "rls_test_evaluations_select_staff" ON public.test_evaluations;
DROP POLICY IF EXISTS "rls_test_evaluations_select_candidate" ON public.test_evaluations;
DROP POLICY IF EXISTS "rls_test_evaluations_insert_staff" ON public.test_evaluations;
DROP POLICY IF EXISTS "rls_test_evaluations_update_staff" ON public.test_evaluations;
CREATE POLICY "Staff can view test_evaluations" ON public.test_evaluations
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert test_evaluations" ON public.test_evaluations
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can update test_evaluations" ON public.test_evaluations
  FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "rls_test_bookings_select_candidate" ON public.test_bookings;
DROP POLICY IF EXISTS "rls_test_candidates_select_candidate" ON public.test_candidates;

DROP POLICY IF EXISTS "rls_test_phrases_select_staff" ON public.test_phrases;
DROP POLICY IF EXISTS "rls_test_phrases_insert_staff" ON public.test_phrases;
DROP POLICY IF EXISTS "rls_test_phrases_update_staff" ON public.test_phrases;
DROP POLICY IF EXISTS "rls_test_phrases_delete_admin" ON public.test_phrases;
CREATE POLICY "Staff can manage phrases" ON public.test_phrases
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public can view active phrases" ON public.test_phrases
  FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "rls_test_criteria_select_staff" ON public.test_criteria;
DROP POLICY IF EXISTS "rls_test_criteria_insert_staff" ON public.test_criteria;
DROP POLICY IF EXISTS "rls_test_criteria_update_staff" ON public.test_criteria;
DROP POLICY IF EXISTS "rls_test_criteria_delete_admin" ON public.test_criteria;
CREATE POLICY "Staff can manage criteria" ON public.test_criteria
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public can view active criteria" ON public.test_criteria
  FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "rls_certificates_storage_select_staff" ON storage.objects;
DROP POLICY IF EXISTS "rls_certificates_storage_select_owner" ON storage.objects;
DROP POLICY IF EXISTS "rls_certificates_storage_insert_staff" ON storage.objects;
DROP POLICY IF EXISTS "rls_certificates_storage_update_staff" ON storage.objects;
DROP POLICY IF EXISTS "rls_certificates_storage_delete_admin" ON storage.objects;
-- Le bucket est conservé (des PDF peuvent déjà y être déposés) :
-- DELETE FROM storage.buckets WHERE id = 'certificates'; -- seulement si vide

DROP FUNCTION IF EXISTS public.owns_test_booking(uuid);
DROP FUNCTION IF EXISTS public.test_booking_is_dsf(uuid);

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES ('retour_arriere_securite_rls_test_evaluations', 'test_evaluations',
  jsonb_build_object('migration', '20260910090000_secure_test_evaluations_rls'));

COMMIT;
```

Le retour arrière côté application consiste à revenir au commit précédent de
`useEndPack.ts` (dépôt dans le bucket `documents` + URL publique).

## 6. Reste à traiter

- **BL-021** : le bucket `documents` est public en lecture et en dépôt (`Anyone can view/upload documents`).
  Il porte les pièces d'inscription. Hors périmètre du point A, à cadrer séparément.
- Rôle `formateur` (point C.1) : `is_staff()` couvre aujourd'hui tout compte non stagiaire ;
  le point C.1 introduira `is_formateur()` et restreindra les évaluations à ses propres dossiers.
