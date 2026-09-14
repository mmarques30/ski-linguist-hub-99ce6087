-- C.5 — barème PDF : palier + libellés lus depuis cecrl_scale (modèles Word).

ALTER TABLE public.cecrl_scale
  ADD COLUMN IF NOT EXISTS niveau integer,
  ADD COLUMN IF NOT EXISTS description text;

UPDATE public.cecrl_scale SET
  niveau = floor(score)::integer,
  description = CASE floor(score)::integer
    WHEN 0 THEN 'Faux débutant / Quelques notions / Éveil'
    WHEN 1 THEN 'Élémentaire / Pré-intermédiaire / Survie'
    WHEN 2 THEN 'Intermédiaire / Autonomie'
    WHEN 3 THEN 'Post intermédiaire / Opérationnel'
    WHEN 4 THEN 'Perfectionnement / Fluidité / Aisance'
    WHEN 5 THEN 'Maîtrise'
  END
WHERE niveau IS NULL OR description IS NULL
   OR description IS DISTINCT FROM (
     CASE floor(score)::integer
       WHEN 0 THEN 'Faux débutant / Quelques notions / Éveil'
       WHEN 1 THEN 'Élémentaire / Pré-intermédiaire / Survie'
       WHEN 2 THEN 'Intermédiaire / Autonomie'
       WHEN 3 THEN 'Post intermédiaire / Opérationnel'
       WHEN 4 THEN 'Perfectionnement / Fluidité / Aisance'
       WHEN 5 THEN 'Maîtrise'
     END
   )
   OR niveau IS DISTINCT FROM floor(score)::integer;

ALTER TABLE public.cecrl_scale
  ALTER COLUMN niveau SET NOT NULL,
  ALTER COLUMN description SET NOT NULL;

COMMENT ON COLUMN public.cecrl_scale.niveau IS
  'Palier 0–5 (floor de la note). Lu par le PDF C.5.';
COMMENT ON COLUMN public.cecrl_scale.description IS
  'Libellés du barème extraits des modèles Word. Lus par le PDF C.5.';
