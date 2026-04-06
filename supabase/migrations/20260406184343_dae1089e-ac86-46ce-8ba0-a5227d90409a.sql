
-- Table seasons
CREATE TABLE public.seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'planifiee',
  is_current boolean NOT NULL DEFAULT false,
  revenue_target numeric DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view seasons" ON public.seasons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert seasons" ON public.seasons FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can update seasons" ON public.seasons FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin can delete seasons" ON public.seasons FOR DELETE TO authenticated USING (is_admin());

CREATE TRIGGER update_seasons_updated_at BEFORE UPDATE ON public.seasons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table pricing_rules
CREATE TABLE public.pricing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  language text NOT NULL,
  level text NOT NULL,
  duration_hours numeric NOT NULL,
  modality text NOT NULL,
  base_price numeric NOT NULL,
  group_discount_percent numeric DEFAULT 0,
  esf_partner_price numeric,
  opco_eligible boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view pricing_rules" ON public.pricing_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert pricing_rules" ON public.pricing_rules FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can update pricing_rules" ON public.pricing_rules FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin can delete pricing_rules" ON public.pricing_rules FOR DELETE TO authenticated USING (is_admin());

CREATE TRIGGER update_pricing_rules_updated_at BEFORE UPDATE ON public.pricing_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- FK columns on existing tables
ALTER TABLE public.inscriptions ADD COLUMN season_id uuid REFERENCES public.seasons(id);
ALTER TABLE public.invoices ADD COLUMN season_id uuid REFERENCES public.seasons(id);

-- Function to activate a single season
CREATE OR REPLACE FUNCTION public.activate_season(p_season_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.seasons SET is_current = false, status = 'terminee'
    WHERE is_current = true AND id != p_season_id;
  UPDATE public.seasons SET is_current = true, status = 'active'
    WHERE id = p_season_id;
END;
$$;
