-- Point 5 — Gel de la prospection « moniteurs de ski »
--
-- Contexte : la base `ski_monitors` contient 4 047 contacts constitués par
-- reprise de listes externes, dont 1 209 déjà en statut « unsubscribed ».
-- Le gabarit d'email de prospection ne comporte ni lien de désinscription ni
-- mention RGPD (BL-006), et le gabarit n'existe même pas en base : l'envoi
-- retomberait sur le HTML de repli codé en dur dans l'edge function.
-- Décision : gel complet de la prospection jusqu'à nouvel ordre.
--
-- Cette migration :
--   1. gèle en écriture `ski_monitors` et `partners` (RLS + droits + garde-fou) ;
--   2. supprime tout déclencheur et toute tâche planifiée susceptible de lancer
--      un envoi de prospection ;
--   3. désactive le gabarit d'email de prospection ;
--   4. inscrit l'état de gel dans `app_settings` et le journalise.
--
-- Le blocage applicatif de l'edge function `process-intake-outreach` est porté
-- par la variable d'environnement OUTREACH_MONITEURS_ENABLED (absente = gelé).
--
-- Réversible. Script de retour complet dans docs/GEL_PROSPECTION_MONITEURS.md.
-- Aucune réactivation sans validation écrite de la direction, et jamais sans
-- lien de désinscription ni mention RGPD dans chaque email.

-- ---------------------------------------------------------------------------
-- 1. Garde-fou d'écriture
--
--    Les politiques RLS ne protègent que les rôles `anon` et `authenticated` :
--    la clé service-role les contourne. Le déclencheur ci-dessous s'applique
--    à tout appelant, y compris aux edge functions et aux scripts d'import.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.prospection_gelee()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RAISE EXCEPTION
    'Prospection moniteurs gelée (point 5) : la table % est en lecture seule. Réactivation soumise à validation écrite de la direction — voir docs/GEL_PROSPECTION_MONITEURS.md.',
    TG_TABLE_NAME
    USING ERRCODE = 'P0001';
END;
$function$;

DROP TRIGGER IF EXISTS gel_prospection_ski_monitors ON public.ski_monitors;
CREATE TRIGGER gel_prospection_ski_monitors
  BEFORE INSERT OR UPDATE OR DELETE ON public.ski_monitors
  FOR EACH ROW EXECUTE FUNCTION public.prospection_gelee();

DROP TRIGGER IF EXISTS gel_prospection_partners ON public.partners;
CREATE TRIGGER gel_prospection_partners
  BEFORE INSERT OR UPDATE OR DELETE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.prospection_gelee();

-- ---------------------------------------------------------------------------
-- 2. Lecture seule au niveau RLS et au niveau des droits
--
--    La lecture par le staff reste ouverte : le gel interdit d'écrire et
--    d'envoyer, pas de consulter. Le staff doit pouvoir traiter une demande
--    d'accès ou d'effacement, qui passera par une migration tracée.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "rls_ski_monitors_insert" ON public.ski_monitors;
DROP POLICY IF EXISTS "rls_ski_monitors_update" ON public.ski_monitors;
DROP POLICY IF EXISTS "rls_ski_monitors_delete" ON public.ski_monitors;

DROP POLICY IF EXISTS "rls_partners_insert" ON public.partners;
DROP POLICY IF EXISTS "rls_partners_update" ON public.partners;
DROP POLICY IF EXISTS "rls_partners_delete" ON public.partners;

REVOKE INSERT, UPDATE, DELETE ON public.ski_monitors FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.partners FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Suppression de tout déclenchement d'envoi
--
--    Inventaire au moment de la migration : aucune tâche `cron.job` et aucun
--    déclencheur ne visait `process-intake-outreach`. Les deux boucles
--    ci-dessous sont défensives et idempotentes : elles retirent aussi tout
--    déclenchement ajouté hors dépôt (console Supabase).
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  job record;
BEGIN
  IF to_regclass('cron.job') IS NULL THEN
    RETURN;
  END IF;

  FOR job IN
    SELECT jobname FROM cron.job WHERE command ILIKE '%process-intake-outreach%'
  LOOP
    PERFORM cron.unschedule(job.jobname);
    RAISE NOTICE 'Tâche planifiée de prospection retirée : %', job.jobname;
  END LOOP;
END;
$$;

DO $$
DECLARE
  trg record;
BEGIN
  FOR trg IN
    SELECT c.relname AS table_name, t.tgname AS trigger_name
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_proc p ON p.oid = t.tgfoid
    WHERE NOT t.tgisinternal
      AND n.nspname = 'public'
      AND c.relname IN ('ski_monitors', 'partners', 'course_intakes', 'intake_outreach_log')
      AND (
        pg_get_functiondef(p.oid) ILIKE '%process-intake-outreach%'
        OR pg_get_functiondef(p.oid) ILIKE '%net.http_post%'
        OR pg_get_functiondef(p.oid) ILIKE '%resend%'
      )
  LOOP
    EXECUTE format('DROP TRIGGER %I ON public.%I', trg.trigger_name, trg.table_name);
    RAISE NOTICE 'Déclencheur d''envoi retiré : % sur %', trg.trigger_name, trg.table_name;
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. Gabarit d'email de prospection désactivé
--
--    `is_active` n'était lu par aucune fonction : la désactivation vaut ici
--    marquage documentaire, le blocage effectif est porté par les points 1 et 3
--    et par la variable d'environnement.
-- ---------------------------------------------------------------------------

UPDATE public.email_templates
SET is_active = false, updated_at = now()
WHERE slug = 'intake_monitor_outreach';

-- ---------------------------------------------------------------------------
-- 5. État de gel lisible par l'application
-- ---------------------------------------------------------------------------

INSERT INTO public.app_settings (key, value, description)
VALUES (
  'prospection_moniteurs',
  jsonb_build_object(
    'gelee', true,
    'depuis', '2026-09-10',
    'point', 5,
    'variable_env', 'OUTREACH_MONITEURS_ENABLED',
    'conditions_reouverture', jsonb_build_array(
      'validation ecrite de la direction',
      'lien de desinscription dans chaque email',
      'mention RGPD dans chaque email'
    )
  ),
  'Gel de la prospection moniteurs de ski — voir docs/GEL_PROSPECTION_MONITEURS.md'
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = now();

-- ---------------------------------------------------------------------------
-- 6. Journal (aucune donnée personnelle)
-- ---------------------------------------------------------------------------

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'gel_prospection_moniteurs',
  'ski_monitors',
  jsonb_build_object(
    'migration', '20260910150000_gel_prospection_moniteurs',
    'point', 5,
    'backlog', 'BL-006',
    'tables_gelees', jsonb_build_array('ski_monitors', 'partners'),
    'ski_monitors_total', (SELECT count(*) FROM public.ski_monitors),
    'ski_monitors_desinscrits', (SELECT count(*) FROM public.ski_monitors WHERE status = 'unsubscribed'),
    'partners_total', (SELECT count(*) FROM public.partners),
    'campagnes_envoyees_avant_gel', (SELECT count(*) FROM public.intake_outreach_log),
    'variable_env', 'OUTREACH_MONITEURS_ENABLED'
  )
);
