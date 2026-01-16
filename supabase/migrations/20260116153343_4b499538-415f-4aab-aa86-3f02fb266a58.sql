-- ============================================
-- FLI Dashboard Financier - Tables et Vues
-- ============================================

-- 1. Table formation_costs (Coûts par formation)
CREATE TABLE public.formation_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  inscription_id UUID REFERENCES public.inscriptions(id) ON DELETE CASCADE,
  
  cost_type TEXT NOT NULL CHECK (cost_type IN (
    'formateur',
    'hebergement', 
    'deplacement',
    'salle',
    'materiel',
    'restauration',
    'autre'
  )),
  
  montant_ht DECIMAL(10,2) NOT NULL,
  montant_tva DECIMAL(10,2) DEFAULT 0,
  montant_ttc DECIMAL(10,2) NOT NULL,
  
  instructor_id UUID REFERENCES public.instructors(id),
  description TEXT,
  date_cout DATE,
  document_url TEXT
);

-- Index pour performance
CREATE INDEX idx_formation_costs_inscription ON public.formation_costs(inscription_id);
CREATE INDEX idx_formation_costs_type ON public.formation_costs(cost_type);
CREATE INDEX idx_formation_costs_date ON public.formation_costs(date_cout);

-- 2. Table instructor_payments (Paiements formateurs)
CREATE TABLE public.instructor_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  
  montant DECIMAL(10,2) NOT NULL,
  periode_debut DATE NOT NULL,
  periode_fin DATE NOT NULL,
  
  date_paiement DATE,
  moyen_paiement TEXT CHECK (moyen_paiement IN ('virement', 'cheque', 'especes')),
  reference_paiement TEXT,
  
  statut TEXT NOT NULL DEFAULT 'a_payer' CHECK (statut IN ('a_payer', 'paye')),
  notes TEXT
);

CREATE INDEX idx_instructor_payments_instructor ON public.instructor_payments(instructor_id);
CREATE INDEX idx_instructor_payments_statut ON public.instructor_payments(statut);
CREATE INDEX idx_instructor_payments_date ON public.instructor_payments(date_paiement);

-- 3. Table fixed_costs (Charges fixes)
CREATE TABLE public.fixed_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  mois DATE NOT NULL,
  
  cost_type TEXT NOT NULL CHECK (cost_type IN (
    'loyer',
    'telecom',
    'assurance',
    'comptable',
    'banque',
    'logiciels',
    'maintenance',
    'qualiopi',
    'emprunt',
    'autre'
  )),
  
  montant DECIMAL(10,2) NOT NULL,
  description TEXT,
  recurrent BOOLEAN DEFAULT true,
  paye BOOLEAN DEFAULT false,
  date_paiement DATE,
  
  UNIQUE(mois, cost_type)
);

CREATE INDEX idx_fixed_costs_mois ON public.fixed_costs(mois);

-- 4. Table cost_templates (Modèles de charges récurrentes)
CREATE TABLE public.cost_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  cost_type TEXT NOT NULL UNIQUE,
  montant_mensuel DECIMAL(10,2) NOT NULL,
  description TEXT,
  actif BOOLEAN DEFAULT true
);

-- Données initiales pour cost_templates
INSERT INTO public.cost_templates (cost_type, montant_mensuel, description) VALUES
  ('loyer', 650.00, 'Loyer bureau'),
  ('telecom', 183.33, 'Téléphone et internet'),
  ('assurance', 108.33, 'Assurance professionnelle'),
  ('comptable', 183.33, 'Honoraires comptable'),
  ('banque', 58.33, 'Frais bancaires'),
  ('logiciels', 50.00, 'Abonnements logiciels'),
  ('emprunt', 960.00, 'Remboursement prêts (2x480€)');

-- 5. Triggers pour updated_at
CREATE TRIGGER update_formation_costs_updated_at
  BEFORE UPDATE ON public.formation_costs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_instructor_payments_updated_at
  BEFORE UPDATE ON public.instructor_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 6. RLS Policies
ALTER TABLE public.formation_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixed_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_templates ENABLE ROW LEVEL SECURITY;

-- formation_costs policies
CREATE POLICY "Authenticated users can view formation_costs" ON public.formation_costs FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert formation_costs" ON public.formation_costs FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update formation_costs" ON public.formation_costs FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete formation_costs" ON public.formation_costs FOR DELETE USING (true);

-- instructor_payments policies
CREATE POLICY "Authenticated users can view instructor_payments" ON public.instructor_payments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert instructor_payments" ON public.instructor_payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update instructor_payments" ON public.instructor_payments FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete instructor_payments" ON public.instructor_payments FOR DELETE USING (true);

-- fixed_costs policies
CREATE POLICY "Authenticated users can view fixed_costs" ON public.fixed_costs FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert fixed_costs" ON public.fixed_costs FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update fixed_costs" ON public.fixed_costs FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete fixed_costs" ON public.fixed_costs FOR DELETE USING (true);

-- cost_templates policies
CREATE POLICY "Authenticated users can view cost_templates" ON public.cost_templates FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert cost_templates" ON public.cost_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update cost_templates" ON public.cost_templates FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete cost_templates" ON public.cost_templates FOR DELETE USING (true);