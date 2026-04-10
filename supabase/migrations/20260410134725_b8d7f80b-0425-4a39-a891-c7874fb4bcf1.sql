
-- Audit log table
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view audit_log" ON public.audit_log
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can insert audit_log" ON public.audit_log
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admin can delete audit_log" ON public.audit_log
  FOR DELETE TO authenticated USING (is_admin());

CREATE INDEX idx_audit_log_table ON public.audit_log(table_name);
CREATE INDEX idx_audit_log_created ON public.audit_log(created_at DESC);
CREATE INDEX idx_audit_log_record ON public.audit_log(record_id);

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (user_id, action, table_name, record_id, new_values)
    VALUES (auth.uid(), 'create', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (auth.uid(), 'update', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (user_id, action, table_name, record_id, old_values)
    VALUES (auth.uid(), 'delete', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Attach triggers to main tables
CREATE TRIGGER audit_inscriptions AFTER INSERT OR UPDATE OR DELETE ON public.inscriptions
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_students AFTER INSERT OR UPDATE OR DELETE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_invoices AFTER INSERT OR UPDATE OR DELETE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_payments AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_sessions AFTER INSERT OR UPDATE OR DELETE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_satisfaction AFTER INSERT OR UPDATE OR DELETE ON public.satisfaction_surveys
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Qualiopi indicators table
CREATE TABLE public.qualiopi_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  criterion_number integer NOT NULL CHECK (criterion_number BETWEEN 1 AND 7),
  indicator_number text NOT NULL,
  label text NOT NULL,
  current_value numeric,
  target_value numeric,
  unit text DEFAULT '%',
  measurement_date date DEFAULT CURRENT_DATE,
  evidence_type text NOT NULL DEFAULT 'manuel',
  evidence_description text,
  status text NOT NULL DEFAULT 'en_cours',
  season_id uuid REFERENCES public.seasons(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.qualiopi_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view qualiopi_indicators" ON public.qualiopi_indicators
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin can insert qualiopi_indicators" ON public.qualiopi_indicators
  FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "Admin can update qualiopi_indicators" ON public.qualiopi_indicators
  FOR UPDATE TO authenticated USING (is_admin());

CREATE POLICY "Admin can delete qualiopi_indicators" ON public.qualiopi_indicators
  FOR DELETE TO authenticated USING (is_admin());

CREATE TRIGGER set_qualiopi_indicators_updated_at
  BEFORE UPDATE ON public.qualiopi_indicators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
