-- Les crons appellent les Edge Functions via public.dispatch_edge_function(),
-- qui joint le JWT Vault `edge_dispatch_jwt`. Historiquement ce secret était
-- la clé **anon** (suffisante pour verify_jwt=true) — ce qui n'est PAS une
-- protection : n'importe qui avec la clé publique de l'app pouvait invoquer
-- process-*-reminders, send-inscription-documents, send-daily-ops-digest, etc.
--
-- Les Edge Functions exigent désormais service_role ou staff (admin-auth.ts).
-- Le secret Vault doit donc être la clé service_role du projet.
--
-- Rotation : à faire côté Lovable Cloud / Supabase Dashboard (Vault), car la
-- clé service_role n'est volontairement pas dans le dépôt ni dans cette
-- migration. Tant que le secret reste l'anon key, les crons recevront 403.

UPDATE public.edge_dispatch_config
SET
  description = 'JWT Authorization des crons : doit être la clé service_role (plus la clé anon).',
  updated_at = now()
WHERE key = 'vault_secret_name';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'edge_dispatch_jwt') THEN
    UPDATE vault.secrets
    SET description = 'JWT service_role pour dispatch_edge_function. Remplacer si encore égal à la clé anon (finding sécurité cron 2026-10).'
    WHERE name = 'edge_dispatch_jwt';
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'vault.secrets absent — rotation manuelle requise';
  WHEN OTHERS THEN
    RAISE NOTICE 'Impossible de mettre à jour la description Vault : %', SQLERRM;
END $$;
