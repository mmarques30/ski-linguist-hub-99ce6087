-- BL-033 — lot d'import décodé en Mac Roman au lieu d'UTF-8.
--
-- Les octets 0x80–0x9F de la table Mac Roman ont été conservés tels quels comme
-- points de code Unicode. Ils tombent dans la zone de contrôle C1, impossible
-- dans du texte légitime : la correspondance est donc sûre et sans exception
-- (0x8D → ç, 0x8E → é, 0x8F → è, 0x91 → ë, 0x99 → ô, 0x9E → û…).
--
-- Cinq caractères de la zone haute ont survécu à l'identique. Eux demandent un
-- contexte, vérifié occurrence par occurrence sur le jeu réel :
--   « Ë » (0xCB) = « À »              — 13 occurrences, toutes isolées ;
--   « Ð » (0xD0) = « – »              — 41 occurrences, toutes isolées ;
--   « ¡ » (0xA1) = « ° »              — 6 occurrences, toutes dans « N¡1 » ;
--   « Õ » (0xD5) = « ’ »              — seulement entre deux lettres : le
--     pluriel portugais « -ÕES » de la banque de phrases est du texte correct ;
--   « Ê » (0xCA) = espace insécable   — sauf dans « Être » (14) et « Êtes » (1),
--     seuls mots légitimes commençant par Ê dans le jeu. Les espaces multiples
--     ainsi créés sont réduits, et la valeur est retaillée.
--   « æ » (0xE6) = « Ê »              — seulement dans « ætre » (8 occurrences),
--     les autres « æ » du jeu étant légitimes.
--
-- Laissés intacts parce qu'ils se lisent correctement et n'apparaissent dans
-- aucune ligne abîmée : À, È, Ç, Â, Ô, °, «, », ·.

create or replace function public.fix_macroman(v text)
returns text
language sql
immutable
as $fn$
  select case
    when v is null then null
    when p.proteges like '%Ê%' then btrim(regexp_replace(p.corrige, ' {2,}', ' ', 'g'))
    else p.corrige
  end
  from (
    select
      q.proteges,
      replace(replace(
        regexp_replace(
          translate(
            q.proteges,
            U&'\0080\0081\0082\0083\0084\0085\0086\0087\0088\0089\008A\008B\008C\008D\008E\008F\0090\0091\0092\0093\0094\0095\0096\0097\0098\0099\009A\009B\009C\009D\009E\009F\00CB\00D0\00A1\00CA',
            'ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûüÀ–° '
          ),
          '([A-Za-zÀ-ÿ])Õ', '\1’', 'g'
        ),
        chr(1), 'Être'), chr(2), 'Êtes') as corrige
    from (
      select replace(replace(replace(v, 'Être', chr(1)), 'Êtes', chr(2)), 'ætre', chr(1)) as proteges
    ) q
  ) p
$fn$;

comment on function public.fix_macroman(text) is
  'BL-033 : réécrit en UTF-8 un texte dont les octets Mac Roman ont été conservés comme points de code.';
