-- Lien de suivi public par inscription (/suivi/:token).
-- Colonne opaque + RPC SECURITY DEFINER (données minimales, sans montants).

ALTER TABLE public.inscriptions
  ADD COLUMN IF NOT EXISTS access_token uuid;

UPDATE public.inscriptions
SET access_token = gen_random_uuid()
WHERE access_token IS NULL;

ALTER TABLE public.inscriptions
  ALTER COLUMN access_token SET DEFAULT gen_random_uuid(),
  ALTER COLUMN access_token SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS inscriptions_access_token_uidx
  ON public.inscriptions (access_token);

COMMENT ON COLUMN public.inscriptions.access_token IS
  'Jeton opaque pour la page publique /suivi/:token (sans login).';

-- ---------------------------------------------------------------------------
-- Lecture publique minimale
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_inscription_suivi_by_token(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  docs_count integer;
  paid_count integer;
  pending_count integer;
  payment_label text;
BEGIN
  IF p_token IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT
    COALESCE(COUNT(*) FILTER (
      WHERE lower(COALESCE(p.status, '')) IN ('recu', 'encaisse', 'paye', 'valide')
    ), 0),
    COALESCE(COUNT(*) FILTER (
      WHERE lower(COALESCE(p.status, '')) IN ('en_attente', 'pending', 'a_venir')
    ), 0)
  INTO paid_count, pending_count
  FROM public.payments p
  JOIN public.inscriptions i ON i.id = p.inscription_id
  WHERE i.access_token = p_token;

  IF paid_count > 0 AND pending_count = 0 THEN
    payment_label := 'regle';
  ELSIF paid_count > 0 AND pending_count > 0 THEN
    payment_label := 'partiel';
  ELSIF pending_count > 0 THEN
    payment_label := 'a_regler';
  ELSE
    payment_label := 'aucun';
  END IF;

  SELECT COUNT(*)::integer
  INTO docs_count
  FROM public.document_sendings ds
  JOIN public.inscriptions i ON i.id = ds.inscription_id
  WHERE i.access_token = p_token;

  SELECT jsonb_build_object(
    'code', i.code,
    'status', i.status,
    'language', i.language,
    'start_date', i.start_date,
    'end_date', i.end_date,
    'dates_to_confirm', COALESCE(i.dates_to_confirm, false),
    'schedule', i.schedule,
    'rhythm', i.rhythm,
    'course_location', i.course_location,
    'modality', i.modality,
    'first_name', st.first_name,
    'documents_available', COALESCE(docs_count, 0) > 0,
    'documents_count', COALESCE(docs_count, 0),
    'payment_status', payment_label,
    'has_portal_account', st.auth_user_id IS NOT NULL
  )
  INTO result
  FROM public.inscriptions i
  LEFT JOIN public.students st ON st.id = i.student_id
  WHERE i.access_token = p_token
  LIMIT 1;

  RETURN result;
END;
$$;

COMMENT ON FUNCTION public.get_inscription_suivi_by_token(uuid) IS
  'Page publique /suivi/:token — statut, dates, horaire, docs disponibles, solde (libellé seul).';

GRANT EXECUTE ON FUNCTION public.get_inscription_suivi_by_token(uuid) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Régénération du jeton (staff)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.regenerate_inscription_access_token(p_inscription_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_token uuid;
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Accès réservé au personnel';
  END IF;

  new_token := gen_random_uuid();
  UPDATE public.inscriptions
  SET access_token = new_token
  WHERE id = p_inscription_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inscription introuvable';
  END IF;

  RETURN new_token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.regenerate_inscription_access_token(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Emails de confirmation : variable suivi_url (brouillons + actifs si présents)
-- ---------------------------------------------------------------------------
UPDATE public.email_template_drafts
SET
  body_fr = replace(
    body_fr,
    '<p style="margin:0 0 16px">Pour toute question, répondez à ce message : il arrive directement à info@fli.fr.</p>',
    '<p style="margin:0 0 16px">Suivez votre dossier à tout moment : <a href="{{suivi_url}}" style="color:#111">{{suivi_url}}</a></p>
<p style="margin:0 0 16px">Pour toute question, répondez à ce message : il arrive directement à info@fli.fr.</p>'
  ),
  variables = CASE
    WHEN variables::text LIKE '%suivi_url%' THEN variables
    ELSE COALESCE(variables, '[]'::jsonb) || '["suivi_url"]'::jsonb
  END,
  updated_at = now()
WHERE slug IN (
  'inscription_confirmation_individual',
  'inscription_confirmation_group',
  'inscription_confirmation'
)
AND body_fr NOT LIKE '%suivi_url%';

UPDATE public.email_templates
SET
  body_fr = replace(
    body_fr,
    '<p style="margin:0 0 16px">Pour toute question, répondez à ce message : il arrive directement à info@fli.fr.</p>',
    '<p style="margin:0 0 16px">Suivez votre dossier à tout moment : <a href="{{suivi_url}}" style="color:#111">{{suivi_url}}</a></p>
<p style="margin:0 0 16px">Pour toute question, répondez à ce message : il arrive directement à info@fli.fr.</p>'
  ),
  variables = CASE
    WHEN variables::text LIKE '%suivi_url%' THEN variables
    ELSE COALESCE(variables, '[]'::jsonb) || '["suivi_url"]'::jsonb
  END,
  updated_at = now()
WHERE slug IN (
  'inscription_confirmation_individual',
  'inscription_confirmation_group',
  'inscription_confirmation'
)
AND body_fr NOT LIKE '%suivi_url%';
