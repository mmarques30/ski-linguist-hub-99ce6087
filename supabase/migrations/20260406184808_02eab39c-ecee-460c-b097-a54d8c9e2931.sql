
-- Table sessions
CREATE TABLE public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  season_id uuid REFERENCES public.seasons(id),
  instructor_id uuid REFERENCES public.instructors(id),
  language text NOT NULL,
  level text NOT NULL DEFAULT 'A1',
  modality text NOT NULL DEFAULT 'individuel',
  max_students integer NOT NULL DEFAULT 1,
  current_students integer NOT NULL DEFAULT 0,
  start_datetime timestamptz NOT NULL,
  end_datetime timestamptz NOT NULL,
  recurrence text, -- null, 'weekly', 'biweekly'
  location text,
  room text,
  status text NOT NULL DEFAULT 'planifiee',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view sessions" ON public.sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert sessions" ON public.sessions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can update sessions" ON public.sessions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin can delete sessions" ON public.sessions FOR DELETE TO authenticated USING (is_admin());

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table session_enrollments
CREATE TABLE public.session_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  inscription_id uuid REFERENCES public.inscriptions(id),
  student_id uuid NOT NULL REFERENCES public.students(id),
  attendance_status text NOT NULL DEFAULT 'inscrit',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.session_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view session_enrollments" ON public.session_enrollments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert session_enrollments" ON public.session_enrollments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can update session_enrollments" ON public.session_enrollments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin can delete session_enrollments" ON public.session_enrollments FOR DELETE TO authenticated USING (is_admin());

-- Unique constraint to prevent duplicate enrollment
CREATE UNIQUE INDEX idx_session_enrollments_unique ON public.session_enrollments(session_id, student_id);
