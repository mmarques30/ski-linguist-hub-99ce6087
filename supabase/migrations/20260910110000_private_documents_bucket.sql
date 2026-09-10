-- Point A2 (BL-021) — Bucket « documents » privé
--
-- Constat corrigé : le bucket `documents` était public (`storage.buckets.public = true`)
-- avec « Anyone can view documents » (SELECT, rôle public) et « Anyone can upload
-- documents » (INSERT, rôle public) : n'importe qui pouvait lire un objet dont il
-- connaissait l'URL, et déposer un fichier sans authentification.
-- Le bucket `funding-documents` était réservé à `authenticated` sans contrôle de rôle :
-- tout compte stagiaire pouvait lire et déposer des pièces de financement.
--
-- Convention de chemin (identique au bucket `certificates`) :
--   <student_id>/<...>   objet rattaché à un stagiaire
--   staff/<...>          objet interne, lisible par le staff uniquement
--
-- Le dépôt depuis le formulaire public /register passe par l'edge function
-- `upload-registration-document` (clé service-role), jamais par le client anonyme.
--
-- Script de retour (down) documenté dans docs/SECURITE_A2_BUCKET_DOCUMENTS.md.

-- ---------------------------------------------------------------------------
-- 1. Fonction d'aide : l'objet appartient-il au stagiaire connecté ?
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.storage_object_belongs_to_me(_name text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT public.get_my_student_id() IS NOT NULL
     AND (storage.foldername(_name))[1] = public.get_my_student_id()::text
$function$;

-- ---------------------------------------------------------------------------
-- 2. Bucket privé
-- ---------------------------------------------------------------------------

UPDATE storage.buckets SET public = false WHERE id IN ('documents', 'funding-documents');

-- ---------------------------------------------------------------------------
-- 3. Politiques du bucket « documents »
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Anyone can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "rls_documents_storage_select_staff" ON storage.objects;
DROP POLICY IF EXISTS "rls_documents_storage_select_owner" ON storage.objects;
DROP POLICY IF EXISTS "rls_documents_storage_insert_staff" ON storage.objects;
DROP POLICY IF EXISTS "rls_documents_storage_update_staff" ON storage.objects;
DROP POLICY IF EXISTS "rls_documents_storage_delete_admin" ON storage.objects;

CREATE POLICY "rls_documents_storage_select_staff" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND is_staff());

CREATE POLICY "rls_documents_storage_select_owner" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND is_student()
    AND public.storage_object_belongs_to_me(name)
  );

-- Aucun dépôt anonyme : le staff dépose depuis le back-office, le formulaire
-- public passe par l'edge function (clé service-role, qui contourne la RLS).
CREATE POLICY "rls_documents_storage_insert_staff" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents' AND is_staff());

CREATE POLICY "rls_documents_storage_update_staff" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'documents' AND is_staff())
  WITH CHECK (bucket_id = 'documents' AND is_staff());

CREATE POLICY "rls_documents_storage_delete_admin" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'documents' AND is_admin());

-- ---------------------------------------------------------------------------
-- 4. Politiques du bucket « funding-documents » (même défaut de portée)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Staff can view funding docs" ON storage.objects;
DROP POLICY IF EXISTS "Staff can upload funding docs" ON storage.objects;
DROP POLICY IF EXISTS "Staff can update funding docs" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete funding docs" ON storage.objects;
DROP POLICY IF EXISTS "rls_funding_storage_select_staff" ON storage.objects;
DROP POLICY IF EXISTS "rls_funding_storage_select_owner" ON storage.objects;
DROP POLICY IF EXISTS "rls_funding_storage_insert_staff" ON storage.objects;
DROP POLICY IF EXISTS "rls_funding_storage_update_staff" ON storage.objects;
DROP POLICY IF EXISTS "rls_funding_storage_delete_admin" ON storage.objects;

CREATE POLICY "rls_funding_storage_select_staff" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'funding-documents' AND is_staff());

CREATE POLICY "rls_funding_storage_select_owner" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'funding-documents'
    AND is_student()
    AND public.storage_object_belongs_to_me(name)
  );

CREATE POLICY "rls_funding_storage_insert_staff" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'funding-documents' AND is_staff());

CREATE POLICY "rls_funding_storage_update_staff" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'funding-documents' AND is_staff())
  WITH CHECK (bucket_id = 'funding-documents' AND is_staff());

CREATE POLICY "rls_funding_storage_delete_admin" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'funding-documents' AND is_admin());

-- ---------------------------------------------------------------------------
-- 5. Reprise des chemins et des URL stockées
--
--    Inventaire au moment de la migration : 0 objet dans `documents`,
--    0 objet dans `funding-documents`, 0 ligne `document_sendings`,
--    0 `certificates.pdf_url`, 0 `test_candidates.photo_*_url`.
--    `instructors.cv_url` (16 lignes) pointe vers drive.google.com : hors Storage,
--    donc non concerné.
--    Aucun déplacement d'objet ni réécriture d'URL n'était nécessaire ; le bloc
--    ci-dessous est idempotent et couvre le cas d'objets déposés entre-temps.
-- ---------------------------------------------------------------------------

UPDATE public.document_sendings
SET pdf_url = regexp_replace(
      pdf_url,
      '^https?://[^/]+/storage/v1/object/(public|sign)/(documents|certificates)/',
      ''
    )
WHERE pdf_url ~ '^https?://[^/]+/storage/v1/object/(public|sign)/(documents|certificates)/';

UPDATE public.certificates
SET pdf_url = regexp_replace(
      pdf_url,
      '^https?://[^/]+/storage/v1/object/(public|sign)/(documents|certificates)/',
      ''
    )
WHERE pdf_url ~ '^https?://[^/]+/storage/v1/object/(public|sign)/(documents|certificates)/';

-- ---------------------------------------------------------------------------
-- 6. Journal (aucune donnée personnelle)
-- ---------------------------------------------------------------------------

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'securite_bucket_documents_prive',
  'storage.objects',
  jsonb_build_object(
    'migration', '20260910110000_private_documents_bucket',
    'point', 'A2',
    'backlog', 'BL-021',
    'before', 'bucket documents public + insert/select role public',
    'after', 'bucket prive ; select staff ou stagiaire proprietaire ; insert staff ou edge function service-role ; delete admin',
    'buckets', jsonb_build_array('documents', 'funding-documents'),
    'objets_inventories', 0,
    'objets_deplaces', 0,
    'objets_orphelins', 0,
    'urls_reecrites', 0
  )
);
