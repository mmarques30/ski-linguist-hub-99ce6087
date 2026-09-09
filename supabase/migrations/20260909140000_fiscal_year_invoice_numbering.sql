-- Point 2 — Exercice fiscal FLI + numérotation {exercice}.{séquence}
-- Réversible : voir section DOWN en bas du fichier (et docs/POINT_2_FISCAL_NUMBERING.md)

-- 1) get_fiscal_year → libellé AA-AA
CREATE OR REPLACE FUNCTION public.get_fiscal_year(invoice_date date)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $function$
DECLARE
  y integer;
BEGIN
  -- Transition : 01/10/2025 → 30/06/2026 → 25-26
  IF invoice_date >= DATE '2025-10-01' AND invoice_date <= DATE '2026-06-30' THEN
    RETURN '25-26';
  END IF;

  -- Avant le 01/10/2025 : exercice 01/10 → 30/09
  IF invoice_date < DATE '2025-10-01' THEN
    IF EXTRACT(MONTH FROM invoice_date) >= 10 THEN
      y := EXTRACT(YEAR FROM invoice_date)::integer;
    ELSE
      y := EXTRACT(YEAR FROM invoice_date)::integer - 1;
    END IF;
    RETURN lpad((y % 100)::text, 2, '0') || '-' || lpad(((y + 1) % 100)::text, 2, '0');
  END IF;

  -- À partir du 01/07/2026 : exercice 01/07 → 30/06
  IF EXTRACT(MONTH FROM invoice_date) >= 7 THEN
    y := EXTRACT(YEAR FROM invoice_date)::integer;
  ELSE
    y := EXTRACT(YEAR FROM invoice_date)::integer - 1;
  END IF;
  RETURN lpad((y % 100)::text, 2, '0') || '-' || lpad(((y + 1) % 100)::text, 2, '0');
END;
$function$;

-- 2) Trigger : numéro = {exercice}.{séquence} ; séquence globale continue
-- Reprise Excel : dernière facture 26-27.14297 → prochaine auto = 14298
CREATE OR REPLACE FUNCTION public.before_invoice_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  max_seq integer;
  parsed_seq integer;
BEGIN
  -- TVA stricte selon type (formation exonérée ; test / sous-traitance 20 %)
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
    -- Plancher Excel 14297 même si des historiques importés ont une séquence plus basse
    SELECT GREATEST(COALESCE(MAX(sequence_number), 0), 14297)
      INTO max_seq
      FROM public.invoices;

    NEW.sequence_number := max_seq + 1;
    NEW.invoice_number := NEW.fiscal_year || '.' || NEW.sequence_number::text;
  ELSE
    -- Import historique : conserver le numéro ; synchroniser sequence_number si possible
    IF NEW.sequence_number IS NULL AND NEW.invoice_number ~ '^[0-9]{2}-[0-9]{2}\.[0-9]+$' THEN
      parsed_seq := substring(NEW.invoice_number from '[0-9]+$')::integer;
      NEW.sequence_number := parsed_seq;
    END IF;
  END IF;

  NEW.due_date := COALESCE(NEW.due_date, NEW.invoice_date + INTERVAL '30 days');

  RETURN NEW;
END;
$function$;

-- S'assurer que le trigger est bien branché
DROP TRIGGER IF EXISTS trigger_before_invoice_insert ON public.invoices;
CREATE TRIGGER trigger_before_invoice_insert
  BEFORE INSERT ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.before_invoice_insert();

COMMENT ON FUNCTION public.get_fiscal_year(date) IS
  'Exercice fiscal FLI AA-AA. Transition 2025-10-01..2026-06-30 = 25-26 ; avant = oct-sep ; après 2026-07-01 = juil-juin.';

COMMENT ON FUNCTION public.before_invoice_insert() IS
  'Numérotation FLI {exercice}.{séquence} globale continue ; reprise après Excel 14297 → prochaine 14298.';

-- =============================================================================
-- DOWN (réversible — ne pas exécuter en prod sans validation)
-- Restaure le comportement antérieur (année civile + FLI-YYYY-NNNN)
-- =============================================================================
-- CREATE OR REPLACE FUNCTION public.get_fiscal_year(invoice_date date)
-- RETURNS text LANGUAGE plpgsql SET search_path TO 'public' AS $$
-- BEGIN RETURN TO_CHAR(invoice_date, 'YYYY'); END; $$;
--
-- CREATE OR REPLACE FUNCTION public.before_invoice_insert()
-- RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
-- DECLARE yr TEXT; max_seq INTEGER;
-- BEGIN
--   IF NEW.invoice_number IS NULL THEN
--     yr := TO_CHAR(NEW.invoice_date, 'YYYY');
--     NEW.fiscal_year := yr;
--     SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 10 FOR 4) AS INTEGER)), 0)
--       INTO max_seq FROM public.invoices WHERE invoice_number LIKE 'FLI-' || yr || '-%';
--     NEW.sequence_number := max_seq + 1;
--     NEW.invoice_number := 'FLI-' || yr || '-' || LPAD(NEW.sequence_number::TEXT, 4, '0');
--   END IF;
--   NEW.tva_rate := CASE NEW.invoice_type WHEN 'formation' THEN 0 ELSE 20 END;
--   NEW.due_date := COALESCE(NEW.due_date, NEW.invoice_date + INTERVAL '30 days');
--   RETURN NEW;
-- END; $$;
