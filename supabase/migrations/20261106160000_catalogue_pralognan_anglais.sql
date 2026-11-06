-- Paula 2026-11-06 : ouvrir ESF Pralognan anglais (S26) au catalogue /register.
-- Présentiel 24 h, 7–11 déc. 2026, tarif unique 850 € (toutes écoles).
-- Formateur·trice à confirmer (selon effectifs Gets / Samoëns).

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
  is_active,
  sort_order
)
SELECT
  (SELECT id FROM public.seasons WHERE is_current = true LIMIT 1),
  'S26',
  'pralognan',
  'ESF Pralognan',
  'english',
  'Anglais',
  'in_person',
  'Présentiel',
  24,
  '2026-12-07'::date,
  '2026-12-11'::date,
  '7–11 déc. 2026',
  'Présentiel 24 h',
  NULL,
  850,
  850,
  ARRAY['esf-518']::text[],
  NULL,
  false,
  'individuel',
  'open',
  true,
  26
WHERE NOT EXISTS (
  SELECT 1
  FROM public.registration_offerings
  WHERE session_code = 'S26'
    AND is_active = true
);

-- Idempotent : si S26 existe déjà (ré-application), aligne les champs métier.
UPDATE public.registration_offerings
SET
  location_key = 'pralognan',
  location_label = 'ESF Pralognan',
  language_key = 'english',
  language_label = 'Anglais',
  modality_key = 'in_person',
  modality_label = 'Présentiel',
  duration_hours = 24,
  start_date = '2026-12-07'::date,
  end_date = '2026-12-11'::date,
  date_label = '7–11 déc. 2026',
  format_label = 'Présentiel 24 h',
  base_price = 850,
  partner_price = 850,
  partner_school_codes = ARRAY['esf-518']::text[],
  partner_price_alt = NULL,
  partner_price_pending = false,
  funding_mode = 'individuel',
  enrollment_status = 'open',
  is_active = true,
  sort_order = 26,
  season_id = COALESCE(
    season_id,
    (SELECT id FROM public.seasons WHERE is_current = true LIMIT 1)
  ),
  updated_at = now()
WHERE session_code = 'S26';

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'catalogue_pralognan_anglais',
  'registration_offerings',
  jsonb_build_object(
    'migration', '20261106160000_catalogue_pralognan_anglais',
    'session_code', 'S26',
    'location', 'ESF Pralognan',
    'language', 'Anglais',
    'dates', '2026-12-07 → 2026-12-11',
    'price_unique_eur', 850,
    'partner_school_codes', jsonb_build_array('esf-518'),
    'enrollment_status', 'open'
  )
);
