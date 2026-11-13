-- Test de fin : modèle actif + cron collectives (dernier jour) +
-- déclenchement immédiat pour les individuelles (bilan sortie / Terminée).

-- 1. Activer le modèle (brouillon validé Paula 2026-11-13).
UPDATE public.email_templates
SET is_active = true, updated_at = now()
WHERE slug = 'exit_test_invite';

INSERT INTO public.email_models (
  model_key, position, title_fr, trigger_fr, audience, edge_function, cron_jobname
)
VALUES (
  'exit_test_invite',
  92,
  'Invitation test de fin de formation',
  'Collectives : dernier jour (end_date, cron 7h15 Paris). Individuelles : dès bilan de sortie formateur/Paula ou passage à Terminée (trigger + file cron).',
  'candidat',
  'process-exit-test-invites',
  'process-exit-test-invites'
)
ON CONFLICT (model_key) DO UPDATE SET
  title_fr = EXCLUDED.title_fr,
  trigger_fr = EXCLUDED.trigger_fr,
  audience = EXCLUDED.audience,
  edge_function = EXCLUDED.edge_function,
  cron_jobname = EXCLUDED.cron_jobname,
  position = EXCLUDED.position;

-- 2. Cron matinal (inactif tant que non activé depuis /admin/emails ;
--    email_crons_live force dry_run sur les jobs planifiés).
DO $$
DECLARE
  target_jobid bigint;
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-exit-test-invites') THEN
    PERFORM cron.unschedule('process-exit-test-invites');
  END IF;

  -- 06:15 UTC ≈ 07:15 / 08:15 Europe/Paris
  PERFORM cron.schedule(
    'process-exit-test-invites',
    '15 6 * * *',
    $cron$SELECT public.dispatch_edge_function(
      'process-exit-test-invites',
      '{}'::jsonb,
      'process-exit-test-invites',
      public.email_crons_dispatch_query()
    );$cron$
  );

  SELECT jobid INTO target_jobid FROM cron.job WHERE jobname = 'process-exit-test-invites';
  IF target_jobid IS NOT NULL THEN
    PERFORM cron.alter_job(target_jobid, active := false);
  END IF;
END $$;

-- 3. Helper SQL : formation individuelle ?
CREATE OR REPLACE FUNCTION public.is_individuelle_formation(
  p_course_type text,
  p_modality text
)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN lower(coalesce(p_course_type, '')) LIKE '%collect%' THEN false
    WHEN lower(coalesce(p_course_type, '')) LIKE '%individ%' THEN true
    WHEN lower(coalesce(p_modality, '')) LIKE '%collect%'
      OR lower(coalesce(p_modality, '')) LIKE '%groupe%' THEN false
    ELSE true
  END;
$$;

COMMENT ON FUNCTION public.is_individuelle_formation(text, text) IS
  'Discriminateur envoi auto test de fin — aligné sur exitTestFormationKind.';

-- 4. Trigger : individuelles dès déclaration de fin.
CREATE OR REPLACE FUNCTION public.trg_exit_test_invite_individuelle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  finished_now boolean := false;
  status_finished boolean := false;
BEGIN
  IF NEW.exit_test_invited_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF NOT public.is_individuelle_formation(NEW.course_type, NEW.modality) THEN
    RETURN NEW;
  END IF;

  IF lower(coalesce(NEW.status, '')) IN (
    'annulee', 'annulée', 'cancelled', 'canceled', 'brouillon', 'en_attente'
  ) THEN
    RETURN NEW;
  END IF;

  IF OLD.exit_form_completed_at IS NULL AND NEW.exit_form_completed_at IS NOT NULL THEN
    finished_now := true;
  END IF;

  IF OLD.status IS DISTINCT FROM NEW.status
     AND lower(coalesce(NEW.status, '')) = 'terminee' THEN
    status_finished := true;
  END IF;

  IF NOT (finished_now OR status_finished) THEN
    RETURN NEW;
  END IF;

  PERFORM public.dispatch_edge_function(
    'send-exit-test-invite',
    jsonb_build_object('inscriptionId', NEW.id),
    'exit-test-invite-individuelle'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS exit_test_invite_individuelle ON public.inscriptions;
CREATE TRIGGER exit_test_invite_individuelle
  AFTER UPDATE OF exit_form_completed_at, status ON public.inscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_exit_test_invite_individuelle();

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'exit_test_auto_invite',
  'inscriptions',
  jsonb_build_object(
    'migration', '20261113093000_exit_test_auto_invite',
    'template', 'exit_test_invite',
    'cron', 'process-exit-test-invites',
    'cron_active', false,
    'trigger', 'exit_test_invite_individuelle'
  )
);
