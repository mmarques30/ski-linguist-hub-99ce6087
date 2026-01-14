-- Create payments table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_type TEXT NOT NULL DEFAULT 'total' CHECK (payment_type IN ('acompte', 'partial', 'total')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('stripe', 'virement', 'cheque', 'especes', 'cb')),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view payments"
ON public.payments FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert payments"
ON public.payments FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update payments"
ON public.payments FOR UPDATE
USING (true);

-- Function to update invoice status when fully paid
CREATE OR REPLACE FUNCTION public.check_invoice_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  total_paid NUMERIC;
  invoice_total NUMERIC;
BEGIN
  -- Get total paid for this invoice
  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM public.payments
  WHERE invoice_id = NEW.invoice_id;
  
  -- Get invoice total
  SELECT COALESCE(amount_ttc, amount_ht) INTO invoice_total
  FROM public.invoices
  WHERE id = NEW.invoice_id;
  
  -- Update invoice status if fully paid
  IF total_paid >= invoice_total THEN
    UPDATE public.invoices
    SET status = 'paid', payment_date = NEW.payment_date
    WHERE id = NEW.invoice_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger to auto-update invoice status
CREATE TRIGGER trigger_check_invoice_payment
AFTER INSERT ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.check_invoice_payment_status();