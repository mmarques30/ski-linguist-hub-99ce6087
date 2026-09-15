-- BL-029 — une inscription sans session datée n'hérite plus des dates de saison.
--
-- Toutes les offres actives du catalogue sont « Dates flexibles » (start_date
-- et end_date NULL dans registration_offerings) : `submit-registration`
-- retombait donc systématiquement sur la saison courante, et chaque inscription
-- en ligne naissait avec 01/12/2026 → 31/03/2027. Ces dates inventées
-- alimentaient ensuite la liste J-10 et le cron des rappels d'horaires.
--
-- Règle retenue : le stagiaire indique toujours une date de début souhaitée, et
-- `dates_to_confirm` distingue cette date d'une session ferme du catalogue.
-- start_date / end_date restent NOT NULL — les rendre nullables casserait les
-- déclencheurs de statut, la vue certificate_progression et une douzaine
-- d'affichages qui font `new Date(start_date)` sans garde.

ALTER TABLE public.inscriptions
  ADD COLUMN IF NOT EXISTS dates_to_confirm boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.inscriptions.dates_to_confirm IS
  'BL-029 : vrai quand start_date est seulement la date de début souhaitée par le stagiaire (offre « dates flexibles »). L''interface affiche « À planifier » au lieu d''une période ferme.';

-- Aucune reprise de données : au 15/09/2026 aucune inscription ne porte les
-- dates de la saison courante (les 878 lignes viennent de l'import historique,
-- qui apporte ses propres dates). Le correctif est donc préventif.
DO $$
DECLARE
  heritees integer;
BEGIN
  SELECT count(*) INTO heritees
  FROM public.inscriptions i
  JOIN public.seasons s ON s.id = i.season_id
  WHERE i.start_date = s.start_date
    AND i.end_date = s.end_date;

  IF heritees > 0 THEN
    UPDATE public.inscriptions i
    SET dates_to_confirm = true
    FROM public.seasons s
    WHERE s.id = i.season_id
      AND i.start_date = s.start_date
      AND i.end_date = s.end_date
      AND (i.observations ILIKE '%Dates flexibles%'
           OR i.observations ILIKE '%Projet personnalis%');

    RAISE NOTICE 'BL-029 : % inscription(s) portaient les dates de leur saison, marquées « à planifier » quand les observations le confirment', heritees;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Modèle de confirmation : une période ferme et une période à planifier ne
-- s'écrivent pas de la même façon. « du {{start_date}} au {{end_date}} » donne
-- « du 15/10/2026 au 15/10/2026 » sur une inscription à planifier. Le libellé
-- est désormais calculé par la fonction Edge et passé dans {{dates_label}}.
--
-- Seul body_fr est envoyé par submit-registration aujourd'hui ; les versions en
-- et pt reçoivent le même marqueur pour ne pas rester sur un texte faux le jour
-- où elles seront activées.
-- ---------------------------------------------------------------------------

UPDATE public.email_templates
SET
  body_fr = replace(body_fr, 'du {{start_date}} au {{end_date}}', '{{dates_label}}'),
  body_en = replace(body_en, 'from {{start_date}} to {{end_date}}', '{{dates_label}}'),
  body_pt = replace(body_pt, 'de {{start_date}} a {{end_date}}', '{{dates_label}}'),
  variables = (
    SELECT jsonb_agg(DISTINCT v)
    FROM jsonb_array_elements_text(variables || '["dates_label"]'::jsonb) AS v
  )
WHERE slug = 'inscription_confirmation';

UPDATE public.email_templates
SET body_en = replace(body_en, '({{start_date}} to {{end_date}})', '({{dates_label}})')
WHERE slug = 'inscription_confirmation';

UPDATE public.email_template_drafts
SET
  body_fr = replace(body_fr, 'du {{start_date}} au {{end_date}}', '{{dates_label}}'),
  body_en = replace(body_en, 'from {{start_date}} to {{end_date}}', '{{dates_label}}'),
  body_pt = replace(body_pt, 'de {{start_date}} a {{end_date}}', '{{dates_label}}'),
  variables = (
    SELECT jsonb_agg(DISTINCT v)
    FROM jsonb_array_elements_text(variables || '["dates_label"]'::jsonb) AS v
  )
WHERE slug = 'inscription_confirmation';

DO $$
DECLARE
  restants integer;
  sans_variable integer;
BEGIN
  SELECT count(*) INTO restants
  FROM (
    SELECT body_fr, body_en, body_pt FROM public.email_templates WHERE slug = 'inscription_confirmation'
    UNION ALL
    SELECT body_fr, body_en, body_pt FROM public.email_template_drafts WHERE slug = 'inscription_confirmation'
  ) t
  WHERE body_fr LIKE '%{{end_date}}%'
     OR body_en LIKE '%{{end_date}}%'
     OR body_pt LIKE '%{{end_date}}%';

  IF restants > 0 THEN
    RAISE EXCEPTION 'BL-029 : % version(s) de la confirmation citent encore {{end_date}} au lieu de {{dates_label}}', restants;
  END IF;

  SELECT count(*) INTO sans_variable
  FROM (
    SELECT variables FROM public.email_templates WHERE slug = 'inscription_confirmation'
    UNION ALL
    SELECT variables FROM public.email_template_drafts WHERE slug = 'inscription_confirmation'
  ) t
  WHERE NOT (variables ? 'dates_label');

  IF sans_variable > 0 THEN
    RAISE EXCEPTION 'BL-029 : % version(s) de la confirmation ne déclarent pas dates_label', sans_variable;
  END IF;
END $$;
