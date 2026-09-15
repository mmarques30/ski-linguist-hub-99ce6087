-- BL-028 — le groupe matin / après-midi ne concerne que les collectifs en station.
--
-- Recette du 11 → 15/09 : le message d'attribution du groupe s'affichait quelle
-- que soit la modalité (y compris pour un cours en ligne individuel, qui n'a pas
-- de groupe) et nommait la directrice par son prénom.
--
-- Côté interface, `registration-group-notice.ts` conditionne le message à la
-- modalité et le signe « l'équipe FLI ». Côté email, le modèle
-- `inscription_confirmation` n'a pas de condition de modalité : on retire donc
-- la promesse d'horaires matin / après-midi de son corps, sans rien promettre
-- d'autre. Le message est écrit pour toutes les modalités.
--
-- Le `replace` cible la phrase exacte du modèle du point 8 ; si le modèle
-- déployé ne la contient pas, la mise à jour est sans effet (idempotent).

UPDATE public.email_templates
SET body_fr = replace(
      body_fr,
      'Nous reviendrons vers vous pour la suite du parcours : horaires du matin ou de l''après-midi, formateur·rice, puis accès à votre espace stagiaire.',
      'Nous reviendrons vers vous pour la suite du parcours : horaires, formateur·rice, puis accès à votre espace stagiaire.'
    )
WHERE slug = 'inscription_confirmation'
  AND body_fr LIKE '%horaires du matin ou de l''après-midi%';

-- Vérification : plus aucun modèle d'email stagiaire ne promet un groupe
-- matin / après-midi sans connaître la modalité.
DO $$
DECLARE
  restants integer;
BEGIN
  SELECT count(*) INTO restants
  FROM public.email_templates
  WHERE slug IN ('inscription_confirmation', 'inscription_ski_monitor_welcome')
    AND body_fr ILIKE '%matin%';

  IF restants > 0 THEN
    RAISE EXCEPTION 'BL-028 : % modèle(s) stagiaire mentionnent encore le groupe matin / après-midi', restants;
  END IF;
END $$;

-- DOWN (ne pas exécuter sans validation Paula) :
-- UPDATE public.email_templates
-- SET body_fr = replace(
--       body_fr,
--       'Nous reviendrons vers vous pour la suite du parcours : horaires, formateur·rice, puis accès à votre espace stagiaire.',
--       'Nous reviendrons vers vous pour la suite du parcours : horaires du matin ou de l''après-midi, formateur·rice, puis accès à votre espace stagiaire.'
--     )
-- WHERE slug = 'inscription_confirmation';
