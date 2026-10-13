-- Référentiel écoles de ski pour /register (SESSIONS_2026_2027 §4)
-- Distinct de ski_schools (15 fiches BO opérationnelles liées aux partenaires).

CREATE TABLE IF NOT EXISTS public.ski_school_directory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reseau text NOT NULL,
  code text NOT NULL,
  nom_affiche text NOT NULL,
  station text,
  departement text,
  ville text,
  cp text,
  region_esf text,
  num_esf text,
  cartes_actifs integer,
  directeur text,
  courriel_ecole text,
  courriel_direction text,
  telephone text,
  source text,
  is_active boolean NOT NULL DEFAULT true,
  pending_validation boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ski_school_directory_code_unique UNIQUE (code),
  CONSTRAINT ski_school_directory_reseau_check CHECK (
    reseau IN ('ESF', 'ESI', 'Evolution 2', 'Prosneige', 'Oxygène', 'Autre')
  )
);

CREATE INDEX IF NOT EXISTS idx_ski_school_directory_reseau_station
  ON public.ski_school_directory (reseau, station);

CREATE INDEX IF NOT EXISTS idx_ski_school_directory_active
  ON public.ski_school_directory (is_active)
  WHERE is_active;

COMMENT ON TABLE public.ski_school_directory IS
  'Liste fermée des écoles pour /register (réseau → école). Enrichissement admin dans les colonnes contact.';

-- Champs stagiaire pour rattachement école (tarif partenaire)
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS ski_network text,
  ADD COLUMN IF NOT EXISTS ski_school_code text,
  ADD COLUMN IF NOT EXISTS ski_school_other text,
  ADD COLUMN IF NOT EXISTS carte_syndicale text,
  ADD COLUMN IF NOT EXISTS carte_syndicale_pending boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.students.ski_network IS
  'ESF | ESI | Evolution 2 | Prosneige | Oxygène | Indépendant.e | Autre';
COMMENT ON COLUMN public.students.ski_school_code IS
  'Code ski_school_directory (ex. esf-668), NULL si Autre/Indépendant';
COMMENT ON COLUMN public.students.ski_school_other IS
  'Saisie libre Autre / Autre ESF / station indépendant';

-- RLS : lecture publique des entrées actives (formulaire /register anonyme)
ALTER TABLE public.ski_school_directory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rls_ski_school_directory_select_active" ON public.ski_school_directory;
CREATE POLICY "rls_ski_school_directory_select_active"
  ON public.ski_school_directory
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "rls_ski_school_directory_admin_all" ON public.ski_school_directory;
CREATE POLICY "rls_ski_school_directory_admin_all"
  ON public.ski_school_directory
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'user'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'user'));

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'ski_school_directory_created',
  'ski_school_directory',
  jsonb_build_object('migration', '20260930100000_ski_school_directory')
);
