-- BL-027 : propositions de règlement OPCO / financement
-- Payeur et formule librement définis en back-office (cas par cas).

ALTER TABLE public.funding_requests
  ADD COLUMN IF NOT EXISTS payer_type text,
  ADD COLUMN IF NOT EXISTS payment_formula text;

COMMENT ON COLUMN public.funding_requests.payer_type IS
  'BL-027 — payeur de la proposition : stagiaire | entreprise | opco';
COMMENT ON COLUMN public.funding_requests.payment_formula IS
  'BL-027 — formule (stripe_deposit_cheque, virement_full, organisme, custom, none, …)';

CREATE INDEX IF NOT EXISTS funding_requests_inscription_id_idx
  ON public.funding_requests (inscription_id);
