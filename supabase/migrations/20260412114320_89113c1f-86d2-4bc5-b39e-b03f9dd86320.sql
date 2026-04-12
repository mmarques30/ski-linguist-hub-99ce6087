
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL DEFAULT 'autre',
  partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL,
  contact_name text NOT NULL,
  contact_email text,
  contact_phone text,
  company text,
  language_interest text,
  estimated_students integer DEFAULT 1,
  estimated_revenue numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'nouveau',
  assigned_to uuid,
  next_action text,
  next_action_date date,
  loss_reason text,
  notes text,
  inscription_id uuid REFERENCES public.inscriptions(id) ON DELETE SET NULL,
  season_id uuid REFERENCES public.seasons(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rls_leads_select" ON public.leads FOR SELECT TO authenticated USING (is_staff());
CREATE POLICY "rls_leads_insert" ON public.leads FOR INSERT TO authenticated WITH CHECK (is_staff());
CREATE POLICY "rls_leads_update" ON public.leads FOR UPDATE TO authenticated USING (is_staff());
CREATE POLICY "rls_leads_delete" ON public.leads FOR DELETE TO authenticated USING (is_admin());

CREATE TRIGGER set_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
