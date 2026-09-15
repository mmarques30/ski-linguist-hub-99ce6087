-- C.6 — vue test_bookings_complete : notes, CECRL, entreprise, station (export DSF).
-- Journal : audit_log.action = c6_xlsx_dsf. Aucune donnée personnelle.

DROP VIEW IF EXISTS public.test_bookings_complete;
CREATE VIEW public.test_bookings_complete
WITH (security_invoker = true)
AS
SELECT
  tb.id,
  tb.candidate_id,
  tb.instructor_id,
  tb.language,
  tb.datetime,
  tb.status,
  tb.payment_type,
  tb.stripe_payment_id,
  tb.google_meet_link,
  tb.google_event_id,
  tb.previous_test,
  tb.previous_result,
  tb.source,
  tb.created_at,
  tc.name AS candidate_name,
  tc.email AS candidate_email,
  tc.phone AS candidate_phone,
  tc.profession AS candidate_profession,
  tc.photo_face_url AS candidate_photo,
  tc.ski_discipline AS candidate_ski_discipline,
  tc.training_cycle AS candidate_training_cycle,
  tc.student_id,
  ss.name AS ski_school_name,
  ss.id AS ski_school_id,
  ss.station AS station,
  CONCAT(i.first_name, ' ', i.last_name) AS instructor_name,
  i.email AS instructor_email,
  te.id AS evaluation_id,
  te.score_general,
  te.score_comprehension,
  te.score_expression,
  te.score_structure,
  te.score_technique,
  te.score_conversation,
  te.cecrl_label,
  te.attestation_url,
  te.attestation_sent_at,
  tb.sponsor_type,
  tb.sponsor_id,
  p.name AS partner_name,
  CASE
    WHEN tb.sponsor_type = 'dsf' THEN COALESCE(p.name, ss.name)
    ELSE ss.name
  END AS company_name,
  te.status AS evaluation_status,
  te.pdf_url,
  te.pdf_generated_at,
  te.sent_at,
  te.verified_at
FROM public.test_bookings tb
LEFT JOIN public.test_candidates tc ON tb.candidate_id = tc.id
LEFT JOIN public.ski_schools ss ON tc.ski_school_id = ss.id
LEFT JOIN public.instructors i ON tb.instructor_id = i.id
LEFT JOIN public.test_evaluations te ON tb.id = te.booking_id
LEFT JOIN public.partners p ON p.id = tb.sponsor_id;

ALTER VIEW public.test_bookings_complete SET (security_invoker = true);
GRANT SELECT ON public.test_bookings_complete TO authenticated;

COMMENT ON VIEW public.test_bookings_complete IS
  'Liste évaluations (security_invoker). C.6 : notes, cecrl_label, company_name, station, partner_name.';

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'c6_xlsx_dsf',
  'test_bookings_complete',
  jsonb_build_object(
    'migration', '20260914190000_c6_xlsx_dsf',
    'point', 'C.6',
    'view', 'test_bookings_complete',
    'export', 'xlsx DSF staff',
    'filters', jsonb_build_array(
      'periode', 'entreprise', 'station', 'langue', 'evaluateur', 'statut'
    )
  )
);
