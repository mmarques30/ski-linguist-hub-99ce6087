-- Point 8 complet — les six modèles d'emails
--
-- Principe : aucun texte ne partira sans validation explicite.
--   * public.email_template_drafts  : le brouillon relisible / corrigeable
--   * public.email_templates        : ce que les fonctions Edge envoient réellement
--   * publish_email_template_draft  : copie brouillon -> actif, journalisée
--
-- Les modèles déjà validés au point 8-minimal (inscription_confirmation,
-- student_portal_invite) restent actifs et inchangés : leur brouillon est
-- initialisé depuis le texte live, sauf enrichissement demandé.
-- RESEND_API_KEY n'est pas dans le dépôt. Aucun cron n'est activé ici.

-- ---------------------------------------------------------------------------
-- 1. email_templates : rattachement à un modèle + trace de validation
-- ---------------------------------------------------------------------------

ALTER TABLE public.email_templates
  ADD COLUMN IF NOT EXISTS model_key text,
  ADD COLUMN IF NOT EXISTS variant_label text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS validated_at timestamptz,
  ADD COLUMN IF NOT EXISTS validated_by uuid;

-- ---------------------------------------------------------------------------
-- 2. Catalogue des six modèles
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.email_models (
  model_key text PRIMARY KEY,
  position integer NOT NULL,
  title_fr text NOT NULL,
  trigger_fr text NOT NULL,
  audience text NOT NULL CHECK (audience IN ('candidat', 'client', 'interne')),
  edge_function text,
  cron_jobname text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_models ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view email_models" ON public.email_models;
CREATE POLICY "Staff can view email_models" ON public.email_models
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin can write email_models" ON public.email_models;
CREATE POLICY "Admin can write email_models" ON public.email_models
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.email_models (model_key, position, title_fr, trigger_fr, audience, edge_function, cron_jobname) VALUES
  ('inscription_confirmation', 1,
   'Confirmation d''inscription',
   'Envoyé à la validation du formulaire /register (lieu, modalité, piste, paiement).',
   'candidat', 'submit-registration', NULL),
  ('inscription_ski_monitor_welcome', 2,
   'Documents d''inscription — moniteur de ski',
   'Envoyé avec les pièces jointes d''accueil pour une inscription moniteur en ligne.',
   'candidat', 'submit-registration', NULL),
  ('student_portal_invite', 3,
   'Accès à l''espace stagiaire',
   'Envoyé à la demande depuis la fiche stagiaire (lien magique à usage unique).',
   'candidat', 'invite-student-portal', NULL),
  ('schedule_validation_reminder', 4,
   'Validation des horaires J-10',
   'Rappel interne quotidien : inscriptions qui démarrent dans 10 jours sans groupe.',
   'interne', 'process-schedule-reminders', 'process-schedule-reminders'),
  ('invoice_reminder', 5,
   'Relance de paiement',
   'Relance quotidienne des factures échues : J+7, J+15, puis mise en demeure J+30.',
   'client', 'process-invoice-reminders', 'process-invoice-reminders'),
  ('satisfaction_survey_reminder', 6,
   'Questionnaire de satisfaction',
   'Relance du questionnaire non rempli : J+5 puis J+30 après ouverture.',
   'candidat', 'process-survey-reminders', 'process-survey-reminders')
ON CONFLICT (model_key) DO UPDATE SET
  position = EXCLUDED.position,
  title_fr = EXCLUDED.title_fr,
  trigger_fr = EXCLUDED.trigger_fr,
  audience = EXCLUDED.audience,
  edge_function = EXCLUDED.edge_function,
  cron_jobname = EXCLUDED.cron_jobname;

-- ---------------------------------------------------------------------------
-- 3. Brouillons relisibles
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.email_template_drafts (
  slug text PRIMARY KEY,
  model_key text NOT NULL REFERENCES public.email_models(model_key) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 1,
  variant_label text NOT NULL DEFAULT '',
  subject_fr text NOT NULL DEFAULT '',
  subject_en text NOT NULL DEFAULT '',
  subject_pt text NOT NULL DEFAULT '',
  body_fr text NOT NULL DEFAULT '',
  body_en text NOT NULL DEFAULT '',
  body_pt text NOT NULL DEFAULT '',
  variables jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_template_drafts_model
  ON public.email_template_drafts (model_key, position);

ALTER TABLE public.email_template_drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can read email_template_drafts" ON public.email_template_drafts;
CREATE POLICY "Admin can read email_template_drafts" ON public.email_template_drafts
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admin can write email_template_drafts" ON public.email_template_drafts;
CREATE POLICY "Admin can write email_template_drafts" ON public.email_template_drafts
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS trg_email_template_drafts_updated_at ON public.email_template_drafts;
CREATE TRIGGER trg_email_template_drafts_updated_at
  BEFORE UPDATE ON public.email_template_drafts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 4. Rattachement des modèles déjà en base
-- ---------------------------------------------------------------------------

UPDATE public.email_templates SET model_key = 'inscription_confirmation'
  WHERE slug = 'inscription_confirmation' AND model_key IS NULL;
UPDATE public.email_templates SET model_key = 'inscription_ski_monitor_welcome'
  WHERE slug = 'inscription_ski_monitor_welcome' AND model_key IS NULL;
UPDATE public.email_templates SET model_key = 'student_portal_invite'
  WHERE slug = 'student_portal_invite' AND model_key IS NULL;
UPDATE public.email_templates SET model_key = 'schedule_validation_reminder'
  WHERE slug = 'schedule_validation_reminder' AND model_key IS NULL;

-- Les deux textes relus avec Paula au point 8-minimal (PR #20).
UPDATE public.email_templates
SET validated_at = coalesce(validated_at, '2026-09-11 07:29:27.850208+00'::timestamptz)
WHERE slug IN ('inscription_confirmation', 'student_portal_invite');

-- ---------------------------------------------------------------------------
-- 5. Validation : brouillon -> actif, journalisée
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.publish_email_template_draft(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  d public.email_template_drafts;
  previous jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Réservé à un compte administrateur'
      USING ERRCODE = '42501';
  END IF;

  SELECT * INTO d FROM public.email_template_drafts WHERE slug = p_slug;
  IF d.slug IS NULL THEN
    RAISE EXCEPTION 'Aucun brouillon pour le modèle %', p_slug
      USING ERRCODE = 'P0002';
  END IF;

  IF btrim(d.subject_fr) = '' OR btrim(d.body_fr) = '' THEN
    RAISE EXCEPTION 'Sujet et corps français obligatoires avant activation'
      USING ERRCODE = '22023';
  END IF;

  SELECT to_jsonb(t) - 'id' INTO previous
  FROM public.email_templates t WHERE t.slug = p_slug;

  INSERT INTO public.email_templates (
    slug, model_key, variant_label,
    subject_fr, subject_en, subject_pt,
    body_fr, body_en, body_pt,
    variables, is_active, validated_at, validated_by, updated_at
  ) VALUES (
    d.slug, d.model_key, d.variant_label,
    d.subject_fr, d.subject_en, d.subject_pt,
    d.body_fr, d.body_en, d.body_pt,
    d.variables, true, now(), auth.uid(), now()
  )
  ON CONFLICT (slug) DO UPDATE SET
    model_key = EXCLUDED.model_key,
    variant_label = EXCLUDED.variant_label,
    subject_fr = EXCLUDED.subject_fr,
    subject_en = EXCLUDED.subject_en,
    subject_pt = EXCLUDED.subject_pt,
    body_fr = EXCLUDED.body_fr,
    body_en = EXCLUDED.body_en,
    body_pt = EXCLUDED.body_pt,
    variables = EXCLUDED.variables,
    is_active = true,
    validated_at = now(),
    validated_by = auth.uid(),
    updated_at = now();

  INSERT INTO public.audit_log (user_id, action, table_name, old_values, new_values)
  VALUES (
    auth.uid(), 'email_modele_valide', 'email_templates', previous,
    jsonb_build_object('slug', d.slug, 'model_key', d.model_key, 'is_active', true)
  );

  RETURN jsonb_build_object('slug', d.slug, 'model_key', d.model_key, 'is_active', true);
END;
$function$;

CREATE OR REPLACE FUNCTION public.unpublish_email_template(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  n integer;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Réservé à un compte administrateur'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.email_templates
  SET is_active = false, updated_at = now()
  WHERE slug = p_slug;

  GET DIAGNOSTICS n = ROW_COUNT;

  INSERT INTO public.audit_log (user_id, action, table_name, new_values)
  VALUES (
    auth.uid(), 'email_modele_desactive', 'email_templates',
    jsonb_build_object('slug', p_slug, 'is_active', false, 'lignes', n)
  );

  RETURN jsonb_build_object('slug', p_slug, 'is_active', false, 'lignes', n);
END;
$function$;

REVOKE ALL ON FUNCTION public.publish_email_template_draft(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.unpublish_email_template(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.publish_email_template_draft(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unpublish_email_template(text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 6. Vue d'ensemble pour /admin/emails
-- ---------------------------------------------------------------------------

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
              AND t.body_fr = d.body_fr
              AND coalesce(t.subject_en, '') = d.subject_en
              AND coalesce(t.body_en, '') = d.body_en
              AND coalesce(t.subject_pt, '') = d.subject_pt
              AND coalesce(t.body_pt, '') = d.body_pt) AS in_sync
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

-- ---------------------------------------------------------------------------
-- 7. Journal (aucune donnée personnelle)
-- ---------------------------------------------------------------------------

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'emails_8_complet_schema',
  'email_models',
  jsonb_build_object(
    'migration', '20260915100000_emails_8_complet_modeles',
    'modeles', 6,
    'crons_actives', 0,
    'resend_key_in_repo', false
  )
);
