-- CTR-YYYY-NNNN : l'ancien SUBSTRING(FROM 5) lisait « 2026-0001 » et cassait le CAST.
CREATE OR REPLACE FUNCTION public.generate_contract_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  year_suffix TEXT;
  sequence_num INTEGER;
BEGIN
  year_suffix := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(contract_number FROM LENGTH('CTR-' || year_suffix || '-') + 1) AS INTEGER)
  ), 0) + 1
  INTO sequence_num
  FROM public.instructor_contracts
  WHERE contract_number LIKE 'CTR-' || year_suffix || '-%';
  NEW.contract_number := 'CTR-' || year_suffix || '-' || LPAD(sequence_num::TEXT, 4, '0');
  RETURN NEW;
END;
$function$;
