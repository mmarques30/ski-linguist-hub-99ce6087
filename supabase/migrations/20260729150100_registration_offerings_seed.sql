-- Données initiales du catalogue inscription (grille tarifaire FLI)
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
    -- Présentiel collectif : 20h (1 semaine) = 750 € | 40h (2 semaines) = 1 500 €
    ('courchevel', 'Courchevel', 'english', 'Anglais', 'in_person', 'Présentiel (collectif)', 20, '2026-12-07', '2026-12-11', 'Semaine 1 — 7-11 déc. 2026 (20h)', 750, 10),
    ('courchevel', 'Courchevel', 'portuguese', 'Portugais', 'in_person', 'Présentiel (collectif)', 20, '2026-12-07', '2026-12-11', 'Semaine 1 — 7-11 déc. 2026 (20h)', 750, 11),
    ('courchevel', 'Courchevel', 'english', 'Anglais', 'in_person', 'Présentiel (collectif)', 20, '2026-12-14', '2026-12-18', 'Semaine 2 — 14-18 déc. 2026 (20h)', 750, 12),
    ('courchevel', 'Courchevel', 'english', 'Anglais', 'in_person', 'Présentiel (collectif)', 40, '2026-12-07', '2026-12-18', '2 semaines — 7-18 déc. 2026 (40h)', 1500, 13),
    ('courchevel', 'Courchevel', 'german', 'Allemand', 'in_person', 'Présentiel (collectif)', 20, '2027-01-11', '2027-01-15', 'Semaine 3 — 11-15 janv. 2027 (20h)', 750, 14),
    ('la-rosiere', 'La Rosière', 'english', 'Anglais', 'in_person', 'Présentiel (collectif)', 20, '2027-01-18', '2027-01-22', 'Semaine 4 — 18-22 janv. 2027 (20h)', 750, 20),
    ('la-rosiere', 'La Rosière', 'spanish', 'Espagnol', 'in_person', 'Présentiel (collectif)', 20, '2027-01-18', '2027-01-22', 'Semaine 4 — 18-22 janv. 2027 (20h)', 750, 21),
    ('la-rosiere', 'La Rosière', 'english', 'Anglais', 'in_person', 'Présentiel (collectif)', 20, '2027-01-25', '2027-01-29', 'Semaine 5 — 25-29 janv. 2027 (20h)', 750, 22),
    ('la-rosiere', 'La Rosière', 'english', 'Anglais', 'in_person', 'Présentiel (collectif)', 40, '2027-01-18', '2027-01-29', '2 semaines — 18-29 janv. 2027 (40h)', 1500, 23),
    ('les-menuires', 'Les Menuires', 'english', 'Anglais', 'in_person', 'Présentiel (collectif)', 20, '2027-02-01', '2027-02-05', 'Semaine 6 — 1-5 fév. 2027 (20h)', 750, 30),
    ('les-menuires', 'Les Menuires', 'italian', 'Italien', 'in_person', 'Présentiel (collectif)', 20, '2027-02-08', '2027-02-12', 'Semaine 7 — 8-12 fév. 2027 (20h)', 750, 31),
    ('morzine', 'Morzine', 'english', 'Anglais', 'in_person', 'Présentiel (collectif)', 20, '2027-02-15', '2027-02-19', 'Semaine 8 — 15-19 fév. 2027 (20h)', 750, 40),
    ('morzine', 'Morzine', 'dutch', 'Néerlandais', 'in_person', 'Présentiel (collectif)', 20, '2027-02-15', '2027-02-19', 'Semaine 8 — 15-19 fév. 2027 (20h)', 750, 41),
    ('valmorel', 'Valmorel', 'english', 'Anglais', 'in_person', 'Présentiel (collectif)', 20, '2027-03-01', '2027-03-05', 'Semaine 9 — 1-5 mars 2027 (20h)', 750, 50),
    ('samoens', 'Samoëns', 'english', 'Anglais', 'in_person', 'Présentiel (collectif)', 20, '2027-03-08', '2027-03-12', 'Semaine 10 — 8-12 mars 2027 (20h)', 750, 60),
    ('samoens', 'Samoëns', 'french', 'Français (FLE)', 'in_person', 'Présentiel (collectif)', 20, '2027-03-08', '2027-03-12', 'Semaine 10 — 8-12 mars 2027 (20h)', 750, 61),

    -- En ligne individuel : 6h=300€ | 12h=600€ | 15h=750€ | 18h=900€ — autres formats sur demande
    ('online', 'En ligne', 'english', 'Anglais', 'online_individual', 'En ligne (individuel)', 6, NULL, NULL, 'Dates flexibles — autres formats sur demande', 300, 100),
    ('online', 'En ligne', 'english', 'Anglais', 'online_individual', 'En ligne (individuel)', 12, NULL, NULL, 'Dates flexibles — autres formats sur demande', 600, 101),
    ('online', 'En ligne', 'english', 'Anglais', 'online_individual', 'En ligne (individuel)', 15, NULL, NULL, 'Dates flexibles — autres formats sur demande', 750, 102),
    ('online', 'En ligne', 'english', 'Anglais', 'online_individual', 'En ligne (individuel)', 18, NULL, NULL, 'Dates flexibles — autres formats sur demande', 900, 103),
    ('online', 'En ligne', 'portuguese', 'Portugais', 'online_individual', 'En ligne (individuel)', 6, NULL, NULL, 'Dates flexibles — autres formats sur demande', 300, 110),
    ('online', 'En ligne', 'portuguese', 'Portugais', 'online_individual', 'En ligne (individuel)', 12, NULL, NULL, 'Dates flexibles — autres formats sur demande', 600, 111),
    ('online', 'En ligne', 'portuguese', 'Portugais', 'online_individual', 'En ligne (individuel)', 15, NULL, NULL, 'Dates flexibles — autres formats sur demande', 750, 112),
    ('online', 'En ligne', 'portuguese', 'Portugais', 'online_individual', 'En ligne (individuel)', 18, NULL, NULL, 'Dates flexibles — autres formats sur demande', 900, 113),
    ('online', 'En ligne', 'russian', 'Russe', 'online_individual', 'En ligne (individuel)', 6, NULL, NULL, 'Dates flexibles — autres formats sur demande', 300, 120),
    ('online', 'En ligne', 'russian', 'Russe', 'online_individual', 'En ligne (individuel)', 12, NULL, NULL, 'Dates flexibles — autres formats sur demande', 600, 121),
    ('online', 'En ligne', 'russian', 'Russe', 'online_individual', 'En ligne (individuel)', 15, NULL, NULL, 'Dates flexibles — autres formats sur demande', 750, 122),
    ('online', 'En ligne', 'russian', 'Russe', 'online_individual', 'En ligne (individuel)', 18, NULL, NULL, 'Dates flexibles — autres formats sur demande', 900, 123),
    ('online', 'En ligne', 'dutch', 'Néerlandais', 'online_individual', 'En ligne (individuel)', 6, NULL, NULL, 'Dates flexibles — autres formats sur demande', 300, 130),
    ('online', 'En ligne', 'dutch', 'Néerlandais', 'online_individual', 'En ligne (individuel)', 12, NULL, NULL, 'Dates flexibles — autres formats sur demande', 600, 131),
    ('online', 'En ligne', 'dutch', 'Néerlandais', 'online_individual', 'En ligne (individuel)', 15, NULL, NULL, 'Dates flexibles — autres formats sur demande', 750, 132),
    ('online', 'En ligne', 'dutch', 'Néerlandais', 'online_individual', 'En ligne (individuel)', 18, NULL, NULL, 'Dates flexibles — autres formats sur demande', 900, 133),
    ('online', 'En ligne', 'german', 'Allemand', 'online_individual', 'En ligne (individuel)', 6, NULL, NULL, 'Dates flexibles — autres formats sur demande', 300, 140),
    ('online', 'En ligne', 'german', 'Allemand', 'online_individual', 'En ligne (individuel)', 12, NULL, NULL, 'Dates flexibles — autres formats sur demande', 600, 141),
    ('online', 'En ligne', 'german', 'Allemand', 'online_individual', 'En ligne (individuel)', 15, NULL, NULL, 'Dates flexibles — autres formats sur demande', 750, 142),
    ('online', 'En ligne', 'german', 'Allemand', 'online_individual', 'En ligne (individuel)', 18, NULL, NULL, 'Dates flexibles — autres formats sur demande', 900, 143),
    ('online', 'En ligne', 'spanish', 'Espagnol', 'online_individual', 'En ligne (individuel)', 6, NULL, NULL, 'Dates flexibles — autres formats sur demande', 300, 150),
    ('online', 'En ligne', 'spanish', 'Espagnol', 'online_individual', 'En ligne (individuel)', 12, NULL, NULL, 'Dates flexibles — autres formats sur demande', 600, 151),
    ('online', 'En ligne', 'spanish', 'Espagnol', 'online_individual', 'En ligne (individuel)', 15, NULL, NULL, 'Dates flexibles — autres formats sur demande', 750, 152),
    ('online', 'En ligne', 'spanish', 'Espagnol', 'online_individual', 'En ligne (individuel)', 18, NULL, NULL, 'Dates flexibles — autres formats sur demande', 900, 153),
    ('online', 'En ligne', 'italian', 'Italien', 'online_individual', 'En ligne (individuel)', 6, NULL, NULL, 'Dates flexibles — autres formats sur demande', 300, 160),
    ('online', 'En ligne', 'italian', 'Italien', 'online_individual', 'En ligne (individuel)', 12, NULL, NULL, 'Dates flexibles — autres formats sur demande', 600, 161),
    ('online', 'En ligne', 'italian', 'Italien', 'online_individual', 'En ligne (individuel)', 15, NULL, NULL, 'Dates flexibles — autres formats sur demande', 750, 162),
    ('online', 'En ligne', 'italian', 'Italien', 'online_individual', 'En ligne (individuel)', 18, NULL, NULL, 'Dates flexibles — autres formats sur demande', 900, 163),
    ('online', 'En ligne', 'chinese', 'Chinois', 'online_individual', 'En ligne (individuel)', 6, NULL, NULL, 'Dates flexibles — autres formats sur demande', 300, 170),
    ('online', 'En ligne', 'chinese', 'Chinois', 'online_individual', 'En ligne (individuel)', 12, NULL, NULL, 'Dates flexibles — autres formats sur demande', 600, 171),
    ('online', 'En ligne', 'chinese', 'Chinois', 'online_individual', 'En ligne (individuel)', 15, NULL, NULL, 'Dates flexibles — autres formats sur demande', 750, 172),
    ('online', 'En ligne', 'chinese', 'Chinois', 'online_individual', 'En ligne (individuel)', 18, NULL, NULL, 'Dates flexibles — autres formats sur demande', 900, 173),
    ('online', 'En ligne', 'french', 'Français (FLE)', 'online_individual', 'En ligne (individuel)', 6, NULL, NULL, 'Dates flexibles — autres formats sur demande', 300, 180),
    ('online', 'En ligne', 'french', 'Français (FLE)', 'online_individual', 'En ligne (individuel)', 12, NULL, NULL, 'Dates flexibles — autres formats sur demande', 600, 181),
    ('online', 'En ligne', 'french', 'Français (FLE)', 'online_individual', 'En ligne (individuel)', 15, NULL, NULL, 'Dates flexibles — autres formats sur demande', 750, 182),
    ('online', 'En ligne', 'french', 'Français (FLE)', 'online_individual', 'En ligne (individuel)', 18, NULL, NULL, 'Dates flexibles — autres formats sur demande', 900, 183)
) AS v(
  location_key, location_label, language_key, language_label,
  modality_key, modality_label, duration_hours, start_date, end_date, date_label,
  base_price, sort_order
)
WHERE s.is_current = true;
