-- Paula 2026-11-13 : Nicole Bottollier — Samoëns portugais FIFPL (hors forfait ESF S21).
-- Même lieu / dates que S21, dossier individuel 24 h / 900 €, invite whitelist elle seule.
-- enrollment_status = open temporairement : le front www.fli.fr n'a pas encore invite_only
-- (sinon Continuer bloqué à l'étape 1). submit-registration refuse tout e-mail hors invites.
-- À repasser en invite_only dès publication du front #268.

INSERT INTO public.registration_offerings (
  season_id,
  session_code,
  location_key,
  location_label,
  language_key,
  language_label,
  modality_key,
  modality_label,
  duration_hours,
  start_date,
  end_date,
  date_label,
  format_label,
  instructor_label,
  base_price,
  partner_price,
  partner_school_codes,
  partner_price_alt,
  partner_price_pending,
  funding_mode,
  enrollment_status,
  student_payment_required,
  is_active,
  sort_order
)
SELECT
  (SELECT id FROM public.seasons WHERE is_current = true LIMIT 1),
  'S27',
  'samoens',
  'ESF Samoëns',
  'portuguese',
  'Portugais brésilien',
  'in_person',
  'Présentiel',
  24,
  '2026-12-14'::date,
  '2026-12-18'::date,
  '14–18 déc. 2026',
  'Présentiel 24 h',
  NULL,
  900,
  900,
  ARRAY['esf-599']::text[],
  NULL,
  false,
  'individuel',
  'open',
  true,
  true,
  27
WHERE NOT EXISTS (
  SELECT 1
  FROM public.registration_offerings
  WHERE session_code = 'S27'
);

UPDATE public.registration_offerings
SET
  location_key = 'samoens',
  location_label = 'ESF Samoëns',
  language_key = 'portuguese',
  language_label = 'Portugais brésilien',
  modality_key = 'in_person',
  modality_label = 'Présentiel',
  duration_hours = 24,
  start_date = '2026-12-14'::date,
  end_date = '2026-12-18'::date,
  date_label = '14–18 déc. 2026',
  format_label = 'Présentiel 24 h',
  base_price = 900,
  partner_price = 900,
  partner_school_codes = ARRAY['esf-599']::text[],
  partner_price_alt = NULL,
  partner_price_pending = false,
  funding_mode = 'individuel',
  enrollment_status = 'open',
  student_payment_required = true,
  is_active = true,
  sort_order = 27,
  season_id = COALESCE(
    season_id,
    (SELECT id FROM public.seasons WHERE is_current = true LIMIT 1)
  ),
  updated_at = now()
WHERE session_code = 'S27';

-- Invite Nicole uniquement sur S27
WITH s27 AS (
  SELECT id
  FROM public.registration_offerings
  WHERE session_code = 'S27'
  LIMIT 1
)
INSERT INTO public.registration_offering_invites (
  offering_id, email, civility, first_name, last_name, notes
)
SELECT
  s27.id,
  'bcrnicole@orange.fr',
  'Madame',
  'NICOLE',
  'BOTTOLLIER-CURTET',
  'FIFPL individuel 24 h / 900 € — Samoëns hors forfait ESF S21'
FROM s27
WHERE NOT EXISTS (
  SELECT 1
  FROM public.registration_offering_invites existing
  WHERE existing.offering_id = s27.id
    AND public.normalize_registration_invite_email(existing.email)
      = public.normalize_registration_invite_email('bcrnicole@orange.fr')
);

-- Retirer Nicole de la whitelist S21 (parcours forfait sans paiement)
DELETE FROM public.registration_offering_invites i
USING public.registration_offerings o
WHERE i.offering_id = o.id
  AND o.session_code = 'S21'
  AND public.normalize_registration_invite_email(i.email)
    = public.normalize_registration_invite_email('bcrnicole@orange.fr');

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'nicole_samoens_fifpl_s27',
  'registration_offerings',
  jsonb_build_object(
    'migration', '20261113113000_nicole_samoens_fifpl_s27',
    'session_code', 'S27',
    'location', 'ESF Samoëns',
    'language', 'Portugais brésilien',
    'dates', '2026-12-14 → 2026-12-18',
    'duration_hours', 24,
    'price_eur', 900,
    'funding_mode', 'individuel',
    'enrollment_status', 'open',
    'enrollment_status_note', 'open + whitelist invites (front sans invite_only)',
    'student_payment_required', true,
    'invite_email', 'bcrnicole@orange.fr',
    'register_link', 'https://www.fli.fr/register?session=S27',
    'removed_from_s21_invite', true
  )
);
