
-- Replace the before_invoice_insert function with new FLI-YYYY-NNNN format
CREATE OR REPLACE FUNCTION public.before_invoice_insert()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE
  yr TEXT;
  max_seq INTEGER;
BEGIN
  IF NEW.invoice_number IS NULL THEN
    yr := TO_CHAR(NEW.invoice_date, 'YYYY');
    NEW.fiscal_year := yr;

    SELECT COALESCE(MAX(
      CAST(SUBSTRING(invoice_number FROM 10 FOR 4) AS INTEGER)
    ), 0)
    INTO max_seq
    FROM public.invoices
    WHERE invoice_number LIKE 'FLI-' || yr || '-%';

    NEW.sequence_number := max_seq + 1;
    NEW.invoice_number := 'FLI-' || yr || '-' || LPAD(NEW.sequence_number::TEXT, 4, '0');
  END IF;

  -- TVA selon type
  NEW.tva_rate := CASE NEW.invoice_type
    WHEN 'formation' THEN 0 ELSE 20
  END;

  NEW.due_date := COALESCE(NEW.due_date, NEW.invoice_date + INTERVAL '30 days');

  RETURN NEW;
END;
$$;

-- Ensure the trigger exists on the invoices table
DROP TRIGGER IF EXISTS trigger_before_invoice_insert ON public.invoices;
CREATE TRIGGER trigger_before_invoice_insert
  BEFORE INSERT ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.before_invoice_insert();

-- Add unique constraint on invoice_number
ALTER TABLE public.invoices ADD CONSTRAINT invoices_invoice_number_unique UNIQUE (invoice_number);
