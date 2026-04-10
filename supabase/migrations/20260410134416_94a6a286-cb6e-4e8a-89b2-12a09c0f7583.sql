
-- Enrich instructors table
ALTER TABLE public.instructors
  ADD COLUMN IF NOT EXISTS tax_status text DEFAULT 'auto_entrepreneur',
  ADD COLUMN IF NOT EXISTS availability_status text DEFAULT 'disponible',
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS rating_average numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS certifications jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create instructor_sessions table
CREATE TABLE public.instructor_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  inscription_id uuid REFERENCES public.inscriptions(id) ON DELETE SET NULL,
  session_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  duration_hours numeric NOT NULL,
  status text NOT NULL DEFAULT 'planifiee',
  location text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.instructor_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view instructor_sessions" ON public.instructor_sessions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can insert instructor_sessions" ON public.instructor_sessions
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Staff can update instructor_sessions" ON public.instructor_sessions
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Admin can delete instructor_sessions" ON public.instructor_sessions
  FOR DELETE TO authenticated USING (is_admin());

-- Trigger for updated_at on instructors
CREATE TRIGGER set_instructors_updated_at
  BEFORE UPDATE ON public.instructors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
