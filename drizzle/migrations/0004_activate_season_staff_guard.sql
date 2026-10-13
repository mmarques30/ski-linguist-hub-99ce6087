CREATE OR REPLACE FUNCTION public.activate_season(p_season_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Forbidden: staff only' USING ERRCODE = '42501';
  END IF;
  UPDATE public.seasons SET is_current = false, status = 'terminee'
    WHERE is_current = true AND id != p_season_id;
  UPDATE public.seasons SET is_current = true, status = 'active'
    WHERE id = p_season_id;
END;
$function$;