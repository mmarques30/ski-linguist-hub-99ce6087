-- Point 10 — jeu ZZTEST pour la recette du cycle de vie (one-shot).
-- Convention ZZTEST + @example.invalid. Aucune identité réelle.
--
-- Reproduit à l'identique la situation où la recette de Paula s'est arrêtée,
-- sans toucher à FLI-260006 :
--   • une inscription « Brouillon », horaire validé, bilan Entrée/Sortie
--     complet, prête pour le pack de fin ;
--   • une inscription « Confirmée » dont le début est passé et l'horaire
--     jamais validé : elle doit réapparaître dans la liste J-10 en retard.
--
-- À supprimer ensuite : voir point10_zztest_cycle_vie_cleanup.sql.

DELETE FROM public.inscriptions
WHERE student_id IN (SELECT id FROM public.students WHERE email ILIKE 'zztest.p10.%@example.invalid');
DELETE FROM public.students WHERE email ILIKE 'zztest.p10.%@example.invalid';

DO $demo$
DECLARE
  stu_a uuid;
  stu_b uuid;
BEGIN
  INSERT INTO public.students (first_name, last_name, email, phone)
  VALUES ('ZZTEST', 'P10Cloture', 'zztest.p10.cloture@example.invalid', '0600000010')
  RETURNING id INTO stu_a;

  INSERT INTO public.students (first_name, last_name, email, phone)
  VALUES ('ZZTEST', 'P10Retard', 'zztest.p10.retard@example.invalid', '0600000011')
  RETURNING id INTO stu_b;

  -- 1. Prête pour le pack de fin, mais en « Brouillon » : c'est le cas qui
  --    échouait sur « Transition de statut non autorisée ».
  INSERT INTO public.inscriptions (
    student_id, language, start_date, end_date, duration_hours, price,
    status, schedule_status, schedule, schedule_approved_at,
    modality, course_location,
    niveau_general_entree, niveau_technique_entree, remarques_entree,
    entry_form_completed_at,
    niveau_general_sortie, niveau_technique_sortie, objectif_atteint,
    commentaire_sortie, exit_form_completed_at, hours_followed
  ) VALUES (
    stu_a, 'Anglais', current_date - 12, current_date - 5, 14, 900,
    'brouillon', 'matin', 'matin', now(),
    'presentiel', 'ZZTEST Station',
    'Piste bleue', 'Vocabulaire accueil', 'ZZTEST bilan d''entrée',
    now(),
    'B1', 'B1', 'oui',
    'ZZTEST commentaire de sortie : progression régulière sur les consignes de sécurité.',
    now(), 14
  );

  -- 2. Formation commencée sans horaire validé : retard J-10, toutes origines.
  INSERT INTO public.inscriptions (
    student_id, language, start_date, end_date, duration_hours, price,
    status, schedule_status, schedule, entry_level
  ) VALUES (
    stu_b, 'Italien', current_date - 21, current_date + 15, 20, 1200,
    'confirmee', 'pending', 'de 8h30 à 12h30', 'A2'
  );
END;
$demo$;

SELECT i.code, i.status, i.schedule_status, i.start_date, i.end_date,
       s.first_name || ' ' || s.last_name AS stagiaire
FROM public.inscriptions i
JOIN public.students s ON s.id = i.student_id
WHERE s.email ILIKE 'zztest.p10.%@example.invalid'
ORDER BY i.start_date;
