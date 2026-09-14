-- BL-002 — inscriptions.entry_level (et niveau_general_entree) → CECRL.
-- Table validée par Paula le 2026-09-14. Idempotent.
-- Non reconnu → NULL. Jamais un libellé piste.
-- Journal : audit_log.action = entry_level_cecrl (comptages, aucune donnée personnelle).
-- Liste des valeurs non reconnues : hors dépôt (artefacts).

CREATE OR REPLACE FUNCTION public.map_entry_level_to_cecrl(_raw text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $function$
DECLARE
  n text;
BEGIN
  IF _raw IS NULL THEN
    RETURN NULL;
  END IF;

  n := replace(_raw, E'\u008E', 'é');
  n := regexp_replace(n, '\s+', ' ', 'g');
  n := btrim(n);
  n := lower(n);
  n := translate(
    n,
    'àáâäãåèéêëìíîïòóôöõùúûüýÿç',
    'aaaaaaeeeeiiiiooooouuuuyyc'
  );

  IF n = '' THEN
    RETURN NULL;
  END IF;

  IF n ~ '^(a1|a2|b1|b2|c1|c2)\+?$' THEN
    RETURN upper(regexp_replace(n, '\+$', ''));
  END IF;

  IF n IN ('1 - a2', '1-a2') THEN
    RETURN 'A2';
  END IF;
  IF n = 'debutant' THEN
    RETURN 'A1';
  END IF;
  IF n = 'faux debutant' THEN
    RETURN 'A2';
  END IF;
  IF n = 'intermediaire' THEN
    RETURN 'B1';
  END IF;
  IF n IN ('perfeccionement', 'perfectionnement') THEN
    RETURN 'B2';
  END IF;

  RETURN NULL;
END;
$function$;

REVOKE ALL ON FUNCTION public.map_entry_level_to_cecrl(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.map_entry_level_to_cecrl(text) TO authenticated;

COMMENT ON FUNCTION public.map_entry_level_to_cecrl(text) IS
  'BL-002 : normalise entry_level historique vers A1|A2|B1|B2|C1|C2. Non reconnu → NULL.';

CREATE OR REPLACE FUNCTION public.classify_entry_level_source(_raw text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $function$
DECLARE
  n text;
  mapped text;
BEGIN
  IF _raw IS NULL OR btrim(_raw) = '' THEN
    RETURN 'null';
  END IF;

  n := replace(_raw, E'\u008E', 'é');
  n := regexp_replace(n, '\s+', ' ', 'g');
  n := btrim(n);
  n := lower(n);
  n := translate(
    n,
    'àáâäãåèéêëìíîïòóôöõùúûüýÿç',
    'aaaaaaeeeeiiiiooooouuuuyyc'
  );

  mapped := public.map_entry_level_to_cecrl(_raw);
  IF mapped IS NOT NULL THEN
    IF n = 'debutant' THEN RETURN 'debutant'; END IF;
    IF n = 'faux debutant' THEN RETURN 'faux_debutant'; END IF;
    IF n = 'intermediaire' THEN RETURN 'intermediaire'; END IF;
    IF n IN ('perfeccionement', 'perfectionnement') THEN RETURN 'perfectionnement'; END IF;
    IF n IN ('1 - a2', '1-a2') THEN RETURN '1_a2'; END IF;
    RETURN 'already_' || lower(mapped);
  END IF;

  IF n = 'n/a' THEN RETURN 'n_a'; END IF;
  IF n = 'je n''ai jamais ete evalue(e)' THEN RETURN 'jamais_evalue'; END IF;
  IF n = 'je ne connais pas mon niveau' THEN RETURN 'niveau_inconnu'; END IF;
  IF n = 'jamais pratique' THEN RETURN 'jamais_pratique'; END IF;
  RETURN 'phrase_libre';
END;
$function$;

REVOKE ALL ON FUNCTION public.classify_entry_level_source(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.classify_entry_level_source(text) TO authenticated;

-- Dry-run journalisé (comptages seuls) puis écriture. Idempotent.
INSERT INTO public.audit_log (action, table_name, new_values)
SELECT
  'entry_level_cecrl_dry_run',
  'inscriptions',
  jsonb_build_object(
    'point', 'BL-002',
    'migration', '20260914180000_entry_level_cecrl',
    'by_source', coalesce(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'source_key', q.source_key,
            'n', q.n,
            'mapped', q.mapped,
            'cleared', q.cleared,
            'target', q.target
          )
          ORDER BY q.n DESC, q.source_key
        )
        FROM (
          SELECT
            public.classify_entry_level_source(entry_level) AS source_key,
            public.map_entry_level_to_cecrl(entry_level) AS target,
            count(*) AS n,
            count(*) FILTER (
              WHERE entry_level IS DISTINCT FROM public.map_entry_level_to_cecrl(entry_level)
                AND public.map_entry_level_to_cecrl(entry_level) IS NOT NULL
            ) AS mapped,
            count(*) FILTER (
              WHERE entry_level IS NOT NULL
                AND public.map_entry_level_to_cecrl(entry_level) IS NULL
            ) AS cleared
          FROM public.inscriptions
          GROUP BY 1, 2
        ) q
      ),
      '[]'::jsonb
    )
  );

-- Écriture journalisée (idempotente) : une seule UPDATE (deux colonnes).
DO $$
DECLARE
  n_rows integer;
  n_entry integer;
  n_niveau integer;
  counts jsonb;
BEGIN
  WITH planned AS (
    SELECT
      id,
      entry_level AS old_entry,
      niveau_general_entree AS old_niveau,
      public.map_entry_level_to_cecrl(entry_level) AS new_entry,
      CASE
        WHEN niveau_general_entree IS NULL
          THEN public.map_entry_level_to_cecrl(entry_level)
        ELSE public.map_entry_level_to_cecrl(niveau_general_entree)
      END AS new_niveau,
      public.classify_entry_level_source(entry_level) AS source_key
    FROM public.inscriptions
  ),
  changed AS (
    UPDATE public.inscriptions i
    SET
      entry_level = p.new_entry,
      niveau_general_entree = p.new_niveau
    FROM planned p
    WHERE i.id = p.id
      AND (
        i.entry_level IS DISTINCT FROM p.new_entry
        OR i.niveau_general_entree IS DISTINCT FROM p.new_niveau
      )
    RETURNING
      i.id,
      (p.old_entry IS DISTINCT FROM p.new_entry) AS entry_changed,
      (p.old_niveau IS DISTINCT FROM p.new_niveau) AS niveau_changed
  ),
  by_source AS (
    SELECT
      source_key,
      count(*) AS n,
      count(*) FILTER (
        WHERE old_entry IS DISTINCT FROM new_entry AND new_entry IS NOT NULL
      ) AS mapped,
      count(*) FILTER (
        WHERE old_entry IS NOT NULL
          AND old_entry IS DISTINCT FROM new_entry
          AND new_entry IS NULL
      ) AS cleared,
      max(new_entry) FILTER (WHERE new_entry IS NOT NULL) AS target
    FROM planned
    GROUP BY source_key
  )
  SELECT
    (SELECT count(*) FROM changed),
    (SELECT count(*) FILTER (WHERE entry_changed) FROM changed),
    (SELECT count(*) FILTER (WHERE niveau_changed) FROM changed),
    coalesce(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'source_key', source_key,
            'n', n,
            'mapped', mapped,
            'cleared', cleared,
            'target', target
          )
          ORDER BY n DESC, source_key
        )
        FROM by_source
      ),
      '[]'::jsonb
    )
  INTO n_rows, n_entry, n_niveau, counts;

  INSERT INTO public.audit_log (action, table_name, new_values)
  VALUES (
    'entry_level_cecrl',
    'inscriptions',
    jsonb_build_object(
      'migration', '20260914180000_entry_level_cecrl',
      'point', 'BL-002',
      'rule', 'CECRL only; unrecognized → NULL; no piste labels',
      'rows_changed', n_rows,
      'entry_level_rows_changed', n_entry,
      'niveau_general_entree_rows_changed', n_niveau,
      'by_source', counts
    )
  );
END;
$$;

COMMENT ON COLUMN public.inscriptions.entry_level IS
  'DEPRECATED — CECRL (A1–C2) synchronisé depuis niveau_general_entree. BL-002 a normalisé l''historique.';
