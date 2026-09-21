-- Backfill deposit_amount when only balance_after_deposit was written
-- (submit-registration avant redeploy Session 5 / FLI-260009, FLI-260011).
-- deposit = price − balance_after_deposit, uniquement si positif et cohérent.

UPDATE public.inscriptions
SET deposit_amount = price - balance_after_deposit
WHERE deposit_amount IS NULL
  AND balance_after_deposit IS NOT NULL
  AND price IS NOT NULL
  AND price > balance_after_deposit
  AND balance_after_deposit >= 0;
