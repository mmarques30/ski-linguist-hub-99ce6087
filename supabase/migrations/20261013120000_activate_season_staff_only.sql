-- Finding #14 : activate_season ne doit pas être appelable par stagiaire / formateur.
-- SECURITY DEFINER sans garde de rôle + GRANT authenticated = tout compte connecté
-- pouvait basculer la saison courante (et donc les tarifs).

CREATE OR REPLACE FUNCTION public.activate_season(p_season_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Réservé au staff (admin / user)'
      USING ERRCODE = '42501';
  END IF;

  IF p_season_id IS NULL THEN
    RAISE EXCEPTION 'p_season_id requis'
      USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.seasons WHERE id = p_season_id) THEN
    RAISE EXCEPTION 'Saison introuvable'
      USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.seasons
  SET is_current = false, status = 'terminee'
  WHERE is_current = true AND id != p_season_id;

  UPDATE public.seasons
  SET is_current = true, status = 'active'
  WHERE id = p_season_id;
END;
$$;

REVOKE ALL ON FUNCTION public.activate_season(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.activate_season(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.activate_season(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.activate_season(uuid) TO service_role;

COMMENT ON FUNCTION public.activate_season(uuid) IS
  'Active une saison (is_current). Réservé à is_staff() — finding sécurité #14.';
