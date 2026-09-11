-- Sujet J-10 en français (demande Paula, non bloquant pour C).
-- Remplace « FLI — Validation des horaires (J-10) — … » et l'ancien D-10.

UPDATE public.email_templates
SET
  subject_fr = 'Validation des horaires J-10 — {{total_count}} inscription(s)',
  updated_at = now()
WHERE slug = 'schedule_validation_reminder'
  AND subject_fr IS DISTINCT FROM 'Validation des horaires J-10 — {{total_count}} inscription(s)';
