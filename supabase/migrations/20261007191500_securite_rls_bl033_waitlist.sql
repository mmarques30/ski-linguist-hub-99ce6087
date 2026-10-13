-- Sécurité Lovable quick scan (2026-10-07) :
-- 1) Critical LOV.DB.RLS_DISABLED.V1 — tables techniques BL033 sans RLS
-- 2) Warning LOV.DB.RLS_TAUTOLOGY_PERMISSIVE.V1 — waitlist anon INSERT WITH CHECK (true)
--
-- Aucun écran n'utilise _bl033_* ; on les verrouille (service_role only).
-- La waitlist publique reste insert-only, avec contrôle de contenu minimal.

-- ---------------------------------------------------------------------------
-- Finding 1 — Critical : _bl033_dedup_map / _bl033_log
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public._bl033_dedup_map') IS NOT NULL THEN
    ALTER TABLE public._bl033_dedup_map ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON TABLE public._bl033_dedup_map FROM anon, authenticated;
    GRANT ALL ON TABLE public._bl033_dedup_map TO service_role;
  END IF;

  IF to_regclass('public._bl033_log') IS NOT NULL THEN
    ALTER TABLE public._bl033_log ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON TABLE public._bl033_log FROM anon, authenticated;
    GRANT ALL ON TABLE public._bl033_log TO service_role;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Finding 2 — Warning : registration_waitlist_requests anon insert tautology
-- ---------------------------------------------------------------------------
-- Droits : anon / authenticated = INSERT uniquement ; le reste est staff via RLS.
REVOKE ALL ON TABLE public.registration_waitlist_requests FROM anon, authenticated;
GRANT INSERT ON TABLE public.registration_waitlist_requests TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON TABLE public.registration_waitlist_requests TO authenticated;

DROP POLICY IF EXISTS "rls_registration_waitlist_anon_insert" ON public.registration_waitlist_requests;
CREATE POLICY "rls_registration_waitlist_anon_insert"
  ON public.registration_waitlist_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    first_name IS NOT NULL
    AND length(btrim(first_name)) BETWEEN 1 AND 100
    AND last_name IS NOT NULL
    AND length(btrim(last_name)) BETWEEN 1 AND 100
    AND email IS NOT NULL
    AND length(btrim(email)) BETWEEN 3 AND 254
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND (phone IS NULL OR length(phone) <= 40)
    AND (ski_school IS NULL OR length(ski_school) <= 200)
    AND (notes IS NULL OR length(notes) <= 2000)
    AND (session_code IS NULL OR length(session_code) <= 100)
  );

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'securite_rls_bl033_waitlist',
  'registration_waitlist_requests',
  jsonb_build_object(
    'bl033_rls', 'enabled_revoke_anon_authenticated',
    'waitlist_insert_check', 'content_validated',
    'scan', 'lovable_quick_2026-10-07'
  )
);
