-- Sessions saison 2026-2027 : statut inscription (ouvert / liste d'attente),
-- tarif partenaire selon école, table de contacts waitlist.

ALTER TABLE public.registration_offerings
  ADD COLUMN IF NOT EXISTS session_code text,
  ADD COLUMN IF NOT EXISTS instructor_label text,
  ADD COLUMN IF NOT EXISTS enrollment_status text NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS partner_price numeric,
  ADD COLUMN IF NOT EXISTS partner_school_codes text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS format_label text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'registration_offerings_enrollment_status_check'
  ) THEN
    ALTER TABLE public.registration_offerings
      ADD CONSTRAINT registration_offerings_enrollment_status_check
      CHECK (enrollment_status IN ('open', 'waitlist'));
  END IF;
END $$;

COMMENT ON COLUMN public.registration_offerings.session_code IS
  'Identifiant métier session (ex. S01) — docs/SESSIONS_2026_2027.md';
COMMENT ON COLUMN public.registration_offerings.enrollment_status IS
  'open = inscription possible ; waitlist = affichée sans inscription (contact rappel)';
COMMENT ON COLUMN public.registration_offerings.partner_price IS
  'Tarif si ski_school_code ∈ partner_school_codes ; sinon base_price (= tarif autres)';
COMMENT ON COLUMN public.registration_offerings.partner_school_codes IS
  'Codes ski_school_directory éligibles au tarif partenaire';
COMMENT ON COLUMN public.registration_offerings.instructor_label IS
  'Nom formateur·trice affiché sur /register';
COMMENT ON COLUMN public.registration_offerings.format_label IS
  'Libellé format (ex. Présentiel 24 h, Visio 24 h)';

CREATE UNIQUE INDEX IF NOT EXISTS idx_registration_offerings_session_code_active
  ON public.registration_offerings (session_code)
  WHERE session_code IS NOT NULL AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_registration_offerings_enrollment_status
  ON public.registration_offerings (enrollment_status)
  WHERE is_active;

-- Contacts « rappel dès confirmation » (sessions en attente)
CREATE TABLE IF NOT EXISTS public.registration_waitlist_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offering_id uuid REFERENCES public.registration_offerings(id) ON DELETE SET NULL,
  session_code text,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  ski_school text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_registration_waitlist_offering
  ON public.registration_waitlist_requests (offering_id);

CREATE INDEX IF NOT EXISTS idx_registration_waitlist_created
  ON public.registration_waitlist_requests (created_at DESC);

COMMENT ON TABLE public.registration_waitlist_requests IS
  'Coordonnées laissées sur /register pour une session en attente de confirmation';

ALTER TABLE public.registration_waitlist_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rls_registration_waitlist_anon_insert" ON public.registration_waitlist_requests;
CREATE POLICY "rls_registration_waitlist_anon_insert"
  ON public.registration_waitlist_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "rls_registration_waitlist_staff_select" ON public.registration_waitlist_requests;
CREATE POLICY "rls_registration_waitlist_staff_select"
  ON public.registration_waitlist_requests
  FOR SELECT
  TO authenticated
  USING (public.is_staff());

DROP POLICY IF EXISTS "rls_registration_waitlist_staff_all" ON public.registration_waitlist_requests;
CREATE POLICY "rls_registration_waitlist_staff_all"
  ON public.registration_waitlist_requests
  FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'registration_sessions_schema',
  'registration_offerings',
  jsonb_build_object('migration', '20260930120000_registration_sessions_2026_2027')
);
