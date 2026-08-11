-- Catalogue public d'offres pour l'inscription /register (lieu → langue → dates → durée → prix)

CREATE TABLE IF NOT EXISTS public.registration_offerings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid REFERENCES public.seasons(id) ON DELETE SET NULL,
  location_key text NOT NULL,
  location_label text NOT NULL,
  language_key text NOT NULL,
  language_label text NOT NULL,
  modality_key text NOT NULL CHECK (modality_key IN ('in_person', 'online_individual', 'online_group')),
  modality_label text NOT NULL,
  duration_hours numeric NOT NULL,
  start_date date,
  end_date date,
  date_label text,
  base_price numeric NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.registration_offerings IS 'Offres visibles sur le formulaire public /register';
COMMENT ON COLUMN public.registration_offerings.location_key IS 'Clé stable (ex: courchevel, online)';
COMMENT ON COLUMN public.registration_offerings.date_label IS 'Libellé affiché si les dates ne sont pas encore fixées';

CREATE INDEX IF NOT EXISTS idx_registration_offerings_location ON public.registration_offerings(location_key) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_registration_offerings_active ON public.registration_offerings(is_active, sort_order);

CREATE TRIGGER set_registration_offerings_updated_at
  BEFORE UPDATE ON public.registration_offerings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.registration_offerings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rls_registration_offerings_public_select"
  ON public.registration_offerings FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "rls_registration_offerings_staff_all"
  ON public.registration_offerings FOR ALL
  TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff());

-- Lecture publique des saisons courantes (pour filtrer le catalogue)
DROP POLICY IF EXISTS "rls_seasons_public_current_select" ON public.seasons;
CREATE POLICY "rls_seasons_public_current_select"
  ON public.seasons FOR SELECT
  TO anon
  USING (is_current = true OR status = 'en_cours');
