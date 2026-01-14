-- Function to get fiscal year from date
CREATE OR REPLACE FUNCTION public.get_fiscal_year(invoice_date DATE)
RETURNS TEXT AS $$
BEGIN
  RETURN TO_CHAR(invoice_date, 'YYYY');
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inscription_id UUID REFERENCES public.inscriptions(id),
  invoice_number TEXT UNIQUE,
  fiscal_year TEXT,
  sequence_number INTEGER,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  invoice_type TEXT NOT NULL DEFAULT 'formation' CHECK (invoice_type IN ('formation', 'test', 'soustraitance')),
  amount_ht NUMERIC NOT NULL DEFAULT 0,
  tva_rate NUMERIC DEFAULT 0,
  amount_ttc NUMERIC GENERATED ALWAYS AS (amount_ht * (1 + tva_rate / 100)) STORED,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'cancelled')),
  payment_date DATE,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Trigger function for auto-generating invoice number
CREATE OR REPLACE FUNCTION public.before_invoice_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL THEN
    NEW.fiscal_year := public.get_fiscal_year(NEW.invoice_date);
    NEW.sequence_number := COALESCE(
      (SELECT MAX(sequence_number) FROM public.invoices), 
      14242
    ) + 1;
    NEW.invoice_number := NEW.fiscal_year || '.' || NEW.sequence_number;
  END IF;
  
  -- TVA selon type
  NEW.tva_rate := CASE NEW.invoice_type
    WHEN 'formation' THEN 0
    ELSE 20
  END;
  
  NEW.due_date := NEW.invoice_date + INTERVAL '30 days';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger
CREATE TRIGGER trigger_before_invoice_insert
BEFORE INSERT ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.before_invoice_insert();

-- Updated_at trigger
CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view invoices"
ON public.invoices FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert invoices"
ON public.invoices FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update invoices"
ON public.invoices FOR UPDATE
USING (true);