
-- 1. Add audit columns
ALTER TABLE public.inscriptions
  ADD COLUMN IF NOT EXISTS status_changed_at timestamptz,
  ADD COLUMN IF NOT EXISTS status_changed_by uuid;

-- 2. Migrate existing status values
UPDATE public.inscriptions SET status = 'en_cours' WHERE status = 'En cours';
UPDATE public.inscriptions SET status = 'terminee' WHERE status = 'Terminé';
UPDATE public.inscriptions SET status = 'facturee' WHERE status = 'Facturé';
UPDATE public.inscriptions SET status = 'annulee' WHERE status = 'Annulé';
UPDATE public.inscriptions SET status = 'confirmee' WHERE status = 'Confirmé';
UPDATE public.inscriptions SET status = 'en_attente' WHERE status = 'En attente';
UPDATE public.inscriptions SET status = 'brouillon' WHERE status NOT IN ('en_cours', 'terminee', 'facturee', 'annulee', 'confirmee', 'en_attente');

-- 3. Set default for new inscriptions
ALTER TABLE public.inscriptions ALTER COLUMN status SET DEFAULT 'brouillon';

-- 4. Initialize audit columns for existing records
UPDATE public.inscriptions SET status_changed_at = updated_at WHERE status_changed_at IS NULL;

-- 5. Create the state machine validation function
CREATE OR REPLACE FUNCTION public.validate_inscription_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  allowed boolean := false;
BEGIN
  -- Skip if status hasn't changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Check allowed transitions
  CASE
    WHEN OLD.status = 'brouillon' AND NEW.status = 'en_attente' THEN allowed := true;
    WHEN OLD.status = 'en_attente' AND NEW.status = 'confirmee' THEN allowed := true;
    WHEN OLD.status = 'en_attente' AND NEW.status = 'annulee' THEN allowed := true;
    WHEN OLD.status = 'confirmee' AND NEW.status = 'en_cours' THEN allowed := true;
    WHEN OLD.status = 'confirmee' AND NEW.status = 'annulee' THEN
      -- Can only cancel before start date
      IF NEW.start_date > CURRENT_DATE THEN
        allowed := true;
      ELSE
        RAISE EXCEPTION 'Impossible d''annuler une formation dont la date de début est déjà passée (%)' , NEW.start_date;
      END IF;
    WHEN OLD.status = 'en_cours' AND NEW.status = 'terminee' THEN allowed := true;
    WHEN OLD.status = 'terminee' AND NEW.status = 'facturee' THEN allowed := true;
    ELSE allowed := false;
  END CASE;

  IF NOT allowed THEN
    RAISE EXCEPTION 'Transition de statut non autorisée : % → %', OLD.status, NEW.status;
  END IF;

  -- Update audit columns
  NEW.status_changed_at := now();
  NEW.status_changed_by := auth.uid();

  RETURN NEW;
END;
$$;

-- 6. Create the trigger
DROP TRIGGER IF EXISTS trg_validate_inscription_status ON public.inscriptions;
CREATE TRIGGER trg_validate_inscription_status
  BEFORE UPDATE ON public.inscriptions
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.validate_inscription_status_transition();

-- 7. Recreate the view with audit columns
DROP VIEW IF EXISTS public.inscriptions_complete;
CREATE VIEW public.inscriptions_complete AS
SELECT
  i.id,
  i.created_at,
  i.updated_at,
  i.student_id,
  i.instructor_id,
  i.ski_school_id,
  i.modality,
  i.course_type,
  i.max_participants,
  i.language,
  i.certification_type,
  i.course_location,
  i.course_address,
  i.start_date,
  i.end_date,
  i.duration_hours,
  i.duration_days,
  i.hours_per_day,
  i.schedule,
  i.rhythm,
  i.entry_test_score,
  i.entry_level,
  i.group_name,
  i.final_general_level,
  i.final_specific_level,
  i.certification_date,
  i.certification_result,
  i.pedagogical_cost,
  i.price,
  i.payment_method,
  i.deposit_amount,
  i.deposit_date,
  i.check_number,
  i.check_date,
  i.balance_after_deposit,
  i.status,
  i.final_status,
  i.qualiopi_status,
  i.expectations,
  i.observations,
  i.course_materials,
  i.code,
  i.status_changed_at,
  i.status_changed_by,
  (s.first_name || ' ' || s.last_name) AS student_name,
  s.email AS student_email,
  s.phone AS student_phone,
  s.city AS student_city,
  s.company AS student_company,
  (ins.first_name || ' ' || ins.last_name) AS instructor_name,
  ins.email AS instructor_email,
  ins.phone AS instructor_phone,
  sk.name AS ski_school_name,
  sk.director_name AS ski_school_director,
  sk.director_phone AS ski_school_director_phone
FROM inscriptions i
  LEFT JOIN students s ON i.student_id = s.id
  LEFT JOIN instructors ins ON i.instructor_id = ins.id
  LEFT JOIN ski_schools sk ON i.ski_school_id = sk.id;
