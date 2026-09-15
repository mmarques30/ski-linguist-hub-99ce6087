-- BL-002, seconde moitié — `placement_tests.determined_level` sur le référentiel CECRL.
--
-- `inscriptions.entry_level` a été normalisé le 14/09 (docs/POINT_ENTRY_LEVEL.md).
-- La même colonne existe côté test de positionnement, où l'import des réponses
-- du formulaire Google a écrit la réponse déclarative brute : « Je n'ai jamais
-- été évalué(e) », « jamais pratiqué », des phrases libres. Le portail stagiaire
-- dérive la piste de cette valeur (`studentFacingPisteFromCecrl`) : tout ce qui
-- n'est pas du CECRL n'y produit aucune piste, et `/tests` l'affiche « ? ».
--
-- Trois écritures : on étend la table de correspondance au préfixe numérique de
-- l'ancien tableur, on conserve la réponse déclarative dans `answers` avant de
-- la retirer de la colonne, et on verrouille la colonne par une contrainte.

-- 1. « 1 - A2 » était traité comme un cas particulier. « 2 - B1 » existe aussi :
--    la règle devient générale, même échelle, même sens.
create or replace function public.map_entry_level_to_cecrl(_raw text)
returns text
language plpgsql
immutable
set search_path to 'public'
as $function$
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

  -- Échelle de l'ancien tableur : « 1 - A2 », « 2 - B1 »…
  IF n ~ '^[0-9]+ ?- ?(a1|a2|b1|b2|c1|c2)\+?$' THEN
    RETURN upper(regexp_replace(regexp_replace(n, '^[0-9]+ ?- ?', ''), '\+$', ''));
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

create or replace function public.classify_entry_level_source(_raw text)
returns text
language plpgsql
immutable
set search_path to 'public'
as $function$
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
    IF n ~ '^[0-9]+ ?- ?(a1|a2|b1|b2|c1|c2)\+?$' THEN RETURN 'prefixe_numerique'; END IF;
    RETURN 'already_' || lower(mapped);
  END IF;

  IF n = 'n/a' THEN RETURN 'n_a'; END IF;
  IF n = 'je n''ai jamais ete evalue(e)' THEN RETURN 'jamais_evalue'; END IF;
  IF n = 'je ne connais pas mon niveau' THEN RETURN 'niveau_inconnu'; END IF;
  IF n = 'jamais pratique' THEN RETURN 'jamais_pratique'; END IF;
  RETURN 'phrase_libre';
END;
$function$;

-- 2. La réponse déclarative reste consultable dans `answers` : on ne perd pas
--    l'information, on la sort d'une colonne qui doit porter du CECRL.
update public.placement_tests
set answers = jsonb_set(
      case when jsonb_typeof(coalesce(answers, '{}'::jsonb)) = 'object'
           then coalesce(answers, '{}'::jsonb)
           else jsonb_build_object('responses', answers) end,
      '{niveau_declare_source}',
      to_jsonb(determined_level)
    )
where determined_level is not null
  and public.map_entry_level_to_cecrl(determined_level) is distinct from determined_level
  and not (answers ? 'niveau_declare_source');

update public.placement_tests
set determined_level = public.map_entry_level_to_cecrl(determined_level)
where determined_level is not null
  and public.map_entry_level_to_cecrl(determined_level) is distinct from determined_level;

-- 3. Verrou : la colonne ne peut plus contenir que du CECRL ou rien. La
--    migration d'origine portait cette contrainte ; elle avait disparu à la
--    recréation de la table, d'où la dérive.
alter table public.placement_tests
  drop constraint if exists placement_tests_determined_level_cecrl;

alter table public.placement_tests
  add constraint placement_tests_determined_level_cecrl
  check (determined_level is null or determined_level in ('A1','A2','B1','B2','C1','C2'));

insert into public.audit_log (action, table_name, new_values)
select 'bl002_determined_level_cecrl', 'placement_tests', jsonb_build_object(
  'point', 'BL-002 seconde moitie',
  'regle', 'meme table de correspondance que inscriptions.entry_level, etendue au prefixe numerique de l ancien tableur',
  'reponse_declarative_conservee', 'answers.niveau_declare_source',
  'contrainte', 'placement_tests_determined_level_cecrl',
  'distribution', (
    select jsonb_object_agg(coalesce(determined_level, 'vide'), n)
    from (select determined_level, count(*) as n from public.placement_tests group by 1) d
  )
);
