-- Point 10 / BL-019 — horaires FLI exacts
--
-- 675 inscriptions importées portent un horaire dont les lettres accentuées
-- ont été perdues à l'import : « de 8h30 à 12h30 » est stocké « de 8h30 ·
-- 12h30 » avec, à la place du « à », l'octet de contrôle U+0088. On lit donc à
-- l'écran « de 8h30  12h30 », « Le planning sera tabli directement avec le
-- formateur. » ou « Planning  dfinir ».
--
-- Diagnostic : le fichier source était encodé en Mac OS Roman et a été relu
-- comme du Latin-1. Les octets 0x80–0x9F de Mac OS Roman, qui portent les
-- accents, sont devenus les caractères de contrôle U+0080–U+009F, invisibles.
-- La correspondance est bijective, donc la réparation est déterministe :
-- U+0088 → à, U+008E → é, etc.
--
-- La migration journalise chaque valeur avant / après dans audit_log, puis
-- corrige. Aucune autre colonne n'est touchée : la réparation des
-- entry_level a été faite au point BL-002, et les autres colonnes texte ne
-- présentent pas ce défaut.

CREATE OR REPLACE FUNCTION public.restaurer_accents_macroman(_texte text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN _texte IS NULL THEN NULL
    ELSE regexp_replace(
      translate(
        -- Une ligne cumule deux corruptions successives (U+008E U+0082 pour un
        -- seul « é ») : on la ramène d'abord au cas général.
        replace(_texte, chr(142) || chr(130), 'é'),
        chr(128) || chr(129) || chr(130) || chr(131) || chr(132) || chr(133) ||
        chr(134) || chr(135) || chr(136) || chr(137) || chr(138) || chr(139) ||
        chr(140) || chr(141) || chr(142) || chr(143) || chr(144) || chr(145) ||
        chr(146) || chr(147) || chr(148) || chr(149) || chr(150) || chr(151) ||
        chr(152) || chr(153) || chr(154) || chr(155) || chr(156) || chr(157) ||
        chr(158) || chr(159),
        'ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü'
      ),
      '[\u0080-\u009F]', '', 'g'
    )
  END;
$$;

COMMENT ON FUNCTION public.restaurer_accents_macroman(text) IS
  'Restaure les lettres accentuées d''un texte Mac OS Roman relu comme du Latin-1 (les octets 0x80-0x9F sont devenus des caractères de contrôle invisibles).';

-- Relevé avant correction : une ligne par valeur distincte, avec son effectif.
INSERT INTO public.audit_log (action, table_name, new_values)
SELECT
  'point10_horaires_fli_exacts',
  'inscriptions',
  jsonb_build_object(
    'migration', '20260915141000_point10_horaires_fli_exacts',
    'colonne', 'schedule',
    'lignes_corrigees', coalesce((
      SELECT sum(n) FROM (
        SELECT count(*) AS n FROM public.inscriptions
        WHERE schedule ~ '[\u0080-\u009F]'
      ) t
    ), 0),
    'valeurs', coalesce((
      SELECT jsonb_agg(
               jsonb_build_object('avant', ancien, 'apres', nouveau, 'lignes', n)
               ORDER BY n DESC, ancien
             )
      FROM (
        SELECT schedule AS ancien,
               public.restaurer_accents_macroman(schedule) AS nouveau,
               count(*) AS n
        FROM public.inscriptions
        WHERE schedule ~ '[\u0080-\u009F]'
        GROUP BY 1, 2
      ) v
    ), '[]'::jsonb)
  );

UPDATE public.inscriptions
   SET schedule = public.restaurer_accents_macroman(schedule)
 WHERE schedule ~ '[\u0080-\u009F]';

-- Contrôle : plus aucun caractère de contrôle ne doit subsister.
DO $$
DECLARE
  restants integer;
BEGIN
  SELECT count(*) INTO restants
  FROM public.inscriptions
  WHERE schedule ~ '[\u0080-\u009F]';

  IF restants > 0 THEN
    RAISE EXCEPTION 'Réparation incomplète : % horaires portent encore un caractère de contrôle', restants;
  END IF;
END $$;
