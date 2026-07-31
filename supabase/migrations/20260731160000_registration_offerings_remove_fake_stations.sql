-- Remove sessões présentiel inventadas (estações/datas fictícias)
-- O catálogo publico fica apenas com les offres en ligne jusqu'à publication du calendrier station.

UPDATE public.registration_offerings
SET is_active = false, updated_at = now()
WHERE modality_key = 'in_person';

COMMENT ON TABLE public.registration_offerings IS
  'Offres /register. Présentiel : ajouter via admin quand les sessions sont confirmées.';
