-- Paula 2026-11-13 : formation DSF Les 2 Alpes (11-13 nov.) absente du planning.
-- Hors catalogue /register (pas d'offering) — cohorte créée directement dans sessions
-- + session_enrollments pour les 12 stagiaires (hors fiche facturation « DSF Formation »).

DO $$
DECLARE
  v_session_id uuid;
  v_season_id uuid;
  v_instructor_id uuid := '0244c3a5-c85b-438e-9c1a-226d313fd7a9';
  v_start timestamptz;
  v_end timestamptz;
  v_enrolled int;
BEGIN
  SELECT id INTO v_season_id FROM public.seasons WHERE is_current = true LIMIT 1;

  v_start := ('2026-11-11'::date::timestamp + time '08:30') AT TIME ZONE 'Europe/Paris';
  v_end := ('2026-11-13'::date::timestamp + time '17:30') AT TIME ZONE 'Europe/Paris';

  -- Idempotent : une seule cohorte DSF 2 Alpes pour ces dates
  SELECT s.id INTO v_session_id
  FROM public.sessions s
  WHERE s.offering_id IS NULL
    AND s.location = 'Les 2 Alpes — Le Chalet des Glaciers'
    AND s.language = 'Anglais'
    AND s.start_datetime::date = '2026-11-11'
    AND s.end_datetime::date = '2026-11-13'
    AND s.notes ILIKE '%DSF%'
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
      'DSF · Les 2 Alpes · Anglais',
      v_season_id,
      v_instructor_id,
      'Anglais',
      'Tous niveaux',
      'groupe',
      16,
      0,
      v_start,
      v_end,
      'Les 2 Alpes — Le Chalet des Glaciers',
      'en_cours',
      'Formation DSF (Domaines Skiables de France) — groupe PS1-2ALPES — hors catalogue /register',
      NULL
    )
    RETURNING id INTO v_session_id;
  ELSE
    UPDATE public.sessions
    SET
      title = 'DSF · Les 2 Alpes · Anglais',
      instructor_id = COALESCE(instructor_id, v_instructor_id),
      season_id = COALESCE(season_id, v_season_id),
      status = 'en_cours',
      max_students = GREATEST(max_students, 16),
      notes = 'Formation DSF (Domaines Skiables de France) — groupe PS1-2ALPES — hors catalogue /register',
      updated_at = now()
    WHERE id = v_session_id;
  END IF;

  INSERT INTO public.session_enrollments (session_id, inscription_id, student_id, attendance_status)
  SELECT
    v_session_id,
    i.id,
    i.student_id,
    'inscrit'
  FROM public.inscriptions i
  JOIN public.students st ON st.id = i.student_id
  WHERE i.course_location ILIKE '%2 Alpes%'
    AND i.start_date = '2026-11-11'
    AND i.end_date = '2026-11-13'
    AND i.status IN ('confirmee', 'en_cours', 'en_attente')
    AND i.student_id IS NOT NULL
    AND NOT (st.first_name = 'DSF' AND st.last_name = 'Formation')
    AND NOT EXISTS (
      SELECT 1 FROM public.session_enrollments e
      WHERE e.session_id = v_session_id AND e.student_id = i.student_id
    );

  GET DIAGNOSTICS v_enrolled = ROW_COUNT;

  PERFORM public.increment_session_students(v_session_id);

  INSERT INTO public.audit_log (action, table_name, new_values)
  VALUES (
    'planning_dsf_2alpes_novembre',
    'sessions',
    jsonb_build_object(
      'migration', '20261113143000_planning_dsf_2alpes_novembre',
      'session_id', v_session_id,
      'enrollments_inserted', v_enrolled,
      'reason', 'Paula : formation DSF en cours invisible au planning'
    )
  );
END;
$$;
