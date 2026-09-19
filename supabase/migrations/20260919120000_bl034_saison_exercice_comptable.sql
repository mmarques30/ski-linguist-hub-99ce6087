-- BL-034 — Décision Paula : saison = exercice comptable 01/07 → 30/06.
-- N'affecte PAS le numérotage fiscal des factures (public.get_fiscal_year).

-- Corrige la saison courante si elle utilise encore les anciennes bornes hiver (déc–mars).
UPDATE public.seasons
SET
  start_date = '2026-07-01'::date,
  end_date = '2027-06-30'::date,
  updated_at = now()
WHERE start_date = '2026-12-01'::date
  AND end_date = '2027-03-31'::date;

-- Saisons dont slug ou nom correspond à YYYY-YYYY : bornes 01/07 → 30/06.
UPDATE public.seasons s
SET
  start_date = make_date(parsed.y1, 7, 1),
  end_date = make_date(parsed.y2, 6, 30),
  updated_at = now()
FROM (
  SELECT
    id,
    COALESCE(
      (regexp_match(slug, '^(\d{4})-(\d{4})$'))[1]::int,
      (regexp_match(name, '(\d{4})-(\d{4})'))[1]::int
    ) AS y1,
    COALESCE(
      (regexp_match(slug, '^(\d{4})-(\d{4})$'))[2]::int,
      (regexp_match(name, '(\d{4})-(\d{4})'))[2]::int
    ) AS y2
  FROM public.seasons
  WHERE slug ~ '^\d{4}-\d{4}$' OR name ~ '\d{4}-\d{4}'
) AS parsed
WHERE s.id = parsed.id
  AND parsed.y1 IS NOT NULL
  AND parsed.y2 IS NOT NULL
  AND parsed.y2 = parsed.y1 + 1
  AND (
    s.start_date IS DISTINCT FROM make_date(parsed.y1, 7, 1)
    OR s.end_date IS DISTINCT FROM make_date(parsed.y2, 6, 30)
  );
