-- Corrections de statut depuis « En cours » / « Terminée ».
-- Aligné sur src/lib/inscription-status.ts (STATUS_TRANSITIONS).

CREATE OR REPLACE FUNCTION public.validate_inscription_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  allowed boolean := false;
  cibles text;
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Clôture par le pack de fin de formation : la même mise à jour renseigne
  -- end_pack_sent_at pour la première fois.
  IF NEW.status = 'terminee'
     AND OLD.end_pack_sent_at IS NULL
     AND NEW.end_pack_sent_at IS NOT NULL
     AND OLD.status IN ('brouillon', 'en_attente', 'confirmee', 'en_cours')
  THEN
    NEW.status_changed_at := now();
    NEW.status_changed_by := auth.uid();
    RETURN NEW;
  END IF;

  CASE
    WHEN OLD.status = 'brouillon' AND NEW.status = 'en_attente' THEN allowed := true;
    WHEN OLD.status = 'en_attente' AND NEW.status = 'confirmee' THEN allowed := true;
    WHEN OLD.status = 'en_attente' AND NEW.status = 'annulee' THEN allowed := true;
    WHEN OLD.status = 'confirmee' AND NEW.status = 'en_cours' THEN allowed := true;
    WHEN OLD.status = 'confirmee' AND NEW.status = 'annulee' THEN
      IF NEW.start_date > CURRENT_DATE THEN
        allowed := true;
      ELSE
        RAISE EXCEPTION 'Impossible d''annuler une formation dont la date de début est déjà passée (%)', NEW.start_date;
      END IF;
    -- En cours : suite normale + corrections (retour Confirmée, Annulée, Facturée)
    WHEN OLD.status = 'en_cours' AND NEW.status = 'terminee' THEN allowed := true;
    WHEN OLD.status = 'en_cours' AND NEW.status = 'confirmee' THEN allowed := true;
    WHEN OLD.status = 'en_cours' AND NEW.status = 'annulee' THEN allowed := true;
    WHEN OLD.status = 'en_cours' AND NEW.status = 'facturee' THEN allowed := true;
    -- Terminée : facturation + corrections
    WHEN OLD.status = 'terminee' AND NEW.status = 'facturee' THEN allowed := true;
    WHEN OLD.status = 'terminee' AND NEW.status = 'en_cours' THEN allowed := true;
    WHEN OLD.status = 'terminee' AND NEW.status = 'annulee' THEN allowed := true;
    ELSE allowed := false;
  END CASE;

  IF NOT allowed THEN
    cibles := CASE OLD.status
      WHEN 'brouillon'  THEN 'En attente'
      WHEN 'en_attente' THEN 'Confirmée, Annulée'
      WHEN 'confirmee'  THEN 'En cours, Annulée'
      WHEN 'en_cours'   THEN 'Terminée, Confirmée, Annulée, Facturée'
      WHEN 'terminee'   THEN 'Facturée, En cours, Annulée'
      ELSE NULL
    END;

    IF cibles IS NULL THEN
      RAISE EXCEPTION '« % » est un statut final : l''inscription ne peut plus changer d''état.',
        public.libelle_statut_inscription(OLD.status);
    END IF;

    RAISE EXCEPTION 'Passage de « % » à « % » impossible. Depuis « % », les statuts possibles sont : %. Le pack de fin de formation, lui, clôture l''inscription quel que soit son statut.',
      public.libelle_statut_inscription(OLD.status),
      public.libelle_statut_inscription(NEW.status),
      public.libelle_statut_inscription(OLD.status),
      cibles;
  END IF;

  NEW.status_changed_at := now();
  NEW.status_changed_by := auth.uid();

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_inscription_status_transition() IS
  'Contrôle les changements de statut d''inscription. Depuis En cours / Terminée, corrections manuelles (Annulée, Facturée, retour) autorisées. Clôture pack de fin inchangée.';

INSERT INTO public.audit_log (action, table_name, new_values)
SELECT
  'inscription_status_corrections',
  'inscriptions',
  jsonb_build_object(
    'migration', '20260917220000_inscription_status_corrections',
    'en_cours', ARRAY['terminee', 'confirmee', 'annulee', 'facturee'],
    'terminee', ARRAY['facturee', 'en_cours', 'annulee']
  );
