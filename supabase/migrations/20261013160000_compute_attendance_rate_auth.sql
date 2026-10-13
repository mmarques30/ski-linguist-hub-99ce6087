-- Finding sécurité (scan Lovable) : compute_attendance_rate était SECURITY DEFINER
-- + GRANT authenticated sans garde — tout compte connecté (stagiaire inclus) pouvait
-- lire le taux d'assiduité d'une autre inscription.
-- Usage actuel : EndPackDialog (staff). On autorise staff, ou le stagiaire propriétaire.

CREATE OR REPLACE FUNCTION public.compute_attendance_rate(p_inscription_id uuid)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result numeric;
BEGIN
  IF p_inscription_id IS NULL THEN
    RAISE EXCEPTION 'p_inscription_id requis'
      USING ERRCODE = '22023';
  END IF;

  IF NOT (
    public.is_staff()
    OR (
      public.is_student()
      AND EXISTS (
        SELECT 1
        FROM public.inscriptions i
        WHERE i.id = p_inscription_id
          AND i.student_id = public.get_my_student_id()
      )
    )
    OR (
      public.is_formateur()
      AND EXISTS (
        SELECT 1
        FROM public.attendance_records r
        JOIN public.attendance_slots s ON s.id = r.slot_id
        WHERE r.inscription_id = p_inscription_id
          AND s.instructor_id = public.get_my_instructor_id()
      )
    )
  ) THEN
    RAISE EXCEPTION 'Accès refusé au taux d''assiduité'
      USING ERRCODE = '42501';
  END IF;

  SELECT CASE
    WHEN COUNT(*) FILTER (WHERE r.status IN ('present', 'excuse', 'absent')) = 0 THEN NULL
    ELSE ROUND(
      100.0 * COUNT(*) FILTER (WHERE r.status IN ('present', 'excuse'))
      / COUNT(*) FILTER (WHERE r.status IN ('present', 'excuse', 'absent'))
    , 1)
  END
  INTO result
  FROM public.attendance_records r
  JOIN public.attendance_slots s ON s.id = r.slot_id
  WHERE r.inscription_id = p_inscription_id
    AND s.status = 'admin_validated';

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.compute_attendance_rate(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.compute_attendance_rate(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.compute_attendance_rate(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.compute_attendance_rate(uuid) TO service_role;

COMMENT ON FUNCTION public.compute_attendance_rate(uuid) IS
  'Taux d''assiduité (créneaux admin_validated). Staff, stagiaire propriétaire, ou formateur du créneau.';
