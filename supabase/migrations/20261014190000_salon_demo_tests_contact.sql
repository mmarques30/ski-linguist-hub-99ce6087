-- Salon des directeurs : collecter e-mail + portable (/salon).

ALTER TABLE public.salon_demo_tests
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text;

-- Lignes éventuelles sans contact (tests smoke) : placeholder neutre.
UPDATE public.salon_demo_tests
SET
  email = COALESCE(NULLIF(btrim(email), ''), 'inconnu@fli.fr'),
  phone = COALESCE(NULLIF(btrim(phone), ''), '0000000000')
WHERE email IS NULL OR btrim(email) = '' OR phone IS NULL OR btrim(phone) = '';

ALTER TABLE public.salon_demo_tests
  ALTER COLUMN email SET NOT NULL,
  ALTER COLUMN phone SET NOT NULL;

COMMENT ON COLUMN public.salon_demo_tests.email IS
  'E-mail du directeur / prospect au salon';
COMMENT ON COLUMN public.salon_demo_tests.phone IS
  'Portable du directeur / prospect au salon';

-- Remplace la RPC (nouveaux args obligatoires e-mail + téléphone).
DROP FUNCTION IF EXISTS public.submit_salon_demo_test(
  text, text, text, text, text, text, numeric, integer, integer, jsonb, jsonb
);

CREATE OR REPLACE FUNCTION public.submit_salon_demo_test(
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text,
  p_ski_school_code text,
  p_ski_school_name text,
  p_language text,
  p_determined_level text DEFAULT NULL,
  p_score_percentage numeric DEFAULT NULL,
  p_correct_answers integer DEFAULT NULL,
  p_total_questions integer DEFAULT NULL,
  p_answers jsonb DEFAULT NULL,
  p_summary jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_first text := btrim(COALESCE(p_first_name, ''));
  v_last text := btrim(COALESCE(p_last_name, ''));
  v_email text := lower(btrim(COALESCE(p_email, '')));
  v_phone text := btrim(COALESCE(p_phone, ''));
  v_school_name text := btrim(COALESCE(p_ski_school_name, ''));
  v_school_code text := NULLIF(btrim(COALESCE(p_ski_school_code, '')), '');
  v_language text := btrim(COALESCE(p_language, ''));
  v_dir_name text;
  v_phone_digits text;
BEGIN
  IF v_first = '' OR v_last = '' THEN
    RAISE EXCEPTION 'Nom et prénom obligatoires';
  END IF;
  IF v_email = '' OR position('@' in v_email) = 0 OR position('.' in split_part(v_email, '@', 2)) = 0 THEN
    RAISE EXCEPTION 'E-mail invalide';
  END IF;
  IF char_length(v_email) > 200 THEN
    RAISE EXCEPTION 'E-mail trop long';
  END IF;

  v_phone_digits := regexp_replace(v_phone, '[^0-9+]', '', 'g');
  IF char_length(regexp_replace(v_phone_digits, '[^0-9]', '', 'g')) < 8 THEN
    RAISE EXCEPTION 'Numéro de portable invalide';
  END IF;
  IF char_length(v_phone) > 40 THEN
    RAISE EXCEPTION 'Numéro trop long';
  END IF;

  IF v_school_name = '' THEN
    RAISE EXCEPTION 'École ESF obligatoire';
  END IF;
  IF v_language = '' THEN
    RAISE EXCEPTION 'Langue du test obligatoire';
  END IF;
  IF char_length(v_first) > 80 OR char_length(v_last) > 80 THEN
    RAISE EXCEPTION 'Nom trop long';
  END IF;
  IF char_length(v_school_name) > 200 THEN
    RAISE EXCEPTION 'Nom d''école trop long';
  END IF;

  IF v_school_code IS NOT NULL AND v_school_code <> '__autre__' THEN
    SELECT nom_affiche INTO v_dir_name
    FROM public.ski_school_directory
    WHERE code = v_school_code
      AND reseau = 'ESF'
      AND is_active = true
    LIMIT 1;

    IF v_dir_name IS NULL THEN
      RAISE EXCEPTION 'École ESF inconnue';
    END IF;
    v_school_name := v_dir_name;
  END IF;

  INSERT INTO public.salon_demo_tests (
    first_name,
    last_name,
    email,
    phone,
    ski_network,
    ski_school_code,
    ski_school_name,
    language,
    determined_level,
    score_percentage,
    correct_answers,
    total_questions,
    answers,
    summary,
    source
  ) VALUES (
    v_first,
    v_last,
    v_email,
    v_phone,
    'ESF',
    CASE WHEN v_school_code = '__autre__' THEN NULL ELSE v_school_code END,
    v_school_name,
    v_language,
    NULLIF(btrim(COALESCE(p_determined_level, '')), ''),
    p_score_percentage,
    p_correct_answers,
    p_total_questions,
    p_answers,
    p_summary,
    'salon_directeurs'
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

COMMENT ON FUNCTION public.submit_salon_demo_test(
  text, text, text, text, text, text, text, text, numeric, integer, integer, jsonb, jsonb
) IS
  'Page publique /salon — enregistre un essai test + contact (SECURITY DEFINER).';

GRANT EXECUTE ON FUNCTION public.submit_salon_demo_test(
  text, text, text, text, text, text, text, text, numeric, integer, integer, jsonb, jsonb
) TO anon, authenticated;

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'salon_demo_tests_contact_added',
  'salon_demo_tests',
  jsonb_build_object('migration', '20261014190000_salon_demo_tests_contact')
);
