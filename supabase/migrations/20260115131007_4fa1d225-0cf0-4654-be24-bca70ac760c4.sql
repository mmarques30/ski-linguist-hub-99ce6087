-- Add payment_type column
ALTER TABLE public.invoices 
ADD COLUMN payment_type text NOT NULL DEFAULT 'integral';

-- Add check constraint for valid payment_type values
ALTER TABLE public.invoices 
ADD CONSTRAINT invoices_payment_type_check 
CHECK (payment_type IN ('adiantamento', 'saldo', 'integral'));

-- Add related_invoice_id column (self-reference for linked invoices)
ALTER TABLE public.invoices 
ADD COLUMN related_invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL;