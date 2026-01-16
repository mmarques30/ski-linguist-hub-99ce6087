-- =====================================================
-- PHASE A: FLI COMPLETE DATABASE MIGRATION
-- =====================================================

-- 1. INSCRIPTIONS - Nouveaux champs
ALTER TABLE public.inscriptions 
ADD COLUMN IF NOT EXISTS funding_organization text,
ADD COLUMN IF NOT EXISTS funding_details text,
ADD COLUMN IF NOT EXISTS bpf_category_c text,
ADD COLUMN IF NOT EXISTS bpf_category_f text,
ADD COLUMN IF NOT EXISTS group_size integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS documents_sent_at timestamptz,
ADD COLUMN IF NOT EXISTS end_pack_sent_at timestamptz,
ADD COLUMN IF NOT EXISTS certificate_level text,
ADD COLUMN IF NOT EXISTS entry_test_id uuid,
ADD COLUMN IF NOT EXISTS exit_test_id uuid,
ADD COLUMN IF NOT EXISTS exit_level text,
ADD COLUMN IF NOT EXISTS progression text;

-- 2. DOCUMENT_SENDINGS - Suivi des documents envoyés
CREATE TABLE IF NOT EXISTS public.document_sendings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inscription_id uuid NOT NULL REFERENCES public.inscriptions(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('CONVENTION', 'PROGRAMME', 'LIVRET', 'REGLEMENT', 'CONVOCATION', 'ATTESTATION_PRESENCE', 'CERTIFICAT', 'FACTURE')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  sent_to text NOT NULL,
  opened_at timestamptz,
  pdf_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.document_sendings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view document_sendings" ON public.document_sendings
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert document_sendings" ON public.document_sendings
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update document_sendings" ON public.document_sendings
  FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete document_sendings" ON public.document_sendings
  FOR DELETE USING (true);

-- 3. CERTIFICATES - Certificats de fin de formation
CREATE TABLE IF NOT EXISTS public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inscription_id uuid NOT NULL REFERENCES public.inscriptions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  level_achieved text NOT NULL,
  attendance_rate decimal,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  pdf_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view certificates" ON public.certificates
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert certificates" ON public.certificates
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update certificates" ON public.certificates
  FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete certificates" ON public.certificates
  FOR DELETE USING (true);

-- 4. SATISFACTION_SURVEYS - Questionnaires satisfaction + test sortie
CREATE TABLE IF NOT EXISTS public.satisfaction_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inscription_id uuid NOT NULL REFERENCES public.inscriptions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  token uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  
  -- Satisfaction scores (1-5)
  satisfaction_content decimal CHECK (satisfaction_content >= 1 AND satisfaction_content <= 5),
  satisfaction_animation decimal CHECK (satisfaction_animation >= 1 AND satisfaction_animation <= 5),
  satisfaction_duration decimal CHECK (satisfaction_duration >= 1 AND satisfaction_duration <= 5),
  satisfaction_utility decimal CHECK (satisfaction_utility >= 1 AND satisfaction_utility <= 5),
  satisfaction_materials decimal CHECK (satisfaction_materials >= 1 AND satisfaction_materials <= 5),
  satisfaction_organization decimal CHECK (satisfaction_organization >= 1 AND satisfaction_organization <= 5),
  satisfaction_expectations decimal CHECK (satisfaction_expectations >= 1 AND satisfaction_expectations <= 5),
  
  strong_points text,
  weak_points text,
  exit_test_scores jsonb DEFAULT '{}',
  
  completed_at timestamptz,
  reminder_1_sent_at timestamptz,
  reminder_2_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.satisfaction_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view satisfaction_surveys by token" ON public.satisfaction_surveys
  FOR SELECT USING (true);
CREATE POLICY "Anyone can insert satisfaction_surveys" ON public.satisfaction_surveys
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update satisfaction_surveys" ON public.satisfaction_surveys
  FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete satisfaction_surveys" ON public.satisfaction_surveys
  FOR DELETE USING (true);

-- 5. CONTINUOUS_IMPROVEMENT - Veille et amélioration continue
CREATE TABLE IF NOT EXISTS public.continuous_improvement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('VEILLE_PEDAGOGIQUE', 'VEILLE_REGLEMENTAIRE', 'VEILLE_FINANCIERE', 'AMELIORATION', 'RECLAMATION')),
  source text,
  theme text,
  problem text,
  action text NOT NULL,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  status text NOT NULL DEFAULT 'EN_COURS' CHECK (status IN ('EN_COURS', 'A_SURVEILLER', 'TERMINE')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.continuous_improvement ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view continuous_improvement" ON public.continuous_improvement
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert continuous_improvement" ON public.continuous_improvement
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update continuous_improvement" ON public.continuous_improvement
  FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete continuous_improvement" ON public.continuous_improvement
  FOR DELETE USING (true);

-- Trigger updated_at
CREATE TRIGGER update_continuous_improvement_updated_at
  BEFORE UPDATE ON public.continuous_improvement
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. INSTRUCTORS - Nouveaux champs (profil enrichi)
ALTER TABLE public.instructors 
ADD COLUMN IF NOT EXISTS specialties text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS specialty_details text,
ADD COLUMN IF NOT EXISTS geographic_zones text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS status text DEFAULT 'ACTIF' CHECK (status IN ('ACTIF', 'INACTIF', 'A_EVITER')),
ADD COLUMN IF NOT EXISTS status_notes text,
ADD COLUMN IF NOT EXISTS hourly_rate decimal,
ADD COLUMN IF NOT EXISTS siret text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS postal_code text,
ADD COLUMN IF NOT EXISTS city text;

-- 7. INSTRUCTOR_AVAILABILITIES - Modification pour disponibilités par date
ALTER TABLE public.instructor_availabilities 
ADD COLUMN IF NOT EXISTS date date,
ADD COLUMN IF NOT EXISTS availability_status text DEFAULT 'DISPONIBLE' CHECK (availability_status IN ('DISPONIBLE', 'INDISPONIBLE', 'PEUT_ETRE')),
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS created_by text DEFAULT 'PAULA' CHECK (created_by IN ('INSTRUCTOR', 'PAULA'));

-- 8. AVAILABILITY_REQUESTS - Demande "Qui est dispo ?"
CREATE TABLE IF NOT EXISTS public.availability_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language text NOT NULL,
  zone text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  message text,
  sent_at timestamptz,
  instructors_contacted uuid[] DEFAULT '{}',
  assigned_instructor_id uuid REFERENCES public.instructors(id),
  status text NOT NULL DEFAULT 'OUVERTE' CHECK (status IN ('OUVERTE', 'ASSIGNEE', 'ANNULEE')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.availability_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view availability_requests" ON public.availability_requests
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert availability_requests" ON public.availability_requests
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update availability_requests" ON public.availability_requests
  FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete availability_requests" ON public.availability_requests
  FOR DELETE USING (true);

-- 9. INSTRUCTOR_CONTRACTS - Contrats formateurs
CREATE TABLE IF NOT EXISTS public.instructor_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  inscription_id uuid REFERENCES public.inscriptions(id) ON DELETE SET NULL,
  contract_number text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_hours decimal NOT NULL,
  hourly_rate decimal NOT NULL,
  total_amount decimal NOT NULL,
  location text,
  student_or_company text,
  generated_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  signed_at timestamptz,
  signature_token uuid UNIQUE DEFAULT gen_random_uuid(),
  signature_data text,
  pdf_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.instructor_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view instructor_contracts" ON public.instructor_contracts
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert instructor_contracts" ON public.instructor_contracts
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update instructor_contracts" ON public.instructor_contracts
  FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete instructor_contracts" ON public.instructor_contracts
  FOR DELETE USING (true);
CREATE POLICY "Anyone can view contracts by token" ON public.instructor_contracts
  FOR SELECT USING (true);
CREATE POLICY "Anyone can update contracts for signature" ON public.instructor_contracts
  FOR UPDATE USING (true);

-- Fonction génération numéro contrat
CREATE OR REPLACE FUNCTION public.generate_contract_number()
RETURNS TRIGGER AS $$
DECLARE
  year_suffix TEXT;
  sequence_num INTEGER;
BEGIN
  year_suffix := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(contract_number FROM 5) AS INTEGER)
  ), 0) + 1
  INTO sequence_num
  FROM public.instructor_contracts
  WHERE contract_number LIKE 'CTR-' || year_suffix || '%';
  NEW.contract_number := 'CTR-' || year_suffix || '-' || LPAD(sequence_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_contract_number
  BEFORE INSERT ON public.instructor_contracts
  FOR EACH ROW
  WHEN (NEW.contract_number IS NULL)
  EXECUTE FUNCTION public.generate_contract_number();

-- 10. PAYMENTS - Nouveaux champs gestion chèques
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS cheque_number text,
ADD COLUMN IF NOT EXISTS cheque_bank text,
ADD COLUMN IF NOT EXISTS cheque_date date,
ADD COLUMN IF NOT EXISTS cheque_deposit_date date,
ADD COLUMN IF NOT EXISTS cheque_deposited boolean DEFAULT false;

-- 11. SCHEDULED_REMINDERS - Rappels automatiques
CREATE TABLE IF NOT EXISTS public.scheduled_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('QUESTIONNAIRE', 'PAIEMENT', 'VEILLE', 'CHEQUE', 'DOCUMENT')),
  related_id uuid NOT NULL,
  related_table text NOT NULL,
  scheduled_for timestamptz NOT NULL,
  sent_at timestamptz,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'CANCELLED')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.scheduled_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view scheduled_reminders" ON public.scheduled_reminders
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert scheduled_reminders" ON public.scheduled_reminders
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update scheduled_reminders" ON public.scheduled_reminders
  FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete scheduled_reminders" ON public.scheduled_reminders
  FOR DELETE USING (true);

-- 12. PROSPECTS - CRM simple (pour plus tard)
CREATE TABLE IF NOT EXISTS public.prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  type text CHECK (type IN ('INDIVIDUEL', 'ESF', 'ENTREPRISE')),
  source text CHECK (source IN ('SALON', 'SITE_WEB', 'RECOMMANDATION', 'AUTRE')),
  first_contact_date date DEFAULT CURRENT_DATE,
  notes text,
  status text NOT NULL DEFAULT 'NOUVEAU' CHECK (status IN ('NOUVEAU', 'CONTACTE', 'EN_ATTENTE', 'CONVERTI', 'PERDU')),
  next_action_date date,
  next_action_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view prospects" ON public.prospects
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert prospects" ON public.prospects
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update prospects" ON public.prospects
  FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete prospects" ON public.prospects
  FOR DELETE USING (true);

CREATE TRIGGER update_prospects_updated_at
  BEFORE UPDATE ON public.prospects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 13. APP_SETTINGS - Configuration application (saisons, etc.)
CREATE TABLE IF NOT EXISTS public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view app_settings" ON public.app_settings
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage app_settings" ON public.app_settings
  FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();