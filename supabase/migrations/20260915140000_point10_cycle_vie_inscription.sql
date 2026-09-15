-- Point 10 — cycle de vie de l'inscription
--
-- Trois constats relevés pendant la recette du 15/09/2026, arrêtée à l'étape 7
-- du guide de test (« Pack de fin ») :
--
-- 1. BLOCAGE. Le pack de fin écrit status = 'terminee' en une seule mise à
--    jour. Le déclencheur trg_validate_inscription_status n'accepte 'terminee'
--    que depuis 'en_cours'. Or une inscription saisie au back-office naît
--    'brouillon' et aucun écran ne permet de la conduire jusqu'à 'en_cours' :
--    la fiche n'expose aucun réglage de statut, et la liste ne propose que
--    en_cours / terminee / annulee, trois cibles illégales depuis 'brouillon'.
--    Le pack échoue donc sur « Transition de statut non autorisée :
--    brouillon → terminee », sans créer ni facture, ni certificat, ni
--    questionnaire. C'est l'échec observé sur FLI-260006.
--
--    Correctif : générer le pack de fin est en soi l'acte de clôture. La mise
--    à jour qui renseigne end_pack_sent_at pour la première fois peut donc
--    porter le statut à 'terminee' depuis n'importe quel statut vivant. Les
--    transitions manuelles, elles, ne changent pas.
--
-- 2. Aucun statut n'avance seul : 6 inscriptions sont 'confirmee' alors que
--    leur date de début est passée. D'où avancer_statuts_inscriptions(), et un
--    job pg_cron créé INACTIF — aucun cron n'est activé sans accord de Paula.
--
-- 3. Ni status ni schedule_status n'ont de contrainte : le déclencheur ne
--    contrôle que les UPDATE, donc un INSERT (import, script) peut écrire
--    n'importe quelle chaîne. Les deux colonnes sont bornées ici ; les données
--    live respectent déjà ces valeurs.

-- ---------------------------------------------------------------------------
-- 1. Bornage des deux colonnes d'état
-- ---------------------------------------------------------------------------

ALTER TABLE public.inscriptions
  DROP CONSTRAINT IF EXISTS inscriptions_status_check;

ALTER TABLE public.inscriptions
  ADD CONSTRAINT inscriptions_status_check
  CHECK (status IN (
    'brouillon', 'en_attente', 'confirmee', 'en_cours',
    'terminee', 'facturee', 'annulee'
  ));

ALTER TABLE public.inscriptions
  DROP CONSTRAINT IF EXISTS inscriptions_schedule_status_check;

ALTER TABLE public.inscriptions
  ADD CONSTRAINT inscriptions_schedule_status_check
  CHECK (schedule_status IN ('pending', 'matin', 'apres-midi'));

-- ---------------------------------------------------------------------------
-- 2. Libellés français, pour que les messages d'erreur soient lisibles
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.libelle_statut_inscription(_statut text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE _statut
    WHEN 'brouillon'  THEN 'Brouillon'
    WHEN 'en_attente' THEN 'En attente'
    WHEN 'confirmee'  THEN 'Confirmée'
    WHEN 'en_cours'   THEN 'En cours'
    WHEN 'terminee'   THEN 'Terminée'
    WHEN 'facturee'   THEN 'Facturée'
    WHEN 'annulee'    THEN 'Annulée'
    ELSE coalesce(_statut, '(vide)')
  END;
$$;

COMMENT ON FUNCTION public.libelle_statut_inscription(text) IS
  'Libellé français d''un statut d''inscription, utilisé dans les messages d''erreur du déclencheur.';

-- ---------------------------------------------------------------------------
-- 3. Déclencheur de transition : clôture par le pack + messages explicites
-- ---------------------------------------------------------------------------

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
  -- end_pack_sent_at pour la première fois. Le pack produit le certificat, la
  -- facture de solde et le questionnaire ; exiger d'abord un passage manuel
  -- par en_attente, confirmee puis en_cours n'apporte rien et bloquait la
  -- clôture des inscriptions saisies au back-office.
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
    WHEN OLD.status = 'en_cours' AND NEW.status = 'terminee' THEN allowed := true;
    WHEN OLD.status = 'terminee' AND NEW.status = 'facturee' THEN allowed := true;
    ELSE allowed := false;
  END CASE;

  IF NOT allowed THEN
    cibles := CASE OLD.status
      WHEN 'brouillon'  THEN 'En attente'
      WHEN 'en_attente' THEN 'Confirmée, Annulée'
      WHEN 'confirmee'  THEN 'En cours, Annulée'
      WHEN 'en_cours'   THEN 'Terminée'
      WHEN 'terminee'   THEN 'Facturée'
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
  'Contrôle les changements de statut d''inscription. Cas particulier : la mise à jour qui renseigne end_pack_sent_at pour la première fois porte le statut à terminee depuis n''importe quel statut vivant (clôture par le pack de fin).';

-- ---------------------------------------------------------------------------
-- 4. Avancement automatique : confirmée → en cours quand la formation a débuté
-- ---------------------------------------------------------------------------

-- Version interne, sans contrôle de rôle : appelée par le job pg_cron, qui
-- s'exécute sans auth.uid(). Elle n'est pas exposée à PostgREST (voir le
-- REVOKE plus bas), donc anon et authenticated ne peuvent pas l'atteindre.
CREATE OR REPLACE FUNCTION public._avancer_statuts_inscriptions(_dry_run boolean DEFAULT true)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  ids uuid[];
  n integer := 0;
  details jsonb := '[]'::jsonb;
BEGIN
  -- Formation réellement en cours : commencée et pas encore finie. Une
  -- inscription restée « Confirmée » alors que sa date de fin est passée n'est
  -- pas « en cours » : elle relève du pack de fin, donc d'une décision, pas
  -- d'un rattrapage automatique. Sur la base live, 3 des 6 inscriptions
  -- confirmées à date de début passée étaient dans ce cas.
  SELECT coalesce(array_agg(id), '{}'::uuid[])
    INTO ids
  FROM public.inscriptions
  WHERE status = 'confirmee'
    AND start_date IS NOT NULL
    AND start_date <= current_date
    AND (end_date IS NULL OR end_date >= current_date);

  n := coalesce(array_length(ids, 1), 0);

  SELECT coalesce(
           jsonb_agg(
             jsonb_build_object('code', code, 'debut', start_date)
             ORDER BY start_date, code
           ),
           '[]'::jsonb
         )
    INTO details
  FROM public.inscriptions
  WHERE id = ANY (ids);

  IF NOT _dry_run AND n > 0 THEN
    UPDATE public.inscriptions
       SET status = 'en_cours'
     WHERE id = ANY (ids);

    INSERT INTO public.audit_log (user_id, action, table_name, new_values)
    VALUES (
      auth.uid(),
      'avancement_statuts_inscriptions',
      'inscriptions',
      jsonb_build_object(
        'transition', 'confirmee -> en_cours',
        'critere', 'formation en cours au ' || current_date::text,
        'nombre', n,
        'inscriptions', details
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'dry_run', _dry_run,
    'transition', 'confirmee -> en_cours',
    'nombre', n,
    'inscriptions', details
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.avancer_statuts_inscriptions(_dry_run boolean DEFAULT true)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Réservé à l''administration';
  END IF;

  RETURN public._avancer_statuts_inscriptions(_dry_run);
END;
$$;

COMMENT ON FUNCTION public.avancer_statuts_inscriptions(boolean) IS
  'Passe en « En cours » les inscriptions confirmées dont la formation est en cours (début atteint, fin non dépassée). Dry-run par défaut ; l''écriture est journalisée dans audit_log.';

REVOKE ALL ON FUNCTION public._avancer_statuts_inscriptions(boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public._avancer_statuts_inscriptions(boolean) FROM anon;
REVOKE ALL ON FUNCTION public._avancer_statuts_inscriptions(boolean) FROM authenticated;

REVOKE ALL ON FUNCTION public.avancer_statuts_inscriptions(boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.avancer_statuts_inscriptions(boolean) FROM anon;
GRANT EXECUTE ON FUNCTION public.avancer_statuts_inscriptions(boolean) TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. Job quotidien, créé INACTIF
-- ---------------------------------------------------------------------------
-- Ce job n'envoie aucun email : il ne fait que rattraper les statuts échus.
-- Il est néanmoins créé inactif, comme les trois crons d'emails du point 8.
-- Tant qu'il dort, le bouton « Passer en cours » de la liste des inscriptions
-- fait le même travail à la demande.

DO $$
DECLARE
  target_jobid bigint;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RAISE NOTICE 'pg_cron absent : job avancer-statuts-inscriptions non créé.';
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'avancer-statuts-inscriptions') THEN
    PERFORM cron.unschedule('avancer-statuts-inscriptions');
  END IF;

  PERFORM cron.schedule(
    'avancer-statuts-inscriptions',
    '30 3 * * *',
    'SELECT public._avancer_statuts_inscriptions(false);'
  );

  SELECT jobid INTO target_jobid FROM cron.job WHERE jobname = 'avancer-statuts-inscriptions';
  PERFORM cron.alter_job(target_jobid, active := false);
END $$;

-- ---------------------------------------------------------------------------
-- 6. Trace
-- ---------------------------------------------------------------------------

INSERT INTO public.audit_log (action, table_name, new_values)
SELECT
  'point10_cycle_vie_inscription',
  'inscriptions',
  jsonb_build_object(
    'migration', '20260915140000_point10_cycle_vie_inscription',
    'cloture_par_pack', 'terminee autorisée depuis brouillon/en_attente/confirmee/en_cours quand end_pack_sent_at passe de NULL à une date',
    'contraintes_ajoutees', jsonb_build_array('inscriptions_status_check', 'inscriptions_schedule_status_check'),
    'a_avancer_maintenant', (
      SELECT count(*) FROM public.inscriptions
      WHERE status = 'confirmee'
        AND start_date IS NOT NULL
        AND start_date <= current_date
        AND (end_date IS NULL OR end_date >= current_date)
    ),
    'cron_avancement_actif', coalesce(
      (SELECT active FROM cron.job WHERE jobname = 'avancer-statuts-inscriptions'),
      false
    )
  );
