-- Statuts facture : En attente / À relancer (recouvrement manuel Paula)

ALTER TABLE public.invoices
  DROP CONSTRAINT IF EXISTS invoices_status_check;

ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_status_check
  CHECK (
    status = ANY (
      ARRAY[
        'draft'::text,
        'sent'::text,
        'en_attente'::text,
        'a_relancer'::text,
        'paid'::text,
        'cancelled'::text,
        'a_verifier'::text
      ]
    )
  );
