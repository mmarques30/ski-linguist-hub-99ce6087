-- BL-007 — activer les crons email (modèles validés + Resend OK) + producteurs notifs.

-- ---------------------------------------------------------------------------
-- 1. Helper : notifier tous les admins (best-effort)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.notify_admins(
  p_type text,
  p_title text,
  p_message text DEFAULT NULL,
  p_link text DEFAULT NULL
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count integer := 0;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, link)
  SELECT ur.user_id, p_type, p_title, p_message, p_link
  FROM public.user_roles ur
  WHERE ur.role = 'admin';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
EXCEPTION
  WHEN OTHERS THEN
    RETURN 0;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_admins(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.notify_admins(text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_admins(text, text, text, text) TO service_role;

COMMENT ON FUNCTION public.notify_admins(text, text, text, text) IS
  'BL-007 — insère une notification pour chaque admin (best-effort).';

-- ---------------------------------------------------------------------------
-- 2. Demande de test oral → notif admin
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.submit_test_booking_candidate(
  p_name text,
  p_email text,
  p_phone text,
  p_profession text,
  p_profession_autre text,
  p_ski_school_id uuid,
  p_carte_syndicale text,
  p_ski_discipline text,
  p_training_cycle text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_id uuid;
  v_profession text;
  v_discipline text;
  v_cycle text;
BEGIN
  v_profession := nullif(btrim(coalesce(p_profession, '')), '');
  IF v_profession IS NULL OR v_profession NOT IN (
    'moniteur', 'pisteur', 'rm', 'caissier', 'controleur', 'autre'
  ) THEN
    RAISE EXCEPTION 'Profession invalide'
      USING ERRCODE = '23514';
  END IF;
  IF nullif(btrim(coalesce(p_name, '')), '') IS NULL
     OR nullif(btrim(coalesce(p_email, '')), '') IS NULL
     OR nullif(btrim(coalesce(p_phone, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Nom, e-mail et téléphone sont obligatoires'
      USING ERRCODE = '23514';
  END IF;
  IF p_ski_school_id IS NULL THEN
    RAISE EXCEPTION 'École de ski obligatoire'
      USING ERRCODE = '23514';
  END IF;

  v_discipline := nullif(btrim(coalesce(p_ski_discipline, '')), '');
  v_cycle := nullif(btrim(coalesce(p_training_cycle, '')), '');
  IF v_profession = 'moniteur' THEN
    IF v_discipline IS NULL OR v_discipline NOT IN ('alpin', 'nordique') THEN
      RAISE EXCEPTION 'Discipline (alpin / nordique) obligatoire pour un moniteur de ski'
        USING ERRCODE = '23514';
    END IF;
    IF v_cycle IS NULL THEN
      RAISE EXCEPTION 'Cycle de formation obligatoire pour un moniteur de ski'
        USING ERRCODE = '23514';
    END IF;
  ELSE
    v_discipline := NULL;
    v_cycle := NULL;
  END IF;

  INSERT INTO public.test_candidates (
    name,
    email,
    phone,
    profession,
    profession_autre,
    ski_school_id,
    carte_syndicale,
    ski_discipline,
    training_cycle
  ) VALUES (
    btrim(p_name),
    btrim(p_email),
    btrim(p_phone),
    v_profession,
    CASE WHEN v_profession = 'autre' THEN nullif(btrim(coalesce(p_profession_autre, '')), '') ELSE NULL END,
    p_ski_school_id,
    nullif(btrim(coalesce(p_carte_syndicale, '')), ''),
    v_discipline,
    v_cycle
  )
  RETURNING id INTO v_id;

  PERFORM public.notify_admins(
    'test',
    'Nouvelle demande de test oral',
    btrim(p_name) || ' · ' || btrim(p_email),
    '/tests'
  );

  RETURN v_id;
END;
$function$;

-- ---------------------------------------------------------------------------
-- 3. Inscription confirmée / en cours sans formateur → notif
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.trg_notify_inscription_sans_formateur()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.instructor_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.status NOT IN ('confirmee', 'en_cours') THEN
    RETURN NEW;
  END IF;
  -- Ne notifier qu'à l'entrée dans ces statuts, ou si le formateur vient d'être retiré.
  IF TG_OP = 'UPDATE'
     AND OLD.status IS NOT DISTINCT FROM NEW.status
     AND OLD.instructor_id IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM public.notify_admins(
    'inscription',
    'Inscription sans formateur',
    coalesce(NEW.code, NEW.id::text) || ' · statut ' || NEW.status,
    '/inscriptions/' || NEW.id::text
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_inscription_sans_formateur ON public.inscriptions;
CREATE TRIGGER trg_notify_inscription_sans_formateur
  AFTER INSERT OR UPDATE OF status, instructor_id
  ON public.inscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_inscription_sans_formateur();

-- ---------------------------------------------------------------------------
-- 4. Activer les crons email (modèles validés 21/09) + cycle de vie
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  spec record;
  target_jobid bigint;
BEGIN
  FOR spec IN
    SELECT * FROM (VALUES
      ('process-invoice-reminders', true),
      ('process-schedule-reminders', true),
      ('process-survey-reminders', true),
      ('avancer-statuts-inscriptions', true)
    ) AS t(jobname, keep_active)
  LOOP
    SELECT jobid INTO target_jobid FROM cron.job WHERE jobname = spec.jobname;
    IF target_jobid IS NOT NULL THEN
      PERFORM cron.alter_job(target_jobid, active := spec.keep_active);
    END IF;
  END LOOP;
END $$;

INSERT INTO public.audit_log (action, table_name, new_values)
SELECT
  'bl007_crons_notifs',
  'cron.job',
  jsonb_build_object(
    'migration', '20260921140000_bl007_crons_notifs',
    'jobs', (SELECT jsonb_object_agg(jobname, active) FROM cron.job),
    'notify_admins', true,
    'demande_test', true,
    'sans_formateur', true
  );
