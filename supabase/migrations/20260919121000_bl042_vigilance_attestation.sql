-- BL-042 — Attestation de vigilance (formateurs).

ALTER TABLE public.instructors
  ADD COLUMN IF NOT EXISTS vigilance_attestation_url text,
  ADD COLUMN IF NOT EXISTS vigilance_attestation_received_at date,
  ADD COLUMN IF NOT EXISTS vigilance_attestation_expires_at date;
