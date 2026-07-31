-- Données initiales du catalogue inscription (grille tarifaire FLI)
-- IMPORTANT : pas de sessions présentiel fictives — uniquement en ligne.
-- Les sessions en station s'ajoutent via admin quand le calendrier est confirmé.

INSERT INTO public.seasons (name, slug, start_date, end_date, status, is_current)
SELECT 'Saison 2026-2027', '2026-2027', '2026-12-01'::date, '2027-03-31'::date, 'en_cours', true
WHERE NOT EXISTS (SELECT 1 FROM public.seasons WHERE is_current = true);

-- Désactive d'éventuelles offres présentiel héritées
UPDATE public.registration_offerings
SET is_active = false, updated_at = now()
WHERE modality_key = 'in_person';

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
    -- En ligne individuel : 6h=300€ | 12h=600€ | 15h=750€ | 18h=900€
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
WHERE s.is_current = true
  AND NOT EXISTS (
    SELECT 1 FROM public.registration_offerings ro
    WHERE ro.location_key = v.location_key
      AND ro.language_key = v.language_key
      AND ro.duration_hours = v.duration_hours
      AND ro.modality_key = v.modality_key
      AND ro.is_active = true
  );
