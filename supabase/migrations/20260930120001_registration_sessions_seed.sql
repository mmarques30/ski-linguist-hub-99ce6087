-- Seed catalogue /register — sessions 1–25 + packs individuels en ligne (saison 2026-2027).
-- Idempotent via session_code.

INSERT INTO public.seasons (name, slug, start_date, end_date, status, is_current)
SELECT 'Saison 2026-2027', '2026-2027', '2026-12-01'::date, '2027-03-31'::date, 'en_cours', true
WHERE NOT EXISTS (SELECT 1 FROM public.seasons WHERE is_current = true);

-- Désactive l'ancien catalogue sans code session (packs historiques, etc.)
UPDATE public.registration_offerings
SET is_active = false, updated_at = now()
WHERE is_active = true
  AND session_code IS NULL;

-- Met à jour les sessions déjà présentes
UPDATE public.registration_offerings AS ro
SET
  location_key = v.location_key,
  location_label = v.location_label,
  language_key = v.language_key,
  language_label = v.language_label,
  modality_key = v.modality_key,
  modality_label = v.modality_label,
  duration_hours = v.duration_hours,
  start_date = v.start_date,
  end_date = v.end_date,
  date_label = v.date_label,
  format_label = v.format_label,
  instructor_label = v.instructor_label,
  base_price = v.base_price,
  partner_price = v.partner_price,
  partner_school_codes = v.partner_school_codes,
  enrollment_status = v.enrollment_status,
  is_active = true,
  sort_order = v.sort_order,
  updated_at = now(),
  season_id = (SELECT id FROM public.seasons WHERE is_current = true LIMIT 1)
FROM (VALUES
  ('S01', 'sainte-foy-tarentaise', 'Sainte-Foy-Tarentaise', 'portuguese', 'Portugais brésilien', 'in_person', 'Présentiel', 24, '2026-11-23'::date, '2026-11-27'::date, '23–27 nov. 2026', 'Présentiel 24 h', 'Carolina Resende', 950::numeric, 950::numeric, ARRAY[]::text[], 'open', 1),
  ('S02', 'saint-jean-de-maurienne', 'Saint-Jean-de-Maurienne', 'english', 'Anglais', 'in_person', 'Présentiel', 24, '2026-11-23'::date, '2026-11-27'::date, '23–27 nov. 2026', 'Présentiel 24 h', 'Martine', 950::numeric, 950::numeric, ARRAY[]::text[], 'open', 2),
  ('S03', 'val-disere', 'ESF Val d''Isère', 'portuguese', 'Portugais brésilien', 'in_person', 'Présentiel', 24, '2026-11-23'::date, '2026-11-27'::date, '23–27 nov. 2026', 'Présentiel 24 h', 'Tulio Rezende', 900::numeric, 900::numeric, ARRAY['esf-671']::text[], 'open', 3),
  ('S04', 'font-romeu', 'ESF Font-Romeu', 'spanish', 'Espagnol', 'in_person', 'Présentiel', 24, '2026-11-23'::date, '2026-11-27'::date, '23–27 nov. 2026', 'Présentiel 24 h', 'Dominique Langer', 900::numeric, 800::numeric, ARRAY['esf-329']::text[], 'waitlist', 4),
  ('S05', 'val-disere', 'ESF Val d''Isère', 'english', 'Anglais', 'in_person', 'Présentiel', 24, '2026-11-30'::date, '2026-12-04'::date, '30 nov.–4 déc. 2026', 'Présentiel 24 h', 'Georgios Constandi', 900::numeric, 900::numeric, ARRAY['esf-671']::text[], 'open', 5),
  ('S06', 'meribel', 'ESF Méribel', 'english', 'Anglais', 'in_person', 'Présentiel', 24, '2026-11-30'::date, '2026-12-04'::date, '30 nov.–4 déc. 2026', 'Présentiel 24 h', 'Anna Tessier', 900::numeric, 900::numeric, ARRAY['esf-422']::text[], 'open', 6),
  ('S07', 'oz-en-oisans', 'ESF Oz en Oisans', 'english', 'Anglais', 'in_person', 'Présentiel', 24, '2026-11-30'::date, '2026-12-04'::date, '30 nov.–4 déc. 2026', 'Présentiel 24 h', 'John Weinreb', 900::numeric, 800::numeric, ARRAY['esf-523']::text[], 'waitlist', 7),
  ('S08', 'oz-en-oisans', 'ESF Oz en Oisans', 'dutch', 'Néerlandais', 'in_person', 'Présentiel', 24, '2026-11-30'::date, '2026-12-04'::date, '30 nov.–4 déc. 2026', 'Présentiel 24 h', 'Lydia', 900::numeric, 800::numeric, ARRAY['esf-523']::text[], 'waitlist', 8),
  ('S09', 'serre-chevalier', 'Serre Chevalier', 'portuguese', 'Portugais brésilien', 'in_person', 'Présentiel', 24, '2026-11-30'::date, '2026-12-04'::date, '30 nov.–4 déc. 2026', 'Présentiel 24 h', 'Carolina Resende', 950::numeric, 800::numeric, ARRAY['esf-210', 'esf-620', 'esf-437', 'esf-623']::text[], 'waitlist', 9),
  ('S10', 'la-rosiere', 'ESF La Rosière', 'portuguese', 'Portugais brésilien', 'in_person', 'Présentiel', 40, '2026-11-30'::date, '2026-12-11'::date, '30 nov.–11 déc. 2026', 'Présentiel 40 h', 'Tulio Rezende', 1500::numeric, 1500::numeric, ARRAY['esf-548']::text[], 'open', 10),
  ('S11', 'brides-les-bains', 'Brides-les-Bains', 'russian', 'Russe', 'in_person', 'Présentiel', 24, '2026-11-30'::date, '2026-12-04'::date, '30 nov.–4 déc. 2026', 'Présentiel 24 h', 'Tatiana Samoilova', 950::numeric, 950::numeric, ARRAY[]::text[], 'open', 11),
  ('S12', 'chatel', 'ESF Châtel', 'english', 'Anglais', 'in_person', 'Présentiel', 24, '2026-12-08'::date, '2026-12-12'::date, '8–12 déc. 2026', 'Présentiel 24 h', 'Anna Tessier', 900::numeric, 750::numeric, ARRAY['esf-260', 'esf-254']::text[], 'open', 12),
  ('S13', 'samoens', 'ESF Samoëns', 'english', 'Anglais', 'in_person', 'Présentiel', 24, '2026-12-07'::date, '2026-12-11'::date, '7–11 déc. 2026', 'Présentiel 24 h', 'Martine', 900::numeric, 800::numeric, ARRAY['esf-599']::text[], 'waitlist', 13),
  ('S14', 'meribel', 'ESF Méribel', 'portuguese', 'Portugais brésilien', 'in_person', 'Présentiel', 24, '2026-12-07'::date, '2026-12-11'::date, '7–11 déc. 2026', 'Présentiel 24 h', 'Carolina Resende', 900::numeric, 900::numeric, ARRAY['esf-422']::text[], 'open', 14),
  ('S15', 'les-gets', 'ESF Les Gets', 'english', 'Anglais', 'in_person', 'Présentiel', 24, '2026-12-07'::date, '2026-12-11'::date, '7–11 déc. 2026', 'Présentiel 24 h', 'Georgios Constandi', 900::numeric, 800::numeric, ARRAY['esf-347']::text[], 'waitlist', 15),
  ('S16', 'les-gets', 'ESF Les Gets', 'dutch', 'Néerlandais', 'in_person', 'Présentiel', 24, '2026-12-07'::date, '2026-12-11'::date, '7–11 déc. 2026', 'Présentiel 24 h', 'Lydia', 900::numeric, 800::numeric, ARRAY['esf-347']::text[], 'waitlist', 16),
  ('S17', 'val-cenis', 'ESF Val Cenis', 'english', 'Anglais', 'in_person', 'Présentiel', 24, '2026-12-14'::date, '2026-12-18'::date, '14–18 déc. 2026', 'Présentiel 24 h', 'Anna Tessier', 900::numeric, 750::numeric, ARRAY['esf-668']::text[], 'open', 17),
  ('S18', 'val-cenis', 'ESF Val Cenis', 'dutch', 'Néerlandais', 'in_person', 'Présentiel', 24, '2026-12-14'::date, '2026-12-18'::date, '14–18 déc. 2026', 'Présentiel 24 h', 'Lydia', 900::numeric, 750::numeric, ARRAY['esf-668']::text[], 'open', 18),
  ('S19', 'la-clusaz', 'ESF La Clusaz', 'english', 'Anglais', 'in_person', 'Présentiel', 24, '2026-12-14'::date, '2026-12-18'::date, '14–18 déc. 2026', 'Présentiel 24 h', 'Georgios Constandi', 900::numeric, 800::numeric, ARRAY['esf-263', 'esf-356', 'esf-407']::text[], 'open', 19),
  ('S20', 'valmorel', 'Valmorel', 'portuguese', 'Portugais brésilien', 'in_person', 'Présentiel', 24, '2026-12-14'::date, '2026-12-18'::date, '14–18 déc. 2026', 'Présentiel 24 h', 'Carolina Resende', 950::numeric, 950::numeric, ARRAY[]::text[], 'open', 20),
  ('S21', 'samoens', 'ESF Samoëns', 'portuguese', 'Portugais brésilien', 'in_person', 'Présentiel', 40, '2026-12-14'::date, '2026-12-18'::date, '14–18 déc. 2026', 'Présentiel 2 × 20 h', 'Tulio Rezende', 3800::numeric, 3800::numeric, ARRAY['esf-599']::text[], 'waitlist', 21),
  ('S22', 'online', 'En ligne', 'spanish', 'Espagnol', 'online_group', 'En ligne (collectif)', 24, '2026-10-27'::date, '2026-11-19'::date, '27 oct.–19 nov. 2026', 'Visio 24 h', 'Dominique Langer', 900::numeric, 900::numeric, ARRAY[]::text[], 'waitlist', 22),
  ('S23', 'online', 'En ligne', 'english', 'Anglais', 'online_group', 'En ligne (collectif)', 24, '2026-11-03'::date, '2026-11-26'::date, '3–26 nov. 2026', 'Visio 24 h', 'Maxime Goy', 900::numeric, 900::numeric, ARRAY[]::text[], 'waitlist', 23),
  ('S24', 'online', 'En ligne', 'russian', 'Russe', 'online_group', 'En ligne (collectif)', 24, '2026-11-03'::date, '2026-11-26'::date, '3–26 nov. 2026 (mar. & jeu. 17 h 30–20 h 30)', 'Visio 24 h', 'Tatiana Samoilova', 900::numeric, 900::numeric, ARRAY[]::text[], 'open', 24),
  ('S25', 'online', 'En ligne', 'portuguese', 'Portugais brésilien', 'online_group', 'En ligne (collectif)', 24, '2026-11-16'::date, '2026-12-09'::date, '16 nov.–9 déc. 2026 (lun. & mer. 17 h 30–20 h 30)', 'Visio 24 h', 'Flavia Lana Faria', 900::numeric, 900::numeric, ARRAY[]::text[], 'open', 25)
) AS v(
  session_code, location_key, location_label, language_key, language_label,
  modality_key, modality_label, duration_hours, start_date, end_date,
  date_label, format_label, instructor_label, base_price, partner_price,
  partner_school_codes, enrollment_status, sort_order
)
WHERE ro.session_code = v.session_code;

-- Insert sessions manquantes
INSERT INTO public.registration_offerings (
  season_id, session_code, location_key, location_label, language_key, language_label,
  modality_key, modality_label, duration_hours, start_date, end_date, date_label,
  format_label, instructor_label, base_price, partner_price, partner_school_codes,
  enrollment_status, is_active, sort_order
)
SELECT
  (SELECT id FROM public.seasons WHERE is_current = true LIMIT 1),
  v.session_code, v.location_key, v.location_label, v.language_key, v.language_label,
  v.modality_key, v.modality_label, v.duration_hours, v.start_date, v.end_date, v.date_label,
  v.format_label, v.instructor_label, v.base_price, v.partner_price, v.partner_school_codes,
  v.enrollment_status, true, v.sort_order
FROM (VALUES
  ('S01', 'sainte-foy-tarentaise', 'Sainte-Foy-Tarentaise', 'portuguese', 'Portugais brésilien', 'in_person', 'Présentiel', 24, '2026-11-23'::date, '2026-11-27'::date, '23–27 nov. 2026', 'Présentiel 24 h', 'Carolina Resende', 950::numeric, 950::numeric, ARRAY[]::text[], 'open', 1),
  ('S02', 'saint-jean-de-maurienne', 'Saint-Jean-de-Maurienne', 'english', 'Anglais', 'in_person', 'Présentiel', 24, '2026-11-23'::date, '2026-11-27'::date, '23–27 nov. 2026', 'Présentiel 24 h', 'Martine', 950::numeric, 950::numeric, ARRAY[]::text[], 'open', 2),
  ('S03', 'val-disere', 'ESF Val d''Isère', 'portuguese', 'Portugais brésilien', 'in_person', 'Présentiel', 24, '2026-11-23'::date, '2026-11-27'::date, '23–27 nov. 2026', 'Présentiel 24 h', 'Tulio Rezende', 900::numeric, 900::numeric, ARRAY['esf-671']::text[], 'open', 3),
  ('S04', 'font-romeu', 'ESF Font-Romeu', 'spanish', 'Espagnol', 'in_person', 'Présentiel', 24, '2026-11-23'::date, '2026-11-27'::date, '23–27 nov. 2026', 'Présentiel 24 h', 'Dominique Langer', 900::numeric, 800::numeric, ARRAY['esf-329']::text[], 'waitlist', 4),
  ('S05', 'val-disere', 'ESF Val d''Isère', 'english', 'Anglais', 'in_person', 'Présentiel', 24, '2026-11-30'::date, '2026-12-04'::date, '30 nov.–4 déc. 2026', 'Présentiel 24 h', 'Georgios Constandi', 900::numeric, 900::numeric, ARRAY['esf-671']::text[], 'open', 5),
  ('S06', 'meribel', 'ESF Méribel', 'english', 'Anglais', 'in_person', 'Présentiel', 24, '2026-11-30'::date, '2026-12-04'::date, '30 nov.–4 déc. 2026', 'Présentiel 24 h', 'Anna Tessier', 900::numeric, 900::numeric, ARRAY['esf-422']::text[], 'open', 6),
  ('S07', 'oz-en-oisans', 'ESF Oz en Oisans', 'english', 'Anglais', 'in_person', 'Présentiel', 24, '2026-11-30'::date, '2026-12-04'::date, '30 nov.–4 déc. 2026', 'Présentiel 24 h', 'John Weinreb', 900::numeric, 800::numeric, ARRAY['esf-523']::text[], 'waitlist', 7),
  ('S08', 'oz-en-oisans', 'ESF Oz en Oisans', 'dutch', 'Néerlandais', 'in_person', 'Présentiel', 24, '2026-11-30'::date, '2026-12-04'::date, '30 nov.–4 déc. 2026', 'Présentiel 24 h', 'Lydia', 900::numeric, 800::numeric, ARRAY['esf-523']::text[], 'waitlist', 8),
  ('S09', 'serre-chevalier', 'Serre Chevalier', 'portuguese', 'Portugais brésilien', 'in_person', 'Présentiel', 24, '2026-11-30'::date, '2026-12-04'::date, '30 nov.–4 déc. 2026', 'Présentiel 24 h', 'Carolina Resende', 950::numeric, 800::numeric, ARRAY['esf-210', 'esf-620', 'esf-437', 'esf-623']::text[], 'waitlist', 9),
  ('S10', 'la-rosiere', 'ESF La Rosière', 'portuguese', 'Portugais brésilien', 'in_person', 'Présentiel', 40, '2026-11-30'::date, '2026-12-11'::date, '30 nov.–11 déc. 2026', 'Présentiel 40 h', 'Tulio Rezende', 1500::numeric, 1500::numeric, ARRAY['esf-548']::text[], 'open', 10),
  ('S11', 'brides-les-bains', 'Brides-les-Bains', 'russian', 'Russe', 'in_person', 'Présentiel', 24, '2026-11-30'::date, '2026-12-04'::date, '30 nov.–4 déc. 2026', 'Présentiel 24 h', 'Tatiana Samoilova', 950::numeric, 950::numeric, ARRAY[]::text[], 'open', 11),
  ('S12', 'chatel', 'ESF Châtel', 'english', 'Anglais', 'in_person', 'Présentiel', 24, '2026-12-08'::date, '2026-12-12'::date, '8–12 déc. 2026', 'Présentiel 24 h', 'Anna Tessier', 900::numeric, 750::numeric, ARRAY['esf-260', 'esf-254']::text[], 'open', 12),
  ('S13', 'samoens', 'ESF Samoëns', 'english', 'Anglais', 'in_person', 'Présentiel', 24, '2026-12-07'::date, '2026-12-11'::date, '7–11 déc. 2026', 'Présentiel 24 h', 'Martine', 900::numeric, 800::numeric, ARRAY['esf-599']::text[], 'waitlist', 13),
  ('S14', 'meribel', 'ESF Méribel', 'portuguese', 'Portugais brésilien', 'in_person', 'Présentiel', 24, '2026-12-07'::date, '2026-12-11'::date, '7–11 déc. 2026', 'Présentiel 24 h', 'Carolina Resende', 900::numeric, 900::numeric, ARRAY['esf-422']::text[], 'open', 14),
  ('S15', 'les-gets', 'ESF Les Gets', 'english', 'Anglais', 'in_person', 'Présentiel', 24, '2026-12-07'::date, '2026-12-11'::date, '7–11 déc. 2026', 'Présentiel 24 h', 'Georgios Constandi', 900::numeric, 800::numeric, ARRAY['esf-347']::text[], 'waitlist', 15),
  ('S16', 'les-gets', 'ESF Les Gets', 'dutch', 'Néerlandais', 'in_person', 'Présentiel', 24, '2026-12-07'::date, '2026-12-11'::date, '7–11 déc. 2026', 'Présentiel 24 h', 'Lydia', 900::numeric, 800::numeric, ARRAY['esf-347']::text[], 'waitlist', 16),
  ('S17', 'val-cenis', 'ESF Val Cenis', 'english', 'Anglais', 'in_person', 'Présentiel', 24, '2026-12-14'::date, '2026-12-18'::date, '14–18 déc. 2026', 'Présentiel 24 h', 'Anna Tessier', 900::numeric, 750::numeric, ARRAY['esf-668']::text[], 'open', 17),
  ('S18', 'val-cenis', 'ESF Val Cenis', 'dutch', 'Néerlandais', 'in_person', 'Présentiel', 24, '2026-12-14'::date, '2026-12-18'::date, '14–18 déc. 2026', 'Présentiel 24 h', 'Lydia', 900::numeric, 750::numeric, ARRAY['esf-668']::text[], 'open', 18),
  ('S19', 'la-clusaz', 'ESF La Clusaz', 'english', 'Anglais', 'in_person', 'Présentiel', 24, '2026-12-14'::date, '2026-12-18'::date, '14–18 déc. 2026', 'Présentiel 24 h', 'Georgios Constandi', 900::numeric, 800::numeric, ARRAY['esf-263', 'esf-356', 'esf-407']::text[], 'open', 19),
  ('S20', 'valmorel', 'Valmorel', 'portuguese', 'Portugais brésilien', 'in_person', 'Présentiel', 24, '2026-12-14'::date, '2026-12-18'::date, '14–18 déc. 2026', 'Présentiel 24 h', 'Carolina Resende', 950::numeric, 950::numeric, ARRAY[]::text[], 'open', 20),
  ('S21', 'samoens', 'ESF Samoëns', 'portuguese', 'Portugais brésilien', 'in_person', 'Présentiel', 40, '2026-12-14'::date, '2026-12-18'::date, '14–18 déc. 2026', 'Présentiel 2 × 20 h', 'Tulio Rezende', 3800::numeric, 3800::numeric, ARRAY['esf-599']::text[], 'waitlist', 21),
  ('S22', 'online', 'En ligne', 'spanish', 'Espagnol', 'online_group', 'En ligne (collectif)', 24, '2026-10-27'::date, '2026-11-19'::date, '27 oct.–19 nov. 2026', 'Visio 24 h', 'Dominique Langer', 900::numeric, 900::numeric, ARRAY[]::text[], 'waitlist', 22),
  ('S23', 'online', 'En ligne', 'english', 'Anglais', 'online_group', 'En ligne (collectif)', 24, '2026-11-03'::date, '2026-11-26'::date, '3–26 nov. 2026', 'Visio 24 h', 'Maxime Goy', 900::numeric, 900::numeric, ARRAY[]::text[], 'waitlist', 23),
  ('S24', 'online', 'En ligne', 'russian', 'Russe', 'online_group', 'En ligne (collectif)', 24, '2026-11-03'::date, '2026-11-26'::date, '3–26 nov. 2026 (mar. & jeu. 17 h 30–20 h 30)', 'Visio 24 h', 'Tatiana Samoilova', 900::numeric, 900::numeric, ARRAY[]::text[], 'open', 24),
  ('S25', 'online', 'En ligne', 'portuguese', 'Portugais brésilien', 'online_group', 'En ligne (collectif)', 24, '2026-11-16'::date, '2026-12-09'::date, '16 nov.–9 déc. 2026 (lun. & mer. 17 h 30–20 h 30)', 'Visio 24 h', 'Flavia Lana Faria', 900::numeric, 900::numeric, ARRAY[]::text[], 'open', 25)
) AS v(
  session_code, location_key, location_label, language_key, language_label,
  modality_key, modality_label, duration_hours, start_date, end_date,
  date_label, format_label, instructor_label, base_price, partner_price,
  partner_school_codes, enrollment_status, sort_order
)
WHERE NOT EXISTS (
  SELECT 1 FROM public.registration_offerings ro WHERE ro.session_code = v.session_code
);

-- Packs individuels en ligne : 6 / 9 / 12 / 15 / 18 h à 50 €/h (promo avant 13/10/2026)
INSERT INTO public.registration_offerings (
  season_id, session_code, location_key, location_label, language_key, language_label,
  modality_key, modality_label, duration_hours, start_date, end_date, date_label,
  format_label, instructor_label, base_price, partner_price, partner_school_codes,
  enrollment_status, is_active, sort_order
)
SELECT
  (SELECT id FROM public.seasons WHERE is_current = true LIMIT 1),
  'IND-' || lang.key || '-' || hrs.h,
  'online', 'En ligne', lang.key, lang.label,
  'online_individual', 'En ligne (individuel)', hrs.h,
  NULL, NULL, 'Dates flexibles — planning à convenir',
  'Individuel ' || hrs.h || ' h', NULL,
  hrs.h * 50, hrs.h * 50, ARRAY[]::text[],
  'open', true, 100 + lang.ord * 10 + hrs.ord
FROM (
  VALUES
    ('english', 'Anglais', 0),
    ('portuguese', 'Portugais brésilien', 1),
    ('russian', 'Russe', 2),
    ('dutch', 'Néerlandais', 3),
    ('german', 'Allemand', 4),
    ('spanish', 'Espagnol', 5),
    ('italian', 'Italien', 6),
    ('chinese', 'Chinois', 7),
    ('french', 'Français (FLE)', 8)
) AS lang(key, label, ord)
CROSS JOIN (
  VALUES (6, 0), (9, 1), (12, 2), (15, 3), (18, 4)
) AS hrs(h, ord)
WHERE NOT EXISTS (
  SELECT 1 FROM public.registration_offerings ro
  WHERE ro.session_code = 'IND-' || lang.key || '-' || hrs.h
);

UPDATE public.registration_offerings AS ro
SET
  base_price = (ro.duration_hours * 50),
  partner_price = (ro.duration_hours * 50),
  partner_school_codes = ARRAY[]::text[],
  enrollment_status = 'open',
  is_active = true,
  date_label = 'Dates flexibles — planning à convenir',
  format_label = 'Individuel ' || ro.duration_hours || ' h',
  language_label = CASE ro.language_key
    WHEN 'portuguese' THEN 'Portugais brésilien'
    ELSE ro.language_label
  END,
  updated_at = now()
WHERE ro.session_code LIKE 'IND-%'
  AND ro.modality_key = 'online_individual';

COMMENT ON TABLE public.registration_offerings IS
  'Catalogue /register — sessions 2026-2027 (présentiel, collectif, individuel) + waitlist.';
