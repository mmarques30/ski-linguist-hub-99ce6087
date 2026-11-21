-- Paula 2026-11-21 : un foyer peut partager la même adresse mail (ex. Julie & Philippe Vatinel).
-- Plusieurs stagiaires par e-mail autorisés ; unicité = email + prénom + nom (casse ignorée).
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_email_key;

DROP INDEX IF EXISTS public.students_email_key;

CREATE UNIQUE INDEX IF NOT EXISTS students_email_firstname_lastname_uidx
  ON public.students (
    lower(btrim(email)),
    lower(btrim(first_name)),
    lower(btrim(last_name))
  );

CREATE INDEX IF NOT EXISTS idx_students_email ON public.students (email);
