
-- 1. Enhance existing payments table
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS inscription_id uuid REFERENCES public.inscriptions(id),
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'recu',
  ADD COLUMN IF NOT EXISTS reference text,
  ADD COLUMN IF NOT EXISTS payer_type text DEFAULT 'stagiaire',
  ADD COLUMN IF NOT EXISTS payer_name text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Migrate existing payment_type values to payer_type where sensible
UPDATE public.payments SET status = 'recu' WHERE status IS NULL OR status = 'recu';

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_payments_inscription_id ON public.payments(inscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments(payment_date);

-- Update trigger for updated_at
DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Create payment_reminders table
CREATE TABLE public.payment_reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  inscription_id uuid NOT NULL REFERENCES public.inscriptions(id) ON DELETE CASCADE,
  reminder_type text NOT NULL DEFAULT 'relance',
  sent_at timestamptz NOT NULL DEFAULT now(),
  sent_via text NOT NULL DEFAULT 'manual',
  response_status text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_reminders
CREATE POLICY "Staff can view payment_reminders"
  ON public.payment_reminders FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Staff can insert payment_reminders"
  ON public.payment_reminders FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Staff can update payment_reminders"
  ON public.payment_reminders FOR UPDATE
  TO authenticated USING (true);

CREATE POLICY "Admin can delete payment_reminders"
  ON public.payment_reminders FOR DELETE
  TO authenticated USING (is_admin());

-- Indexes
CREATE INDEX idx_payment_reminders_inscription ON public.payment_reminders(inscription_id);
CREATE INDEX idx_payment_reminders_payment ON public.payment_reminders(payment_id);
