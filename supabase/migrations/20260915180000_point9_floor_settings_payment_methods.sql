-- Point 9 — le plancher de séquence se lit dans app_settings (modifiable /settings).
-- Statuts facture a_verifier, moyens historique/organisme, cheque_status.

INSERT INTO public.app_settings (key, value, description)
VALUES (
  'invoice_sequence_floor',
  '14302'::jsonb,
  'Plancher de séquence facture ; modifiable dans /settings. 0 = désactivé.'
)
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.before_invoice_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  max_seq integer;
  parsed_seq integer;
  floor_seq integer := 0;
BEGIN
  IF NEW.invoice_type = 'formation' THEN
    NEW.tva_rate := 0;
  ELSIF NEW.invoice_type IN ('test', 'soustraitance') THEN
    NEW.tva_rate := 20;
  ELSE
    RAISE EXCEPTION 'Type de facture invalide : % (attendu formation|test|soustraitance)', NEW.invoice_type;
  END IF;

  IF NEW.fiscal_year IS NULL THEN
    NEW.fiscal_year := public.get_fiscal_year(NEW.invoice_date);
  END IF;

  BEGIN
    SELECT COALESCE((value #>> '{}')::integer, 0) INTO floor_seq
    FROM public.app_settings WHERE key = 'invoice_sequence_floor';
  EXCEPTION WHEN OTHERS THEN
    floor_seq := 0;
  END;

  IF NEW.invoice_number IS NULL THEN
    SELECT GREATEST(COALESCE(MAX(sequence_number), 0), COALESCE(floor_seq, 0))
      INTO max_seq
      FROM public.invoices;
    NEW.sequence_number := max_seq + 1;
    NEW.invoice_number := NEW.fiscal_year || '.' || NEW.sequence_number::text;
  ELSE
    IF NEW.sequence_number IS NULL AND NEW.invoice_number ~ '^[0-9]{2}-[0-9]{2}\.[0-9]+$' THEN
      parsed_seq := substring(NEW.invoice_number from '[0-9]+$')::integer;
      NEW.sequence_number := parsed_seq;
    END IF;
  END IF;

  NEW.due_date := COALESCE(NEW.due_date, NEW.invoice_date + INTERVAL '30 days');
  RETURN NEW;
END;
$function$;

ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_status_check;
ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_status_check
  CHECK (status = ANY (ARRAY['draft'::text, 'sent'::text, 'paid'::text, 'cancelled'::text, 'a_verifier'::text]));

ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_payment_method_check;
ALTER TABLE public.payments
  ADD CONSTRAINT payments_payment_method_check
  CHECK (payment_method = ANY (ARRAY['stripe'::text, 'virement'::text, 'cheque'::text, 'especes'::text, 'cb'::text, 'organisme'::text, 'historique'::text]));

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS cheque_status text;
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_cheque_status_check;
ALTER TABLE public.payments
  ADD CONSTRAINT payments_cheque_status_check
  CHECK (cheque_status IS NULL OR cheque_status = ANY (ARRAY['recu'::text, 'remis'::text, 'encaisse'::text, 'rejete'::text]));

COMMENT ON FUNCTION public.before_invoice_insert() IS
  'Numérotation FLI {exercice}.{séquence} ; plancher lu dans app_settings.invoice_sequence_floor (0 = off) ; Fact FLI fourni conservé.';
