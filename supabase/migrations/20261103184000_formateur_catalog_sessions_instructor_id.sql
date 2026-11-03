-- Rattache le catalogue /register aux fiches formateurs pour l'espace formateur
-- (sessions visibles même sans inscrits).

ALTER TABLE public.registration_offerings
  ADD COLUMN IF NOT EXISTS instructor_id uuid REFERENCES public.instructors(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_registration_offerings_instructor_id
  ON public.registration_offerings (instructor_id)
  WHERE instructor_id IS NOT NULL;

COMMENT ON COLUMN public.registration_offerings.instructor_id IS
  'Formateur·trice affecté·e à la session catalogue (espace formateur, même sans inscrits)';

-- Backfill : libellé catalogue ↔ prénom+nom (ordre libre) ou prénom / nom seul.
UPDATE public.registration_offerings AS ro
SET instructor_id = matched.instructor_id,
    updated_at = now()
FROM (
  SELECT DISTINCT ON (ro.id)
    ro.id AS offering_id,
    i.id AS instructor_id
  FROM public.registration_offerings ro
  JOIN public.instructors i
    ON ro.instructor_label IS NOT NULL
   AND length(trim(ro.instructor_label)) > 0
   AND (
     lower(trim(ro.instructor_label)) = lower(trim(concat_ws(' ', i.first_name, i.last_name)))
     OR lower(trim(ro.instructor_label)) = lower(trim(concat_ws(' ', i.last_name, i.first_name)))
     OR (
       position(' ' in trim(ro.instructor_label)) = 0
       AND (
         lower(trim(ro.instructor_label)) = lower(trim(i.first_name))
         OR lower(trim(ro.instructor_label)) = lower(trim(i.last_name))
       )
     )
   )
  WHERE ro.instructor_id IS NULL
  ORDER BY ro.id, i.is_active DESC NULLS LAST, i.updated_at DESC NULLS LAST
) AS matched
WHERE ro.id = matched.offering_id
  AND ro.instructor_id IS NULL;

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'formateur_catalog_sessions_instructor_id',
  'registration_offerings',
  jsonb_build_object(
    'migration', '20261103184000_formateur_catalog_sessions_instructor_id',
    'linked', (
      SELECT count(*)::int
      FROM public.registration_offerings
      WHERE instructor_id IS NOT NULL
    )
  )
);
