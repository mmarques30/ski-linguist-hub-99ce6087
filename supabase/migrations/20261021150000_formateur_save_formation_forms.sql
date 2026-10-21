-- Formateur·rice : enregistrer bilans entrée / sortie sur SES inscriptions uniquement.
-- Staff conserve l'UPDATE direct ; le RPC sert surtout au portail formateur (RLS SELECT only).

CREATE OR REPLACE FUNCTION public.save_formateur_formation_form(
  p_inscription_id uuid,
  p_kind text,
  p_formulaire jsonb,
  p_niveau_general text,
  p_niveau_technique text,
  p_remarques_or_commentaire text DEFAULT NULL,
  p_objectif_atteint text DEFAULT NULL,
  p_hours_followed numeric DEFAULT NULL,
  p_entry_level text DEFAULT NULL,
  p_exit_level text DEFAULT NULL,
  p_final_general_level text DEFAULT NULL,
  p_final_specific_level text DEFAULT NULL,
  p_progression text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_instructor_id uuid;
BEGIN
  IF p_kind NOT IN ('entree', 'sortie') THEN
    RAISE EXCEPTION 'kind invalide';
  END IF;

  IF p_formulaire IS NULL OR jsonb_typeof(p_formulaire) <> 'object' THEN
    RAISE EXCEPTION 'formulaire invalide';
  END IF;

  IF NOT (public.is_staff() OR public.is_formateur()) THEN
    RAISE EXCEPTION 'non autorisé';
  END IF;

  SELECT instructor_id
    INTO v_instructor_id
  FROM public.inscriptions
  WHERE id = p_inscription_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'inscription introuvable';
  END IF;

  IF public.is_formateur() AND NOT public.is_staff() THEN
    IF v_instructor_id IS NULL
       OR v_instructor_id IS DISTINCT FROM public.get_my_instructor_id() THEN
      RAISE EXCEPTION 'inscription hors périmètre formateur';
    END IF;
  END IF;

  IF p_kind = 'entree' THEN
    UPDATE public.inscriptions SET
      formulaire_entree = p_formulaire,
      niveau_general_entree = NULLIF(trim(p_niveau_general), ''),
      niveau_technique_entree = NULLIF(trim(p_niveau_technique), ''),
      remarques_entree = NULLIF(trim(COALESCE(p_remarques_or_commentaire, '')), ''),
      entry_form_completed_at = now(),
      entry_level = NULLIF(trim(COALESCE(p_entry_level, p_niveau_general, '')), ''),
      updated_at = now()
    WHERE id = p_inscription_id;
  ELSE
    UPDATE public.inscriptions SET
      formulaire_sortie = p_formulaire,
      niveau_general_sortie = NULLIF(trim(p_niveau_general), ''),
      niveau_technique_sortie = NULLIF(trim(p_niveau_technique), ''),
      objectif_atteint = NULLIF(trim(COALESCE(p_objectif_atteint, '')), ''),
      commentaire_sortie = NULLIF(trim(COALESCE(p_remarques_or_commentaire, '')), ''),
      exit_form_completed_at = now(),
      hours_followed = COALESCE(p_hours_followed, hours_followed),
      exit_level = NULLIF(trim(COALESCE(p_exit_level, p_niveau_general, '')), ''),
      final_general_level = NULLIF(trim(COALESCE(p_final_general_level, p_niveau_general, '')), ''),
      final_specific_level = NULLIF(trim(COALESCE(p_final_specific_level, p_niveau_technique, '')), ''),
      progression = NULLIF(trim(COALESCE(p_progression, '')), ''),
      updated_at = now()
    WHERE id = p_inscription_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.save_formateur_formation_form(
  uuid, text, jsonb, text, text, text, text, numeric, text, text, text, text, text
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.save_formateur_formation_form(
  uuid, text, jsonb, text, text, text, text, numeric, text, text, text, text, text
) TO authenticated;

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'formateur_save_formation_forms',
  'inscriptions',
  jsonb_build_object(
    'migration', '20261021150000_formateur_save_formation_forms',
    'rpc', 'save_formateur_formation_form'
  )
);
