-- BL-007 / Pilotage : les 117 factures « sent » de l'import historique
-- (point 9) ne sont pas des créances à relancer sur la plateforme.
-- On les passe en cancelled (pas paid : aucun encaissement inventé).
-- Les crons ignorent déjà origin=import_historique.

UPDATE public.invoices
SET
  status = 'cancelled',
  notes = CASE
    WHEN notes IS NULL OR btrim(notes) = '' THEN
      'Hors périmètre plateforme — import historique point 9, non relancé (BL-007).'
    ELSE
      notes || E'\n---\nHors périmètre plateforme — import historique point 9, non relancé (BL-007).'
  END,
  updated_at = now()
WHERE origin = 'import_historique'
  AND status = 'sent'
  AND due_date IS NOT NULL
  AND due_date < CURRENT_DATE;
