-- Emails transactionnels : français uniquement.
-- Les colonnes subject_en/body_en/subject_pt/body_pt restent (héritage NOT NULL)
-- mais sont vidées et ignorées par l'UI, le rendu et le contrôle in_sync.

UPDATE public.email_template_drafts
SET
  subject_en = '',
  body_en = '',
  subject_pt = '',
  body_pt = '',
  updated_at = now()
WHERE subject_en <> ''
   OR body_en <> ''
   OR subject_pt <> ''
   OR body_pt <> '';

UPDATE public.email_templates
SET
  subject_en = '',
  body_en = '',
  subject_pt = '',
  body_pt = '',
  updated_at = now()
WHERE subject_en <> ''
   OR body_en <> ''
   OR subject_pt <> ''
   OR body_pt <> '';

CREATE OR REPLACE FUNCTION public.email_models_overview()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Réservé à un compte administrateur'
      USING ERRCODE = '42501';
  END IF;

  SELECT coalesce(jsonb_agg(m ORDER BY m.position), '[]'::jsonb) INTO result
  FROM (
    SELECT
      em.model_key,
      em.position,
      em.title_fr,
      em.trigger_fr,
      em.audience,
      em.edge_function,
      em.cron_jobname,
      (
        SELECT jsonb_build_object('exists', true, 'active', j.active, 'schedule', j.schedule)
        FROM cron.job j
        WHERE j.jobname = em.cron_jobname
        LIMIT 1
      ) AS cron,
      (
        SELECT coalesce(jsonb_agg(v ORDER BY v.position, v.slug), '[]'::jsonb)
        FROM (
          SELECT
            d.slug,
            d.position,
            d.variant_label,
            d.subject_fr, d.subject_en, d.subject_pt,
            d.body_fr, d.body_en, d.body_pt,
            d.variables,
            d.notes,
            d.updated_at AS draft_updated_at,
            t.is_active,
            t.validated_at,
            t.subject_fr AS live_subject_fr,
            t.body_fr AS live_body_fr,
            (t.slug IS NOT NULL
              AND t.subject_fr = d.subject_fr
              AND t.body_fr = d.body_fr) AS in_sync
          FROM public.email_template_drafts d
          LEFT JOIN public.email_templates t ON t.slug = d.slug
          WHERE d.model_key = em.model_key
        ) v
      ) AS variants
    FROM public.email_models em
  ) m;

  RETURN result;
END;
$function$;

REVOKE ALL ON FUNCTION public.email_models_overview() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.email_models_overview() TO authenticated;

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'emails_fr_only',
  'email_templates',
  jsonb_build_object(
    'migration', '20260917190000_emails_fr_only',
    'note', 'EN/PT vidés ; envois et édition admin en français uniquement'
  )
);
