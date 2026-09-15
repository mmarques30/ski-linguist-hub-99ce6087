-- Point 9 — le CSV de facturation s'arrête à 26-27.14302.
-- Tant que ces numéros d'origine ne sont pas en base, une facture créée dans
-- l'app recevrait 14298 (ancien plancher 14297) et entrerait en collision.
-- Après l'import, MAX(sequence_number) = 14302 : GREATEST(max, 14302) est
-- identique à max.

CREATE OR REPLACE FUNCTION public.before_invoice_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  max_seq integer;
  parsed_seq integer;
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

  IF NEW.invoice_number IS NULL THEN
    SELECT GREATEST(COALESCE(MAX(sequence_number), 0), 14302)
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

COMMENT ON FUNCTION public.before_invoice_insert() IS
  'Numérotation FLI {exercice}.{séquence} ; plancher auto GREATEST(max,14302)+1 (redondant après import du CSV 2026-09-15) ; Fact FLI fourni conservé.';
