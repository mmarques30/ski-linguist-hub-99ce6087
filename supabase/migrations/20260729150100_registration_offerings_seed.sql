-- Données initiales du catalogue inscription (à ajuster en admin)
-- Crée une saison courante si aucune n'existe encore
INSERT INTO public.seasons (name, slug, start_date, end_date, status, is_current)
SELECT 'Saison 2026-2027', '2026-2027', '2026-12-01'::date, '2027-03-31'::date, 'en_cours', true
WHERE NOT EXISTS (SELECT 1 FROM public.seasons WHERE is_current = true);

INSERT INTO public.registration_offerings (
  season_id, location_key, location_label, language_key, language_label,
  modality_key, modality_label, duration_hours, start_date, end_date, date_label,
  base_price, sort_order
)
SELECT
  s.id,
  v.location_key,
  v.location_label,
  v.language_key,
  v.language_label,
  v.modality_key,
  v.modality_label,
  v.duration_hours,
  v.start_date::date,
  v.end_date::date,
  v.date_label,
  v.base_price,
  v.sort_order
FROM public.seasons s
CROSS JOIN (
  VALUES
    -- Courchevel — présentiel Anglais
    ('courchevel', 'Courchevel', 'english', 'Anglais', 'in_person', 'Présentiel', 12, '2026-12-07', '2026-12-11', 'Semaine 1 — 7-11 déc. 2026', 420, 10),
    ('courchevel', 'Courchevel', 'english', 'Anglais', 'in_person', 'Présentiel', 20, '2026-12-14', '2026-12-18', 'Semaine 2 — 14-18 déc. 2026', 580, 11),
    ('courchevel', 'Courchevel', 'portuguese', 'Portugais', 'in_person', 'Présentiel', 12, '2026-12-07', '2026-12-11', 'Semaine 1 — 7-11 déc. 2026', 420, 12),
    ('courchevel', 'Courchevel', 'german', 'Allemand', 'in_person', 'Présentiel', 12, '2027-01-11', '2027-01-15', 'Semaine 3 — 11-15 janv. 2027', 420, 13),
    -- La Rosière
    ('la-rosiere', 'La Rosière', 'english', 'Anglais', 'in_person', 'Présentiel', 12, '2027-01-18', '2027-01-22', 'Semaine 4 — 18-22 janv. 2027', 400, 20),
    ('la-rosiere', 'La Rosière', 'english', 'Anglais', 'in_person', 'Présentiel', 20, '2027-01-25', '2027-01-29', 'Semaine 5 — 25-29 janv. 2027', 560, 21),
    ('la-rosiere', 'La Rosière', 'spanish', 'Espagnol', 'in_person', 'Présentiel', 12, '2027-01-18', '2027-01-22', 'Semaine 4 — 18-22 janv. 2027', 400, 22),
    -- Les Menuires
    ('les-menuires', 'Les Menuires', 'english', 'Anglais', 'in_person', 'Présentiel', 15, '2027-02-01', '2027-02-05', 'Semaine 6 — 1-5 fév. 2027', 480, 30),
    ('les-menuires', 'Les Menuires', 'italian', 'Italien', 'in_person', 'Présentiel', 12, '2027-02-08', '2027-02-12', 'Semaine 7 — 8-12 fév. 2027', 400, 31),
    -- Morzine
    ('morzine', 'Morzine', 'english', 'Anglais', 'in_person', 'Présentiel', 12, '2027-02-15', '2027-02-19', 'Semaine 8 — 15-19 fév. 2027', 400, 40),
    ('morzine', 'Morzine', 'dutch', 'Néerlandais', 'in_person', 'Présentiel', 12, '2027-02-15', '2027-02-19', 'Semaine 8 — 15-19 fév. 2027', 400, 41),
    -- Valmorel
    ('valmorel', 'Valmorel', 'english', 'Anglais', 'in_person', 'Présentiel', 18, '2027-03-01', '2027-03-05', 'Semaine 9 — 1-5 mars 2027', 520, 50),
    -- Samoens
    ('samoens', 'Samoëns', 'english', 'Anglais', 'in_person', 'Présentiel', 12, '2027-03-08', '2027-03-12', 'Semaine 10 — 8-12 mars 2027', 400, 60),
    ('samoens', 'Samoëns', 'french', 'Français (FLE)', 'in_person', 'Présentiel', 12, '2027-03-08', '2027-03-12', 'Semaine 10 — 8-12 mars 2027', 400, 61),
    -- En ligne
    ('online', 'En ligne', 'english', 'Anglais', 'online_individual', 'En ligne (individuel)', 12, NULL, NULL, 'Dates flexibles — contact FLI', 380, 100),
    ('online', 'En ligne', 'english', 'Anglais', 'online_group', 'En ligne (groupe)', 20, NULL, NULL, 'Sessions mensuelles', 320, 101),
    ('online', 'En ligne', 'portuguese', 'Portugais', 'online_individual', 'En ligne (individuel)', 12, NULL, NULL, 'Dates flexibles — contact FLI', 380, 102),
    ('online', 'En ligne', 'german', 'Allemand', 'online_group', 'En ligne (groupe)', 20, NULL, NULL, 'Sessions mensuelles', 320, 103)
) AS v(
  location_key, location_label, language_key, language_label,
  modality_key, modality_label, duration_hours, start_date, end_date, date_label,
  base_price, sort_order
)
WHERE s.is_current = true;
