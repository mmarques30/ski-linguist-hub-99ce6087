-- Formation interne FLI — 23/10/2026 (vendredi)
-- Objectif : tester l’émargement numérique avec Paula comme formatrice
-- et les formateurs actifs comme « stagiaires » (signature par e-mail).
--
-- Modules prévus :
--   09h30–12h30  Les outils numériques dans la formation
--   14h00–16h30  Réunion d’équipe (bilan, nouveautés, Qualiopi, niveaux)
--
-- Les créneaux techniques FLI restent matin 8h30–12h30 / AP 13h30–17h30
-- (libellés + fenêtre de signature). L’agenda oral peut différer d’1 h.
--
-- Avant exécution dans le SQL Editor Supabase :
--   SELECT set_config('fi.instructor_email', 'paula@…', false);
--   -- optionnel : restreindre la liste (sinon tous les instructors is_active)
--   -- SELECT set_config('fi.only_emails', 'a@x.fr,b@y.fr', false);
--
-- Idempotent sur le marqueur expectations = 'FORMATION_INTERNE_FLI_2026-10-23'.
-- Aucun e-mail n’est envoyé par ce script.

DO $fi$
DECLARE
  v_instructor_email text := lower(trim(coalesce(current_setting('fi.instructor_email', true), '')));
  v_only_emails text := coalesce(current_setting('fi.only_emails', true), '');
  v_instructor_id uuid;
  v_slot_date date := date '2026-10-23';
  v_marker text := 'FORMATION_INTERNE_FLI_2026-10-23';
  v_lang text := 'Formation interne';
  v_lieu text := 'FLI';
  v_group_key text;
  r record;
  i int := 0;
  v_student_id uuid;
  v_inscription_id uuid;
  v_schedule text;
  v_slot_matin uuid;
  v_slot_ap uuid;
  v_token_matin text;
  v_token_ap text;
BEGIN
  IF v_instructor_email = '' THEN
    RAISE EXCEPTION
      'Définir fi.instructor_email via set_config (e-mail de la fiche instructors de Paula)';
  END IF;

  SELECT id INTO v_instructor_id
  FROM public.instructors
  WHERE lower(trim(email)) = v_instructor_email
  LIMIT 1;

  IF v_instructor_id IS NULL THEN
    RAISE EXCEPTION 'Aucun instructor avec email %', v_instructor_email;
  END IF;

  -- Nettoyage du jeu précédent (même marqueur)
  DELETE FROM public.attendance_records
  WHERE inscription_id IN (
    SELECT id FROM public.inscriptions WHERE expectations = v_marker
  );
  DELETE FROM public.attendance_slots
  WHERE instructor_id = v_instructor_id
    AND slot_date = v_slot_date
    AND (
      title ILIKE '%outils numériques%'
      OR title ILIKE '%réunion d%équipe%'
      OR group_key LIKE (lower(v_lang) || '|' || lower(v_lieu) || '%')
    );

  DELETE FROM public.inscriptions WHERE expectations = v_marker;

  -- Ne pas supprimer des students « réels » hors marqueur : on réutilise
  -- les lignes students existantes si l’e-mail matche un formateur.

  v_group_key := lower(v_lang) || '|' || lower(v_lieu) || '|' || v_slot_date::text || '|ensemble|ensemble';

  FOR r IN
    SELECT
      i.id AS instructor_row_id,
      i.first_name,
      i.last_name,
      lower(trim(i.email)) AS email,
      i.phone
    FROM public.instructors i
    WHERE i.is_active IS DISTINCT FROM false
      AND i.email IS NOT NULL
      AND trim(i.email) <> ''
      AND lower(trim(i.email)) <> v_instructor_email
      AND (
        v_only_emails = ''
        OR lower(trim(i.email)) = ANY (
          SELECT lower(trim(x))
          FROM unnest(string_to_array(v_only_emails, ',')) AS x
          WHERE trim(x) <> ''
        )
      )
    ORDER BY i.last_name NULLS LAST, i.first_name NULLS LAST
  LOOP
    i := i + 1;
    -- Alternance matin / AP pour activer l’option « tous ensemble » du vendredi
    v_schedule := CASE WHEN i % 2 = 1 THEN 'de 8h30 à 12h30' ELSE 'de 13h30 à 17h30' END;

    SELECT s.id INTO v_student_id
    FROM public.students s
    WHERE lower(trim(s.email)) = r.email
    LIMIT 1;

    IF v_student_id IS NULL THEN
      INSERT INTO public.students (first_name, last_name, email, phone, company)
      VALUES (
        coalesce(nullif(trim(r.first_name), ''), 'Formateur'),
        coalesce(nullif(trim(r.last_name), ''), 'FLI'),
        r.email,
        r.phone,
        'Formation interne FLI'
      )
      RETURNING id INTO v_student_id;
    ELSE
      UPDATE public.students
      SET company = coalesce(company, 'Formation interne FLI')
      WHERE id = v_student_id;
    END IF;

    INSERT INTO public.inscriptions (
      student_id,
      instructor_id,
      language,
      start_date,
      end_date,
      duration_hours,
      modality,
      course_location,
      schedule,
      schedule_status,
      status,
      expectations,
      formateur,
      formateur_email
    ) VALUES (
      v_student_id,
      v_instructor_id,
      v_lang,
      v_slot_date,
      v_slot_date,
      6,
      'presentiel',
      v_lieu,
      v_schedule,
      CASE WHEN i % 2 = 1 THEN 'matin' ELSE 'apres-midi' END,
      'confirmee',
      v_marker,
      (SELECT trim(first_name || ' ' || last_name) FROM public.instructors WHERE id = v_instructor_id),
      v_instructor_email
    )
    RETURNING id INTO v_inscription_id;
  END LOOP;

  IF i < 2 THEN
    RAISE EXCEPTION 'Moins de 2 formateurs inscrits (%) — élargis fi.only_emails ou active des instructors', i;
  END IF;

  -- Créneau matin (signature ouverte jusqu’à ends_at + 2 h)
  INSERT INTO public.attendance_slots (
    instructor_id, group_key, title, slot_date, day_part,
    starts_at, ends_at, status, opened_at, sign_token_expires_at
  ) VALUES (
    v_instructor_id,
    v_group_key,
    'Les outils numériques dans la formation',
    v_slot_date,
    'matin',
    timestamptz '2026-10-23 09:30:00+02',
    timestamptz '2026-10-23 12:30:00+02',
    'open',
    now(),
    timestamptz '2026-10-23 14:30:00+02'
  )
  RETURNING id, sign_token INTO v_slot_matin, v_token_matin;

  INSERT INTO public.attendance_records (slot_id, student_id, inscription_id, status)
  SELECT v_slot_matin, ins.student_id, ins.id, 'pending'
  FROM public.inscriptions ins
  WHERE ins.expectations = v_marker
    AND ins.instructor_id = v_instructor_id;

  -- Créneau après-midi
  INSERT INTO public.attendance_slots (
    instructor_id, group_key, title, slot_date, day_part,
    starts_at, ends_at, status, opened_at, sign_token_expires_at
  ) VALUES (
    v_instructor_id,
    v_group_key,
    'Réunion d’équipe — bilan, nouveautés FLI, Qualiopi, niveaux',
    v_slot_date,
    'apres-midi',
    timestamptz '2026-10-23 14:00:00+02',
    timestamptz '2026-10-23 16:30:00+02',
    'open',
    now(),
    timestamptz '2026-10-23 18:30:00+02'
  )
  RETURNING id, sign_token INTO v_slot_ap, v_token_ap;

  INSERT INTO public.attendance_records (slot_id, student_id, inscription_id, status)
  SELECT v_slot_ap, ins.student_id, ins.id, 'pending'
  FROM public.inscriptions ins
  WHERE ins.expectations = v_marker
    AND ins.instructor_id = v_instructor_id;

  RAISE NOTICE 'OK — % formateurs inscrits sous instructor %', i, v_instructor_email;
  RAISE NOTICE 'Matin   : https://plateforme.fli.fr/emarger/%', v_token_matin;
  RAISE NOTICE 'Après-midi : https://plateforme.fli.fr/emarger/%', v_token_ap;
END;
$fi$;

-- Liens à partager (QR / écran / WhatsApp — aucun mail auto)
SELECT
  s.day_part,
  s.title,
  s.starts_at AT TIME ZONE 'Europe/Paris' AS debut_paris,
  s.ends_at AT TIME ZONE 'Europe/Paris' AS fin_paris,
  'https://plateforme.fli.fr/emarger/' || s.sign_token AS lien_emarger,
  (
    SELECT count(*) FROM public.attendance_records r WHERE r.slot_id = s.id
  ) AS nb_stagiaires
FROM public.attendance_slots s
JOIN public.instructors i ON i.id = s.instructor_id
WHERE s.slot_date = date '2026-10-23'
  AND lower(trim(i.email)) = lower(trim(coalesce(current_setting('fi.instructor_email', true), '')))
ORDER BY s.starts_at;
