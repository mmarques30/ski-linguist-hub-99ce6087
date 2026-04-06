
-- Table partners
CREATE TABLE public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'esf',
  station text,
  address text,
  contact_name text,
  contact_email text,
  contact_phone text,
  contract_start_date date,
  contract_end_date date,
  status text NOT NULL DEFAULT 'prospect',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view partners" ON public.partners FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert partners" ON public.partners FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can update partners" ON public.partners FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin can delete partners" ON public.partners FOR DELETE TO authenticated USING (is_admin());

CREATE TRIGGER set_partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table partner_contracts
CREATE TABLE public.partner_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  contract_type text NOT NULL DEFAULT 'saisonnier',
  negotiated_rate numeric,
  volume_commitment text,
  payment_terms text DEFAULT '30j',
  signed_date date,
  document_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view partner_contracts" ON public.partner_contracts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert partner_contracts" ON public.partner_contracts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can update partner_contracts" ON public.partner_contracts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin can delete partner_contracts" ON public.partner_contracts FOR DELETE TO authenticated USING (is_admin());

CREATE TRIGGER set_partner_contracts_updated_at
  BEFORE UPDATE ON public.partner_contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table partner_contacts
CREATE TABLE public.partner_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text,
  email text,
  phone text,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view partner_contacts" ON public.partner_contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert partner_contacts" ON public.partner_contacts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can update partner_contacts" ON public.partner_contacts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin can delete partner_contacts" ON public.partner_contacts FOR DELETE TO authenticated USING (is_admin());

-- Add partner_id to inscriptions
ALTER TABLE public.inscriptions ADD COLUMN IF NOT EXISTS partner_id uuid REFERENCES public.partners(id);
