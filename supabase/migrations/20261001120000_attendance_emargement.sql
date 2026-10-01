-- Émargement numérique (MVP) — créneaux + signatures stagiaires
-- Voir docs/POINT_EMARGEMENT.md

CREATE TABLE public.attendance_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES public.instructors(id) ON DELETE RESTRICT,
  session_id uuid REFERENCES public.sessions(id) ON DELETE CASCADE,
  inscription_id uuid REFERENCES public.inscriptions(id) ON DELETE CASCADE,
  -- Clé de cohorte pour collectif sans ligne sessions (lang|lieu|début|groupe)
  group_key text,
  title text,
  slot_date date NOT NULL,
  day_part text NOT NULL DEFAULT 'custom'
    CHECK (day_part IN ('matin', 'apres-midi', 'custom')),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'open', 'instructor_validated', 'admin_validated', 'closed')),
  opened_at timestamptz,
  closed_at timestamptz,
  instructor_validated_at timestamptz,
  instructor_validated_by uuid REFERENCES auth.users(id),
  admin_validated_at timestamptz,
  admin_validated_by uuid REFERENCES auth.users(id),
  sign_token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  sign_token_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT attendance_slots_owner_check CHECK (
    (session_id IS NOT NULL AND inscription_id IS NULL AND group_key IS NULL)
    OR (session_id IS NULL AND inscription_id IS NOT NULL AND group_key IS NULL)
    OR (session_id IS NULL AND inscription_id IS NULL AND group_key IS NOT NULL)
  ),
  CONSTRAINT attendance_slots_range_check CHECK (ends_at > starts_at)
);

CREATE UNIQUE INDEX attendance_slots_session_uniq
  ON public.attendance_slots (session_id, slot_date, day_part)
  WHERE session_id IS NOT NULL AND day_part IN ('matin', 'apres-midi');

CREATE UNIQUE INDEX attendance_slots_inscription_custom_uniq
  ON public.attendance_slots (inscription_id, starts_at)
  WHERE inscription_id IS NOT NULL;

CREATE UNIQUE INDEX attendance_slots_group_uniq
  ON public.attendance_slots (instructor_id, group_key, slot_date, day_part)
  WHERE group_key IS NOT NULL AND day_part IN ('matin', 'apres-midi');

CREATE INDEX attendance_slots_instructor_idx ON public.attendance_slots (instructor_id);
CREATE INDEX attendance_slots_status_idx ON public.attendance_slots (status);

CREATE TABLE public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id uuid NOT NULL REFERENCES public.attendance_slots(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  inscription_id uuid NOT NULL REFERENCES public.inscriptions(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'present', 'absent', 'excuse')),
  signed_via text
    CHECK (signed_via IS NULL OR signed_via IN ('self_link', 'qr', 'instructor', 'admin')),
  signed_at timestamptz,
  signed_by uuid REFERENCES auth.users(id),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (slot_id, inscription_id),
  CONSTRAINT attendance_records_present_requires_student_action CHECK (
    status <> 'present'
    OR (signed_via IN ('self_link', 'qr') AND signed_at IS NOT NULL)
  ),
  CONSTRAINT attendance_records_staff_mark_check CHECK (
    status NOT IN ('absent', 'excuse')
    OR signed_via IN ('instructor', 'admin')
  )
);

CREATE INDEX attendance_records_inscription_idx ON public.attendance_records (inscription_id);
CREATE INDEX attendance_records_slot_idx ON public.attendance_records (slot_id);
CREATE INDEX attendance_records_student_idx ON public.attendance_records (student_id);

CREATE OR REPLACE FUNCTION public.set_attendance_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER attendance_slots_updated_at
  BEFORE UPDATE ON public.attendance_slots
  FOR EACH ROW EXECUTE FUNCTION public.set_attendance_updated_at();

CREATE TRIGGER attendance_records_updated_at
  BEFORE UPDATE ON public.attendance_records
  FOR EACH ROW EXECUTE FUNCTION public.set_attendance_updated_at();

-- Taux d'assiduité : (present + excuse) / (present + excuse + absent)
-- uniquement sur créneaux admin_validated
CREATE OR REPLACE FUNCTION public.compute_attendance_rate(p_inscription_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN COUNT(*) FILTER (WHERE r.status IN ('present', 'excuse', 'absent')) = 0 THEN NULL
    ELSE ROUND(
      100.0 * COUNT(*) FILTER (WHERE r.status IN ('present', 'excuse'))
      / COUNT(*) FILTER (WHERE r.status IN ('present', 'excuse', 'absent'))
    , 1)
  END
  FROM public.attendance_records r
  JOIN public.attendance_slots s ON s.id = r.slot_id
  WHERE r.inscription_id = p_inscription_id
    AND s.status = 'admin_validated';
$$;

GRANT EXECUTE ON FUNCTION public.compute_attendance_rate(uuid) TO authenticated;

-- Contexte public (page /emarger/:token) — pas de liste e-mails
CREATE OR REPLACE FUNCTION public.get_attendance_slot_by_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF p_token IS NULL OR length(trim(p_token)) < 16 THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'id', s.id,
    'title', s.title,
    'slot_date', s.slot_date,
    'day_part', s.day_part,
    'starts_at', s.starts_at,
    'ends_at', s.ends_at,
    'status', s.status,
    'sign_token_expires_at', s.sign_token_expires_at,
    'pending_count', (
      SELECT COUNT(*)::int FROM public.attendance_records r
      WHERE r.slot_id = s.id AND r.status = 'pending'
    ),
    'signed_count', (
      SELECT COUNT(*)::int FROM public.attendance_records r
      WHERE r.slot_id = s.id AND r.status = 'present'
    )
  )
  INTO result
  FROM public.attendance_slots s
  WHERE s.sign_token = trim(p_token)
  LIMIT 1;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_attendance_slot_by_token(text) TO anon, authenticated;

-- Signature stagiaire (action obligatoire pour present)
CREATE OR REPLACE FUNCTION public.sign_attendance_by_token(
  p_token text,
  p_email text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slot public.attendance_slots%ROWTYPE;
  v_record public.attendance_records%ROWTYPE;
  v_email text;
BEGIN
  IF p_token IS NULL OR length(trim(p_token)) < 16 THEN
    RAISE EXCEPTION 'Token invalide';
  END IF;

  v_email := lower(trim(COALESCE(p_email, '')));
  IF v_email = '' OR position('@' IN v_email) = 0 THEN
    RAISE EXCEPTION 'E-mail invalide';
  END IF;

  SELECT * INTO v_slot
  FROM public.attendance_slots
  WHERE sign_token = trim(p_token)
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Créneau introuvable';
  END IF;

  IF v_slot.status <> 'open' THEN
    RAISE EXCEPTION 'Ce créneau n''accepte plus de signatures';
  END IF;

  IF v_slot.sign_token_expires_at IS NOT NULL AND v_slot.sign_token_expires_at < now() THEN
    RAISE EXCEPTION 'Lien d''émargement expiré';
  END IF;

  SELECT r.* INTO v_record
  FROM public.attendance_records r
  JOIN public.students st ON st.id = r.student_id
  WHERE r.slot_id = v_slot.id
    AND lower(trim(st.email)) = v_email
  FOR UPDATE OF r;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aucun stagiaire trouvé pour cet e-mail sur ce créneau';
  END IF;

  IF v_record.status = 'present' THEN
    RETURN jsonb_build_object(
      'ok', true,
      'already_signed', true,
      'signed_at', v_record.signed_at,
      'student_first_name', (SELECT first_name FROM public.students WHERE id = v_record.student_id)
    );
  END IF;

  IF v_record.status <> 'pending' THEN
    RAISE EXCEPTION 'Cette ligne n''est plus en attente de signature';
  END IF;

  UPDATE public.attendance_records
  SET
    status = 'present',
    signed_via = 'self_link',
    signed_at = now(),
    signed_by = NULL
  WHERE id = v_record.id
  RETURNING * INTO v_record;

  RETURN jsonb_build_object(
    'ok', true,
    'already_signed', false,
    'signed_at', v_record.signed_at,
    'student_first_name', (SELECT first_name FROM public.students WHERE id = v_record.student_id)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.sign_attendance_by_token(text, text) TO anon, authenticated;

-- RLS
ALTER TABLE public.attendance_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rls_attendance_slots_select_staff"
  ON public.attendance_slots FOR SELECT TO authenticated
  USING (public.is_staff());

CREATE POLICY "rls_attendance_slots_select_formateur"
  ON public.attendance_slots FOR SELECT TO authenticated
  USING (
    public.is_formateur()
    AND instructor_id = public.get_my_instructor_id()
  );

CREATE POLICY "rls_attendance_slots_insert_staff"
  ON public.attendance_slots FOR INSERT TO authenticated
  WITH CHECK (public.is_staff());

CREATE POLICY "rls_attendance_slots_insert_formateur"
  ON public.attendance_slots FOR INSERT TO authenticated
  WITH CHECK (
    public.is_formateur()
    AND instructor_id = public.get_my_instructor_id()
  );

CREATE POLICY "rls_attendance_slots_update_staff"
  ON public.attendance_slots FOR UPDATE TO authenticated
  USING (public.is_staff());

CREATE POLICY "rls_attendance_slots_update_formateur"
  ON public.attendance_slots FOR UPDATE TO authenticated
  USING (
    public.is_formateur()
    AND instructor_id = public.get_my_instructor_id()
    AND status IN ('draft', 'open')
  )
  WITH CHECK (
    public.is_formateur()
    AND instructor_id = public.get_my_instructor_id()
    AND status IN ('draft', 'open', 'instructor_validated', 'closed')
  );

CREATE POLICY "rls_attendance_slots_delete_admin"
  ON public.attendance_slots FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE POLICY "rls_attendance_records_select_staff"
  ON public.attendance_records FOR SELECT TO authenticated
  USING (public.is_staff());

CREATE POLICY "rls_attendance_records_select_formateur"
  ON public.attendance_records FOR SELECT TO authenticated
  USING (
    public.is_formateur()
    AND EXISTS (
      SELECT 1 FROM public.attendance_slots s
      WHERE s.id = attendance_records.slot_id
        AND s.instructor_id = public.get_my_instructor_id()
    )
  );

CREATE POLICY "rls_attendance_records_select_student"
  ON public.attendance_records FOR SELECT TO authenticated
  USING (
    student_id = public.get_my_student_id()
  );

CREATE POLICY "rls_attendance_records_insert_staff"
  ON public.attendance_records FOR INSERT TO authenticated
  WITH CHECK (
    public.is_staff()
    AND status = 'pending'
  );

CREATE POLICY "rls_attendance_records_insert_formateur"
  ON public.attendance_records FOR INSERT TO authenticated
  WITH CHECK (
    public.is_formateur()
    AND status = 'pending'
    AND EXISTS (
      SELECT 1 FROM public.attendance_slots s
      WHERE s.id = slot_id
        AND s.instructor_id = public.get_my_instructor_id()
    )
  );

-- Formateur / staff : absent / excuse uniquement (jamais present)
CREATE POLICY "rls_attendance_records_update_staff"
  ON public.attendance_records FOR UPDATE TO authenticated
  USING (public.is_staff())
  WITH CHECK (
    public.is_staff()
    AND status IN ('pending', 'absent', 'excuse')
  );

CREATE POLICY "rls_attendance_records_update_formateur"
  ON public.attendance_records FOR UPDATE TO authenticated
  USING (
    public.is_formateur()
    AND EXISTS (
      SELECT 1 FROM public.attendance_slots s
      WHERE s.id = attendance_records.slot_id
        AND s.instructor_id = public.get_my_instructor_id()
        AND s.status = 'open'
    )
  )
  WITH CHECK (
    status IN ('pending', 'absent', 'excuse')
    AND (
      status = 'pending'
      OR signed_via IN ('instructor', 'admin')
    )
  );

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'attendance_emargement_mvp',
  'attendance_slots',
  jsonb_build_object(
    'migration', '20261001120000_attendance_emargement',
    'tables', jsonb_build_array('attendance_slots', 'attendance_records'),
    'rpcs', jsonb_build_array(
      'compute_attendance_rate',
      'get_attendance_slot_by_token',
      'sign_attendance_by_token'
    )
  )
);
