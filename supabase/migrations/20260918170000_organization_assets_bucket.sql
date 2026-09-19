-- Onda D5 — Bucket public « organization-assets » (logo organisme)
--
-- Convention de chemin : logo/<filename> (ex. logo/org-logo.png)
-- Bucket public pour que les logos s'affichent dans les factures PDF et les emails
-- sans URL signée.

INSERT INTO storage.buckets (id, name, public)
VALUES ('organization-assets', 'organization-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "rls_organization_assets_select_public" ON storage.objects;
DROP POLICY IF EXISTS "rls_organization_assets_insert_staff" ON storage.objects;
DROP POLICY IF EXISTS "rls_organization_assets_update_staff" ON storage.objects;
DROP POLICY IF EXISTS "rls_organization_assets_delete_staff" ON storage.objects;

CREATE POLICY "rls_organization_assets_select_public" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'organization-assets');

CREATE POLICY "rls_organization_assets_insert_staff" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'organization-assets' AND public.is_staff());

CREATE POLICY "rls_organization_assets_update_staff" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'organization-assets' AND public.is_staff())
  WITH CHECK (bucket_id = 'organization-assets' AND public.is_staff());

CREATE POLICY "rls_organization_assets_delete_staff" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'organization-assets' AND public.is_staff());

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'organization_assets_bucket',
  'storage.buckets',
  jsonb_build_object(
    'migration', '20260918170000_organization_assets_bucket',
    'point', 'Onda D5',
    'bucket', 'organization-assets',
    'bucket_public', true,
    'path_convention', 'logo/<filename>'
  )
);
