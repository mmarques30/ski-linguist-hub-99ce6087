-- C3 Planning unifié : lier sessions calendrier ↔ catalogue registration_offerings
-- et inscriptions. Une offre datée = une cohorte (sessions), les inscrits via
-- session_enrollments.

-- 0) Colonne catalogue formateur (migration repo 20261103184000 parfois absente en prod)
ALTER TABLE public.registration_offerings
  ADD COLUMN IF NOT EXISTS instructor_id uuid REFERENCES public.instructors(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_registration_offerings_instructor_id
  ON public.registration_offerings (instructor_id)
  WHERE instructor_id IS NOT NULL;

-- 1) FK catalogue sur le planning (UNIQUE : plusieurs NULL autorisés en Postgres)
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS offering_id uuid REFERENCES public.registration_offerings(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sessions_offering_id_key'
  ) THEN
    ALTER TABLE public.sessions
      ADD CONSTRAINT sessions_offering_id_key UNIQUE (offering_id);
  END IF;
END;
$$;

COMMENT ON COLUMN public.sessions.offering_id IS
  'Session catalogue (/register) matérialisée sur le planning — 1 offre → 1 cohorte';

-- 2) FK catalogue sur les inscriptions
ALTER TABLE public.inscriptions
  ADD COLUMN IF NOT EXISTS offering_id uuid REFERENCES public.registration_offerings(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_inscriptions_offering_id
  ON public.inscriptions (offering_id)
  WHERE offering_id IS NOT NULL;

COMMENT ON COLUMN public.inscriptions.offering_id IS
  'Offre catalogue choisie à l''inscription (remplace la ligne « Offre catalogue: uuid » dans observations)';

-- 3) Backfill offering_id depuis observations
UPDATE public.inscriptions i
SET offering_id = m.offering_id,
    updated_at = now()
FROM (
  SELECT
    i2.id AS inscription_id,
    (regexp_match(i2.observations, 'Offre catalogue:\s*([0-9a-fA-F-]{36})'))[1]::uuid AS offering_id
  FROM public.inscriptions i2
  WHERE i2.offering_id IS NULL
    AND i2.observations ~* 'Offre catalogue:\s*[0-9a-fA-F-]{36}'
) AS m
WHERE i.id = m.inscription_id
  AND m.offering_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.registration_offerings ro WHERE ro.id = m.offering_id
  );

-- 4) Compteur d'inscrits (RPC attendue par useSessions) + trigger
CREATE OR REPLACE FUNCTION public.increment_session_students(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.sessions s
  SET current_students = (
        SELECT count(*)::int
        FROM public.session_enrollments e
        WHERE e.session_id = p_session_id
      ),
      updated_at = now()
  WHERE s.id = p_session_id;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_session_students(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_session_students(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_session_students(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.refresh_session_student_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sid uuid;
BEGIN
  sid := COALESCE(NEW.session_id, OLD.session_id);
  IF sid IS NOT NULL THEN
    PERFORM public.increment_session_students(sid);
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.session_id IS DISTINCT FROM NEW.session_id AND OLD.session_id IS NOT NULL THEN
    PERFORM public.increment_session_students(OLD.session_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_session_enrollments_recount ON public.session_enrollments;
CREATE TRIGGER trg_session_enrollments_recount
  AFTER INSERT OR UPDATE OR DELETE ON public.session_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.refresh_session_student_count();

-- 5) Helpers capacités / modalité / statut
CREATE OR REPLACE FUNCTION public.planning_max_students_for_offering(
  p_session_code text,
  p_modality_key text
)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_modality_key = 'online_individual' THEN 1
    WHEN p_modality_key = 'online_group' THEN 8
    WHEN upper(coalesce(p_session_code, '')) = 'S05' THEN 24
    WHEN upper(coalesce(p_session_code, '')) = 'S06' THEN 24
    WHEN upper(coalesce(p_session_code, '')) = 'S14' THEN 12
    WHEN upper(coalesce(p_session_code, '')) = 'S10' THEN 16
    ELSE 16
  END;
$$;

CREATE OR REPLACE FUNCTION public.planning_modality_for_offering(p_modality_key text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_modality_key = 'online_individual' THEN 'individuel'
    ELSE 'groupe'
  END;
$$;

CREATE OR REPLACE FUNCTION public.planning_status_for_offering(
  p_is_active boolean,
  p_start_date date,
  p_end_date date
)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN coalesce(p_is_active, false) = false THEN 'annulee'
    WHEN p_end_date IS NOT NULL AND p_end_date < CURRENT_DATE THEN 'terminee'
    WHEN p_start_date IS NOT NULL AND p_start_date <= CURRENT_DATE
         AND p_end_date IS NOT NULL AND p_end_date >= CURRENT_DATE THEN 'en_cours'
    ELSE 'planifiee'
  END;
$$;

-- 6) Sync idempotent (staff / admin)
CREATE OR REPLACE FUNCTION public.sync_planning_sessions_from_offerings()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  upserted int := 0;
  linked_by_fk int := 0;
  linked_heuristic int := 0;
  skipped int := 0;
  batch int;
  rec record;
  sid uuid;
  start_ts timestamptz;
  end_ts timestamptz;
  title text;
BEGIN
  IF NOT (public.is_admin() OR public.is_staff()) THEN
    RAISE EXCEPTION 'sync_planning_sessions_from_offerings: staff only';
  END IF;

  FOR rec IN
    SELECT
      ro.id,
      ro.session_code,
      ro.season_id,
      ro.instructor_id,
      ro.language_label,
      ro.modality_key,
      ro.location_label,
      ro.start_date,
      ro.end_date,
      ro.is_active,
      ro.instructor_label
    FROM public.registration_offerings ro
    WHERE ro.start_date IS NOT NULL
      AND ro.end_date IS NOT NULL
      AND ro.modality_key IS DISTINCT FROM 'online_individual'
  LOOP
    start_ts := (rec.start_date::timestamp + time '08:30') AT TIME ZONE 'Europe/Paris';
    end_ts := (rec.end_date::timestamp + time '17:30') AT TIME ZONE 'Europe/Paris';
    title := trim(both ' · ' from concat_ws(
      ' · ',
      nullif(rec.session_code, ''),
      rec.location_label,
      rec.language_label
    ));

    INSERT INTO public.sessions AS s (
      title, season_id, instructor_id, language, level, modality,
      max_students, current_students, start_datetime, end_datetime,
      location, status, notes, offering_id
    )
    VALUES (
      title,
      rec.season_id,
      rec.instructor_id,
      rec.language_label,
      'Tous niveaux',
      public.planning_modality_for_offering(rec.modality_key),
      public.planning_max_students_for_offering(rec.session_code, rec.modality_key),
      0,
      start_ts,
      end_ts,
      rec.location_label,
      public.planning_status_for_offering(rec.is_active, rec.start_date, rec.end_date),
      CASE
        WHEN rec.instructor_label IS NOT NULL AND rec.instructor_id IS NULL
          THEN 'Formateur catalogue: ' || rec.instructor_label
        ELSE NULL
      END,
      rec.id
    )
    ON CONFLICT (offering_id) DO UPDATE SET
      title = EXCLUDED.title,
      season_id = EXCLUDED.season_id,
      instructor_id = COALESCE(EXCLUDED.instructor_id, s.instructor_id),
      language = EXCLUDED.language,
      modality = EXCLUDED.modality,
      max_students = EXCLUDED.max_students,
      start_datetime = EXCLUDED.start_datetime,
      end_datetime = EXCLUDED.end_datetime,
      location = EXCLUDED.location,
      status = EXCLUDED.status,
      notes = COALESCE(EXCLUDED.notes, s.notes),
      updated_at = now()
    RETURNING id INTO sid;

    upserted := upserted + 1;

    INSERT INTO public.session_enrollments (session_id, inscription_id, student_id, attendance_status)
    SELECT sid, i.id, i.student_id, 'inscrit'
    FROM public.inscriptions i
    WHERE i.offering_id = rec.id
      AND i.student_id IS NOT NULL
      AND i.status IN ('brouillon', 'en_attente', 'confirmee', 'en_cours')
      AND NOT EXISTS (
        SELECT 1 FROM public.session_enrollments e
        WHERE e.session_id = sid AND e.student_id = i.student_id
      );
    GET DIAGNOSTICS batch = ROW_COUNT;
    linked_by_fk := linked_by_fk + batch;
  END LOOP;

  INSERT INTO public.session_enrollments (session_id, inscription_id, student_id, attendance_status)
  SELECT s.id, i.id, i.student_id, 'inscrit'
  FROM public.sessions s
  JOIN public.registration_offerings ro ON ro.id = s.offering_id
  JOIN public.inscriptions i
    ON i.offering_id IS NULL
   AND i.student_id IS NOT NULL
   AND i.start_date IS NOT NULL
   AND i.end_date IS NOT NULL
   AND i.start_date = ro.start_date
   AND i.end_date = ro.end_date
   AND i.language = ro.language_label
   AND i.status IN ('brouillon', 'en_attente', 'confirmee', 'en_cours')
   AND (
     lower(trim(coalesce(i.course_location, ''))) = lower(trim(ro.location_label))
     OR position(
          lower(regexp_replace(trim(coalesce(i.course_location, '')), '^esf\s+', '', 'i'))
          in lower(ro.location_label)
        ) > 0
     OR position(
          lower(regexp_replace(trim(ro.location_label), '^esf\s+', '', 'i'))
          in lower(coalesce(i.course_location, ''))
        ) > 0
   )
  WHERE NOT EXISTS (
    SELECT 1 FROM public.session_enrollments e
    WHERE e.session_id = s.id AND e.student_id = i.student_id
  );
  GET DIAGNOSTICS linked_heuristic = ROW_COUNT;

  UPDATE public.inscriptions i
  SET offering_id = s.offering_id,
      updated_at = now()
  FROM public.session_enrollments e
  JOIN public.sessions s ON s.id = e.session_id
  WHERE e.inscription_id = i.id
    AND i.offering_id IS NULL
    AND s.offering_id IS NOT NULL;

  UPDATE public.inscriptions i
  SET instructor_id = s.instructor_id,
      updated_at = now()
  FROM public.session_enrollments e
  JOIN public.sessions s ON s.id = e.session_id
  WHERE e.inscription_id = i.id
    AND i.instructor_id IS NULL
    AND s.instructor_id IS NOT NULL;

  UPDATE public.sessions s
  SET current_students = (
    SELECT count(*)::int FROM public.session_enrollments e WHERE e.session_id = s.id
  ),
  updated_at = now()
  WHERE s.offering_id IS NOT NULL;

  SELECT count(*)::int INTO skipped
  FROM public.registration_offerings
  WHERE start_date IS NULL
     OR end_date IS NULL
     OR modality_key = 'online_individual';

  RETURN jsonb_build_object(
    'sessions_upserted', upserted,
    'enrollments_linked_by_offering_id', linked_by_fk,
    'enrollments_linked_heuristic', linked_heuristic,
    'offerings_skipped_no_dates_or_individual', skipped
  );
END;
$$;

REVOKE ALL ON FUNCTION public.sync_planning_sessions_from_offerings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_planning_sessions_from_offerings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_planning_sessions_from_offerings() TO service_role;

-- 7) Seed initial (hors JWT staff — corps dupliqué pour la migration)
DO $$
DECLARE
  upserted int := 0;
  rec record;
  sid uuid;
  start_ts timestamptz;
  end_ts timestamptz;
  title text;
BEGIN
  FOR rec IN
    SELECT
      ro.id,
      ro.session_code,
      ro.season_id,
      ro.instructor_id,
      ro.language_label,
      ro.modality_key,
      ro.location_label,
      ro.start_date,
      ro.end_date,
      ro.is_active,
      ro.instructor_label
    FROM public.registration_offerings ro
    WHERE ro.start_date IS NOT NULL
      AND ro.end_date IS NOT NULL
      AND ro.modality_key IS DISTINCT FROM 'online_individual'
  LOOP
    start_ts := (rec.start_date::timestamp + time '08:30') AT TIME ZONE 'Europe/Paris';
    end_ts := (rec.end_date::timestamp + time '17:30') AT TIME ZONE 'Europe/Paris';
    title := trim(both ' · ' from concat_ws(
      ' · ',
      nullif(rec.session_code, ''),
      rec.location_label,
      rec.language_label
    ));

    INSERT INTO public.sessions AS s (
      title, season_id, instructor_id, language, level, modality,
      max_students, current_students, start_datetime, end_datetime,
      location, status, notes, offering_id
    )
    VALUES (
      title, rec.season_id, rec.instructor_id, rec.language_label, 'Tous niveaux',
      public.planning_modality_for_offering(rec.modality_key),
      public.planning_max_students_for_offering(rec.session_code, rec.modality_key),
      0, start_ts, end_ts, rec.location_label,
      public.planning_status_for_offering(rec.is_active, rec.start_date, rec.end_date),
      CASE
        WHEN rec.instructor_label IS NOT NULL AND rec.instructor_id IS NULL
          THEN 'Formateur catalogue: ' || rec.instructor_label
        ELSE NULL
      END,
      rec.id
    )
    ON CONFLICT (offering_id) DO UPDATE SET
      title = EXCLUDED.title,
      season_id = EXCLUDED.season_id,
      instructor_id = COALESCE(EXCLUDED.instructor_id, s.instructor_id),
      language = EXCLUDED.language,
      modality = EXCLUDED.modality,
      max_students = EXCLUDED.max_students,
      start_datetime = EXCLUDED.start_datetime,
      end_datetime = EXCLUDED.end_datetime,
      location = EXCLUDED.location,
      status = EXCLUDED.status,
      updated_at = now()
    RETURNING id INTO sid;

    upserted := upserted + 1;

    INSERT INTO public.session_enrollments (session_id, inscription_id, student_id, attendance_status)
    SELECT sid, i.id, i.student_id, 'inscrit'
    FROM public.inscriptions i
    WHERE i.offering_id = rec.id
      AND i.student_id IS NOT NULL
      AND i.status IN ('brouillon', 'en_attente', 'confirmee', 'en_cours')
      AND NOT EXISTS (
        SELECT 1 FROM public.session_enrollments e
        WHERE e.session_id = sid AND e.student_id = i.student_id
      );
  END LOOP;

  INSERT INTO public.session_enrollments (session_id, inscription_id, student_id, attendance_status)
  SELECT s.id, i.id, i.student_id, 'inscrit'
  FROM public.sessions s
  JOIN public.registration_offerings ro ON ro.id = s.offering_id
  JOIN public.inscriptions i
    ON i.offering_id IS NULL
   AND i.student_id IS NOT NULL
   AND i.start_date = ro.start_date
   AND i.end_date = ro.end_date
   AND i.language = ro.language_label
   AND i.status IN ('brouillon', 'en_attente', 'confirmee', 'en_cours')
   AND (
     lower(trim(coalesce(i.course_location, ''))) = lower(trim(ro.location_label))
     OR position(
          lower(regexp_replace(trim(coalesce(i.course_location, '')), '^esf\s+', '', 'i'))
          in lower(ro.location_label)
        ) > 0
     OR position(
          lower(regexp_replace(trim(ro.location_label), '^esf\s+', '', 'i'))
          in lower(coalesce(i.course_location, ''))
        ) > 0
   )
  WHERE NOT EXISTS (
    SELECT 1 FROM public.session_enrollments e
    WHERE e.session_id = s.id AND e.student_id = i.student_id
  );

  UPDATE public.inscriptions i
  SET offering_id = s.offering_id, updated_at = now()
  FROM public.session_enrollments e
  JOIN public.sessions s ON s.id = e.session_id
  WHERE e.inscription_id = i.id
    AND i.offering_id IS NULL
    AND s.offering_id IS NOT NULL;

  UPDATE public.sessions s
  SET current_students = (
    SELECT count(*)::int FROM public.session_enrollments e WHERE e.session_id = s.id
  )
  WHERE s.offering_id IS NOT NULL;

  INSERT INTO public.audit_log (action, table_name, new_values)
  VALUES (
    'planning_unifie_sessions_seed',
    'sessions',
    jsonb_build_object(
      'migration', '20261113120000_planning_unifie_sessions',
      'sessions_upserted', upserted,
      'sessions_total', (SELECT count(*)::int FROM public.sessions WHERE offering_id IS NOT NULL),
      'enrollments_total', (SELECT count(*)::int FROM public.session_enrollments)
    )
  );
END;
$$;
