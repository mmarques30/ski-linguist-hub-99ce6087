-- Bloquant recette — generate_inscription_code lisait la séquence au mauvais offset.
-- Format réel : FLI- + YY + 4 chiffres (séquence = 4 derniers caractères).
-- Réversible : section DOWN en bas.
-- Journal : audit_log.action = inscription_code_fix | inscription_code_trial_cleanup
-- (codes et uuid uniquement, aucune donnée personnelle).

-- 1) Trois inscriptions d'essai hors convention ZZTEST, puis stagiaires orphelins.
DO $$
DECLARE
  trial_codes text[] := ARRAY['FLI-260001', 'FLI-262601', 'FLI-262627'];
  inscription_ids uuid[];
  student_ids uuid[];
BEGIN
  SELECT COALESCE(array_agg(id ORDER BY code), '{}'::uuid[]),
         COALESCE(array_agg(student_id ORDER BY code), '{}'::uuid[])
  INTO inscription_ids, student_ids
  FROM public.inscriptions
  WHERE code = ANY (trial_codes);

  INSERT INTO public.audit_log (action, table_name, new_values)
  VALUES (
    'inscription_code_trial_cleanup',
    'inscriptions',
    jsonb_build_object(
      'codes', to_jsonb(trial_codes),
      'inscription_ids', to_jsonb(inscription_ids),
      'student_ids', to_jsonb(student_ids)
    )
  );

  IF EXISTS (SELECT 1 FROM public.invoices WHERE inscription_id = ANY (inscription_ids)) THEN
    RAISE EXCEPTION 'Refus: facture liée à une inscription d''essai';
  END IF;

  DELETE FROM public.payments
  WHERE inscription_id = ANY (inscription_ids);

  DELETE FROM public.session_enrollments
  WHERE inscription_id = ANY (inscription_ids);

  UPDATE public.inscriptions
  SET entry_test_id = NULL
  WHERE id = ANY (inscription_ids);

  DELETE FROM public.inscriptions
  WHERE id = ANY (inscription_ids);

  DELETE FROM public.students s
  WHERE s.id = ANY (student_ids)
    AND NOT EXISTS (
      SELECT 1 FROM public.inscriptions i WHERE i.student_id = s.id
    );
END;
$$;

-- 2) Fonction : 4 derniers caractères, format strict, boucle anti-collision, séquence.
CREATE OR REPLACE FUNCTION public.generate_inscription_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  year_suffix text;
  seq_name text;
  sequence_num integer;
  seed integer;
  new_code text;
  i integer := 0;
BEGIN
  year_suffix := to_char(now(), 'YY');
  seq_name := 'inscription_code_' || year_suffix;

  IF to_regclass('public.' || seq_name) IS NULL THEN
    SELECT COALESCE(MAX(RIGHT(code, 4)::integer), 0)
    INTO seed
    FROM public.inscriptions
    WHERE code ~ ('^FLI-' || year_suffix || '[0-9]{4}$');

    BEGIN
      EXECUTE format(
        'CREATE SEQUENCE public.%I AS integer INCREMENT BY 1 START WITH %s NO CYCLE',
        seq_name,
        seed + 1
      );
    EXCEPTION
      WHEN duplicate_table THEN
        NULL;
    END;
  END IF;

  LOOP
    i := i + 1;
    IF i > 50 THEN
      RAISE EXCEPTION 'Impossible de générer un code d''inscription unique'
        USING ERRCODE = '23505';
    END IF;

    EXECUTE format('SELECT nextval(%L)', 'public.' || seq_name) INTO sequence_num;

    IF sequence_num < 1 OR sequence_num > 9999 THEN
      RAISE EXCEPTION 'Séquence d''inscription épuisée pour l''année %', year_suffix;
    END IF;

    new_code := 'FLI-' || year_suffix || lpad(sequence_num::text, 4, '0');
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.inscriptions WHERE code = new_code
    );
  END LOOP;

  RETURN new_code;
END;
$function$;

COMMENT ON FUNCTION public.generate_inscription_code() IS
  'FLI-AAnnnn. Séquence = 4 derniers caractères des codes au format strict. Boucle si collision.';

GRANT EXECUTE ON FUNCTION public.generate_inscription_code() TO anon, authenticated, service_role;

-- 3) Séquence 2026 alignée sur le max restant (0 après nettoyage → prochain = 0001).
DO $$
DECLARE
  seed integer;
BEGIN
  SELECT COALESCE(MAX(RIGHT(code, 4)::integer), 0)
  INTO seed
  FROM public.inscriptions
  WHERE code ~ '^FLI-26[0-9]{4}$';

  IF to_regclass('public.inscription_code_26') IS NULL THEN
    EXECUTE format(
      'CREATE SEQUENCE public.inscription_code_26 AS integer INCREMENT BY 1 START WITH %s NO CYCLE',
      seed + 1
    );
  ELSE
    IF seed = 0 THEN
      PERFORM setval('public.inscription_code_26', 1, false);
    ELSE
      PERFORM setval('public.inscription_code_26', seed, true);
    END IF;
  END IF;
END;
$$;

-- 4) Trigger si le client n'envoie pas de code.
CREATE OR REPLACE FUNCTION public.set_inscription_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.code IS NULL OR btrim(NEW.code) = '' THEN
    NEW.code := public.generate_inscription_code();
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_set_inscription_code ON public.inscriptions;
CREATE TRIGGER trigger_set_inscription_code
  BEFORE INSERT ON public.inscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_inscription_code();

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'inscription_code_fix',
  'inscriptions',
  jsonb_build_object(
    'migration', '20260914160000_inscription_code_sequence',
    'format', 'FLI-AAnnnn',
    'sequence', 'RIGHT(code, 4) + pg sequence + collision loop'
  )
);

-- =============================================================================
-- DOWN (réversible — ne pas exécuter en prod sans validation Paula)
-- Restaure la lecture SUBSTRING(code FROM 5 FOR 4) et retire la séquence 2026.
-- Ne recrée pas les trois inscriptions d'essai.
-- =============================================================================
-- DROP TRIGGER IF EXISTS trigger_set_inscription_code ON public.inscriptions;
-- DROP FUNCTION IF EXISTS public.set_inscription_code();
-- DROP SEQUENCE IF EXISTS public.inscription_code_26;
-- CREATE OR REPLACE FUNCTION public.generate_inscription_code()
-- RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
-- DECLARE year_suffix TEXT; sequence_num INTEGER; new_code TEXT;
-- BEGIN
--   year_suffix := TO_CHAR(NOW(), 'YY');
--   SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 5 FOR 4) AS INTEGER)), 0) + 1
--     INTO sequence_num FROM public.inscriptions
--     WHERE code LIKE 'FLI-' || year_suffix || '%';
--   new_code := 'FLI-' || year_suffix || LPAD(sequence_num::TEXT, 4, '0');
--   RETURN new_code;
-- END; $$;
