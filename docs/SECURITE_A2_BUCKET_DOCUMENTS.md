# Point A2 (BL-021) — Bucket `documents` privé

Migration : `supabase/migrations/20260910110000_private_documents_bucket.sql`
Journal : `audit_log.action = 'securite_bucket_documents_prive'` (aucune donnée personnelle)
Preuve complète : `point_a2_bucket_documents_preuve.log` (transmis hors dépôt)

## 1. Constat corrigé

| Bucket | Politique avant | Effet |
|--------|-----------------|-------|
| `documents` | `public = true` ; `Anyone can view documents` (`SELECT TO public`) | toute personne connaissant l'URL lisait une convention, une pièce d'identité, une attestation, **sans authentification** |
| `documents` | `Anyone can upload documents` (`INSERT TO public`) | dépôt de fichier arbitraire dans le bucket, sans authentification |
| `funding-documents` | `Staff can view / upload funding docs` `TO authenticated` **sans contrôle de rôle** | malgré leur nom, tout compte connecté — y compris un compte stagiaire — lisait et déposait les pièces de financement de tous les stagiaires |

Le défaut sur `funding-documents` a été traité dans la même migration : il s'agit du
même bucket de pièces justificatives, avec la même classe de défaut, et le corriger
séparément aurait laissé la fuite ouverte entre les deux livraisons.

## 2. Politiques après migration

Convention de chemin, commune au bucket `certificates` :

```
<student_id>/<...>   objet rattaché à un stagiaire
staff/<...>          objet interne, lisible par le staff uniquement
register/<...>       pièce déposée avant création du dossier stagiaire
```

`documents` et `funding-documents` sont désormais `public = false`, comme `certificates`.

| Politique | Opération | Condition |
|-----------|-----------|-----------|
| `rls_documents_storage_select_staff` | `SELECT` | `is_staff()` |
| `rls_documents_storage_select_owner` | `SELECT` | `is_student() AND storage_object_belongs_to_me(name)` |
| `rls_documents_storage_insert_staff` | `INSERT` | `is_staff()` |
| `rls_documents_storage_update_staff` | `UPDATE` | `is_staff()` |
| `rls_documents_storage_delete_admin` | `DELETE` | `is_admin()` |
| `rls_funding_storage_*` | idem | idem, sur `bucket_id = 'funding-documents'` |

Fonction d'aide :

| Fonction | Rôle |
|----------|------|
| `storage_object_belongs_to_me(text)` | `get_my_student_id() IS NOT NULL AND (storage.foldername(_name))[1] = get_my_student_id()::text` — `STABLE SECURITY DEFINER`, `search_path` figé |

## 3. Dépôt depuis le formulaire public `/register`

Aucune politique `INSERT` n'est ouverte au rôle `anon` : le client anonyme ne peut plus
écrire dans le bucket. Le seul chemin de dépôt public est l'edge function
`supabase/functions/upload-registration-document`, déclarée `verify_jwt = false` dans
`supabase/config.toml` et qui utilise `SUPABASE_SERVICE_ROLE_KEY` côté serveur.

Contrôles appliqués par la fonction :

- types acceptés : `application/pdf`, `image/jpeg`, `image/png` (extension déduite du type, jamais du nom de fichier) ;
- taille maximale 10 Mo, rejet du fichier vide ;
- `studentId` validé comme UUID s'il est fourni, sinon dépôt sous `register/` ;
- nom de fichier normalisé (`sanitizeSegment`) et préfixé d'un UUID, ce qui interdit la traversée de chemin et l'écrasement d'un objet existant (`upsert: false`) ;
- réponse `{ path }` : **jamais** une URL publique.

Côté client, `src/services/registrationDocuments.ts` est le point d'entrée unique.
Le formulaire `/register` ne comporte pas encore de pièce jointe ; le service est en
place pour que l'ajout futur ne puisse pas réintroduire un appel direct à
`supabase.storage.upload` depuis le navigateur.

## 4. URL signées côté application

`CertificatePdfButton` accepte désormais un `bucket` (défaut `certificates`) et génère
une URL signée de 10 minutes à la demande. `isLegacyPublicUrl` laisse passer les URL
complètes héritées, s'il en réapparaissait. Les seuls appels `supabase.storage` de `src/`
sont ce composant (lecture signée) et `useEndPack` (dépôt du certificat) ; aucun autre
code applicatif ne construit d'URL publique.

## 5. Rapport de reprise

| Bucket | Objets inventoriés | Déplacés | Orphelins |
|--------|--------------------|----------|-----------|
| `documents` | 0 | 0 | 0 |
| `funding-documents` | 0 | 0 | 0 |

| Colonne | Lignes | URL réécrites | Restantes en `http` |
|---------|--------|---------------|---------------------|
| `document_sendings.pdf_url` | 0 | 0 | 0 |
| `certificates.pdf_url` | 0 | 0 | 0 |
| `test_candidates.photo_*_url` | 0 | 0 | 0 |

Aucun déplacement n'était nécessaire : les deux buckets étaient vides. Les deux blocs
`UPDATE` de la migration sont malgré tout conservés et **idempotents**, pour couvrir les
lignes créées entre l'inventaire et l'application de la migration.

`inscriptions` ne porte aucune colonne d'URL de document ; la table de rattachement est
`document_sendings`.

**Hors périmètre, à cadrer** : `instructors.cv_url` contient 16 liens `drive.google.com`.
Ce ne sont pas des objets Supabase Storage, donc ni la mise en privé ni la réécriture ne
s'y appliquent. Si ces CV doivent être rapatriés dans le bucket, c'est une reprise de
données distincte.

## 6. Preuve exécutée sur la base live

Jeu de test synthétique (préfixe `ZZDOC`, e-mails `@example.invalid`), supprimé après
contrôle : deux comptes stagiaires, un compte admin, trois objets dans `documents`
(un par stagiaire, un interne `staff/`) et un objet dans `funding-documents`.
Usurpation par `set_config('request.jwt.claims', …, true)` + `set local role`.

| Acteur | Objets vus (sur 4) | Attendu |
|--------|--------------------|---------|
| staff (`admin`) | 4 | 4 |
| stagiaire A | 1 — le sien | 1 |
| stagiaire B | 2 — les siens, dans les deux buckets | 2 |
| anonyme | 0, et 0 bucket public | 0 |

Contrôles négatifs en écriture :

| Acteur | Tentative | Résultat |
|--------|-----------|----------|
| anonyme | `INSERT` dans `documents` | refus `42501` |
| stagiaire A | `INSERT` dans son propre dossier | refus `42501` |
| stagiaire A | `INSERT` dans le dossier de B | refus `42501` |

Le stagiaire ne dépose pas lui-même : le dépôt est réservé au staff et à l'edge function.

### Contrôle au niveau HTTP (API Storage réelle, et non plus seulement la RLS en SQL)

| Requête | Réponse |
|---------|---------|
| `GET /storage/v1/object/public/documents/…` | `400` `{"statusCode":"404","error":"Bucket not found","code":"NoSuchBucket"}` |
| `GET /storage/v1/object/public/funding-documents/…` | idem |
| `GET /storage/v1/object/public/certificates/…` | idem |
| `POST /storage/v1/object/list/documents` (clé anon) | `[]` |
| `POST /storage/v1/object/documents/<fichier>` (clé anon) | `400` `{"statusCode":"403","message":"new row violates row-level security policy"}` |

Le point de terminaison « public » ne connaît plus ces buckets : toute URL publique
diffusée par le passé est inopérante, et le dépôt anonyme est refusé par la RLS.

Nettoyage vérifié : 0 objet, 0 compte et 0 stagiaire `ZZDOC` restants,
`students` revenu à 669 lignes.

## 7. Retour arrière (down)

```sql
-- Rétablit l'état antérieur à 20260910110000. À n'utiliser qu'en cas d'incident :
-- les politiques restaurées exposent publiquement les pièces d'inscription.
BEGIN;

DROP POLICY IF EXISTS "rls_documents_storage_select_staff" ON storage.objects;
DROP POLICY IF EXISTS "rls_documents_storage_select_owner" ON storage.objects;
DROP POLICY IF EXISTS "rls_documents_storage_insert_staff" ON storage.objects;
DROP POLICY IF EXISTS "rls_documents_storage_update_staff" ON storage.objects;
DROP POLICY IF EXISTS "rls_documents_storage_delete_admin" ON storage.objects;

CREATE POLICY "Anyone can view documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents');
CREATE POLICY "Anyone can upload documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents');

DROP POLICY IF EXISTS "rls_funding_storage_select_staff" ON storage.objects;
DROP POLICY IF EXISTS "rls_funding_storage_select_owner" ON storage.objects;
DROP POLICY IF EXISTS "rls_funding_storage_insert_staff" ON storage.objects;
DROP POLICY IF EXISTS "rls_funding_storage_update_staff" ON storage.objects;
DROP POLICY IF EXISTS "rls_funding_storage_delete_admin" ON storage.objects;

CREATE POLICY "Staff can view funding docs" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'funding-documents');
CREATE POLICY "Staff can upload funding docs" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'funding-documents');
CREATE POLICY "Staff can update funding docs" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'funding-documents');
CREATE POLICY "Admin can delete funding docs" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'funding-documents' AND is_admin());

UPDATE storage.buckets SET public = true WHERE id = 'documents';

DROP FUNCTION IF EXISTS public.storage_object_belongs_to_me(text);

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES ('retour_arriere_securite_bucket_documents_prive', 'storage.objects',
  jsonb_build_object('migration', '20260910110000_private_documents_bucket'));

COMMIT;
```

La réécriture des URL (section 5 de la migration) n'a rien modifié : il n'y a rien à
défaire. Si des lignes avaient été réécrites, le retour arrière consisterait à
reconstruire l'URL publique par concaténation du préfixe
`<VITE_SUPABASE_URL>/storage/v1/object/public/documents/` au chemin stocké.

Côté application, le retour arrière consiste à revenir au commit précédent
(`registrationDocuments.ts` et l'edge function n'étant appelés par aucun écran, leur
présence est sans effet fonctionnel).

## 8. Reste à traiter

- La suppression d'objets reste réservée à `is_admin()` et n'est exposée par aucun écran ;
  à câbler si une purge RGPD manuelle devient nécessaire.
- `instructors.cv_url` : liens Google Drive, hors Storage (section 5).
- Point C.2 : lorsque `attestation_type` sera remplacé par `sponsor_type`, les politiques
  candidat du point A devront être réécrites dans la même migration, avec la même preuve
  par jeu de test. Les politiques de stockage du présent point ne sont pas concernées.
