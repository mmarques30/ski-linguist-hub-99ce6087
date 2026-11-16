-- Paula 2026-11-16 : formation en binôme 15 h à Moûtiers
-- Fanou Monnier + Agathe Lumeau — niveau confirmé — Paula formatrice
-- Dates : 25, 26, 30 nov. et 1er déc. 2026 — 750 € chacune
-- Hors catalogue /register — dossiers + cohorte planning.

DO $$
DECLARE
  v_season_id uuid;
  v_instructor_id uuid := '4ac69771-2cfa-4500-be62-d4008fb1679a'; -- Paula Rangel-Halbwachs
  v_fanou_id uuid := '916ff76b-9897-4cee-b0bb-0f8bf4ba5b81';
  v_agathe_id uuid := 'e0305dc1-19ee-4c3c-baf3-952ea9590f73';
  v_session_id uuid;
  v_ins_fanou uuid;
  v_ins_agathe uuid;
  v_start date := '2026-11-25';
  v_end date := '2026-12-01';
  v_start_ts timestamptz;
  v_end_ts timestamptz;
  v_groupe text := 'BIN-MOUTIERS-2026-11';
BEGIN
  SELECT id INTO v_season_id FROM public.seasons WHERE is_current = true LIMIT 1;

  v_start_ts := (v_start::timestamp + time '09:00') AT TIME ZONE 'Europe/Paris';
  v_end_ts := (v_end::timestamp + time '17:00') AT TIME ZONE 'Europe/Paris';

  -- Corriger prénom/nom inversés (import historique) — aligné ski_monitors
  UPDATE public.students
  SET
    first_name = 'Fanou',
    last_name = 'Monnier',
    updated_at = now()
  WHERE id = v_fanou_id
    AND (first_name IS DISTINCT FROM 'Fanou' OR last_name IS DISTINCT FROM 'Monnier');

  UPDATE public.students
  SET
    first_name = 'Agathe',
    last_name = 'Lumeau',
    updated_at = now()
  WHERE id = v_agathe_id
    AND (first_name IS DISTINCT FROM 'Agathe' OR last_name IS DISTINCT FROM 'Lumeau');

  -- Idempotence : dossiers déjà créés pour ce binôme / dates ?
  SELECT i.id INTO v_ins_fanou
  FROM public.inscriptions i
  WHERE i.student_id = v_fanou_id
    AND i.start_date = v_start
    AND i.end_date = v_end
    AND i.course_location ILIKE '%Mo%tiers%'
    AND i.duration_hours = 15
    AND i.status NOT IN ('annulee')
  LIMIT 1;

  SELECT i.id INTO v_ins_agathe
  FROM public.inscriptions i
  WHERE i.student_id = v_agathe_id
    AND i.start_date = v_start
    AND i.end_date = v_end
    AND i.course_location ILIKE '%Mo%tiers%'
    AND i.duration_hours = 15
    AND i.status NOT IN ('annulee')
  LIMIT 1;

  IF v_ins_fanou IS NULL THEN
    INSERT INTO public.inscriptions (
      student_id,
      instructor_id,
      season_id,
      language,
      modality,
      course_type,
      course_location,
      start_date,
      end_date,
      duration_hours,
      duration_days,
      hours_per_day,
      schedule,
      rhythm,
      max_participants,
      group_name,
      groupe_code,
      entry_level,
      niveau_general_entree,
      price,
      pedagogical_cost,
      status,
      formateur,
      formateur_email,
      formateur_telephone,
      observations,
      group_size
    )
    VALUES (
      v_fanou_id,
      v_instructor_id,
      v_season_id,
      'Portugais brésilien',
      'presentiel',
      'En Binôme',
      'Moûtiers',
      v_start,
      v_end,
      15,
      4,
      3.75,
      '25, 26 et 30 novembre, 1er décembre 2026',
      'environ 3 h 45 / jour · 4 jours',
      '2 participants',
      'Confirmé',
      v_groupe,
      'B2',
      'Confirmé',
      750,
      750,
      'confirmee',
      'Paula RANGEL HALBWACHS',
      'info@fli.fr',
      '06 89 06 83 01',
      'Binôme Moûtiers 15 h avec Agathe Lumeau — Paula formatrice — hors catalogue',
      2
    )
    RETURNING id INTO v_ins_fanou;
  ELSE
    UPDATE public.inscriptions
    SET
      instructor_id = v_instructor_id,
      season_id = COALESCE(season_id, v_season_id),
      language = 'Portugais brésilien',
      modality = 'presentiel',
      course_type = 'En Binôme',
      course_location = 'Moûtiers',
      duration_hours = 15,
      duration_days = 4,
      hours_per_day = 3.75,
      schedule = '25, 26 et 30 novembre, 1er décembre 2026',
      rhythm = 'environ 3 h 45 / jour · 4 jours',
      max_participants = '2 participants',
      group_name = 'Confirmé',
      groupe_code = v_groupe,
      entry_level = COALESCE(entry_level, 'B2'),
      niveau_general_entree = 'Confirmé',
      price = 750,
      pedagogical_cost = 750,
      status = CASE WHEN status = 'annulee' THEN status ELSE 'confirmee' END,
      formateur = 'Paula RANGEL HALBWACHS',
      formateur_email = 'info@fli.fr',
      formateur_telephone = '06 89 06 83 01',
      observations = 'Binôme Moûtiers 15 h avec Agathe Lumeau — Paula formatrice — hors catalogue',
      group_size = 2,
      updated_at = now()
    WHERE id = v_ins_fanou;
  END IF;

  IF v_ins_agathe IS NULL THEN
    INSERT INTO public.inscriptions (
      student_id,
      instructor_id,
      season_id,
      language,
      modality,
      course_type,
      course_location,
      start_date,
      end_date,
      duration_hours,
      duration_days,
      hours_per_day,
      schedule,
      rhythm,
      max_participants,
      group_name,
      groupe_code,
      entry_level,
      niveau_general_entree,
      price,
      pedagogical_cost,
      status,
      formateur,
      formateur_email,
      formateur_telephone,
      observations,
      group_size
    )
    VALUES (
      v_agathe_id,
      v_instructor_id,
      v_season_id,
      'Portugais brésilien',
      'presentiel',
      'En Binôme',
      'Moûtiers',
      v_start,
      v_end,
      15,
      4,
      3.75,
      '25, 26 et 30 novembre, 1er décembre 2026',
      'environ 3 h 45 / jour · 4 jours',
      '2 participants',
      'Confirmé',
      v_groupe,
      NULL,
      'Confirmé',
      750,
      750,
      'confirmee',
      'Paula RANGEL HALBWACHS',
      'info@fli.fr',
      '06 89 06 83 01',
      'Binôme Moûtiers 15 h avec Fanou Monnier — Paula formatrice — hors catalogue',
      2
    )
    RETURNING id INTO v_ins_agathe;
  ELSE
    UPDATE public.inscriptions
    SET
      instructor_id = v_instructor_id,
      season_id = COALESCE(season_id, v_season_id),
      language = 'Portugais brésilien',
      modality = 'presentiel',
      course_type = 'En Binôme',
      course_location = 'Moûtiers',
      duration_hours = 15,
      duration_days = 4,
      hours_per_day = 3.75,
      schedule = '25, 26 et 30 novembre, 1er décembre 2026',
      rhythm = 'environ 3 h 45 / jour · 4 jours',
      max_participants = '2 participants',
      group_name = 'Confirmé',
      groupe_code = v_groupe,
      niveau_general_entree = 'Confirmé',
      price = 750,
      pedagogical_cost = 750,
      status = CASE WHEN status = 'annulee' THEN status ELSE 'confirmee' END,
      formateur = 'Paula RANGEL HALBWACHS',
      formateur_email = 'info@fli.fr',
      formateur_telephone = '06 89 06 83 01',
      observations = 'Binôme Moûtiers 15 h avec Fanou Monnier — Paula formatrice — hors catalogue',
      group_size = 2,
      updated_at = now()
    WHERE id = v_ins_agathe;
  END IF;

  -- Cohorte planning (hors catalogue)
  SELECT s.id INTO v_session_id
  FROM public.sessions s
  WHERE s.offering_id IS NULL
    AND s.location ILIKE '%Mo%tiers%'
    AND s.language = 'Portugais brésilien'
    AND s.start_datetime::date = v_start
    AND s.end_datetime::date = v_end
    AND s.notes ILIKE '%binôme%'
  LIMIT 1;

  IF v_session_id IS NULL THEN
    INSERT INTO public.sessions (
      title,
      season_id,
      instructor_id,
      language,
      level,
      modality,
      max_students,
      current_students,
      start_datetime,
      end_datetime,
      location,
      status,
      notes,
      offering_id
    )
    VALUES (
      'En binôme · Moûtiers · Portugais brésilien',
      v_season_id,
      v_instructor_id,
      'Portugais brésilien',
      'Confirmé',
      'groupe',
      2,
      0,
      v_start_ts,
      v_end_ts,
      'Moûtiers',
      'planifiee',
      'Binôme Fanou Monnier + Agathe Lumeau — 15 h — 25/26/30 nov. + 1er déc. 2026 — hors catalogue',
      NULL
    )
    RETURNING id INTO v_session_id;
  ELSE
    UPDATE public.sessions
    SET
      title = 'En binôme · Moûtiers · Portugais brésilien',
      instructor_id = v_instructor_id,
      season_id = COALESCE(season_id, v_season_id),
      level = 'Confirmé',
      modality = 'groupe',
      max_students = 2,
      status = 'planifiee',
      notes = 'Binôme Fanou Monnier + Agathe Lumeau — 15 h — 25/26/30 nov. + 1er déc. 2026 — hors catalogue',
      updated_at = now()
    WHERE id = v_session_id;
  END IF;

  INSERT INTO public.session_enrollments (session_id, inscription_id, student_id, attendance_status)
  SELECT v_session_id, v_ins_fanou, v_fanou_id, 'inscrit'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.session_enrollments e
    WHERE e.session_id = v_session_id AND e.student_id = v_fanou_id
  );

  INSERT INTO public.session_enrollments (session_id, inscription_id, student_id, attendance_status)
  SELECT v_session_id, v_ins_agathe, v_agathe_id, 'inscrit'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.session_enrollments e
    WHERE e.session_id = v_session_id AND e.student_id = v_agathe_id
  );

  PERFORM public.increment_session_students(v_session_id);

  INSERT INTO public.audit_log (action, table_name, new_values)
  VALUES (
    'moutiers_binome_fanou_agathe',
    'inscriptions',
    jsonb_build_object(
      'migration', '20261116164200_moutiers_binome_fanou_agathe',
      'session_id', v_session_id,
      'inscription_fanou_id', v_ins_fanou,
      'inscription_agathe_id', v_ins_agathe,
      'location', 'Moûtiers',
      'language', 'Portugais brésilien',
      'dates', '2026-11-25 / 26 / 30 + 2026-12-01',
      'duration_hours', 15,
      'price_eur_each', 750,
      'instructor', 'Paula Rangel-Halbwachs',
      'level', 'Confirmé',
      'groupe_code', v_groupe
    )
  );
END;
$$;
