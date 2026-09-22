-- Factures client « DSF Formation » → client_type = dsf
-- (import historique : nom dans notes, souvent classé stagiaire par erreur)

UPDATE public.invoices
SET
  client_type = 'dsf',
  updated_at = now()
WHERE client_type IS DISTINCT FROM 'dsf'
  AND (
    notes ILIKE 'DSF Formation —%'
    OR notes ILIKE 'DSF Formation –%'
    OR notes ILIKE 'DSF Formation -%'
    OR notes ILIKE 'DSF Formation' || E'\n%'
    OR notes = 'DSF Formation'
  );
