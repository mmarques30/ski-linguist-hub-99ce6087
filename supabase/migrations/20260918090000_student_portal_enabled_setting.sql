-- Portail stagiaire : activation via app_settings (remplace la constante hardcodée).

INSERT INTO public.app_settings (key, value, description)
VALUES (
  'student_portal_enabled',
  'false'::jsonb,
  'Active les invitations au portail stagiaire (magic link). Désactivé par défaut.'
)
ON CONFLICT (key) DO NOTHING;
