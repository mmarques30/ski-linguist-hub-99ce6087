import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  legacyLevelSyncFromProgression,
  type ObjectifAtteint,
  type ProgressionEntryFields,
  type ProgressionExitFields,
} from "@/lib/certificate-progression";
import {
  deriveEntryCertificateFields,
  deriveExitCertificateFields,
  isFormulaireEntreeComplete,
  isFormulaireSortieComplete,
  type FormulaireEntreeFormateur,
  type FormulaireSortieFormateur,
} from "@/lib/formateur-formation-forms";

export type InscriptionProgressionRow = ProgressionEntryFields &
  ProgressionExitFields & {
    id: string;
    entry_form_completed_at: string | null;
    exit_form_completed_at: string | null;
    hours_followed: number | null;
    duration_hours: number | null;
    end_date: string;
    status: string;
    formulaire_entree: FormulaireEntreeFormateur | null;
    formulaire_sortie: FormulaireSortieFormateur | null;
  };

export function useInscriptionProgression(inscriptionId?: string) {
  return useQuery({
    queryKey: ["inscription-progression", inscriptionId],
    queryFn: async (): Promise<InscriptionProgressionRow | null> => {
      if (!inscriptionId) return null;
      const { data, error } = await supabase
        .from("inscriptions")
        .select(
          [
            "id",
            "niveau_general_entree",
            "niveau_technique_entree",
            "remarques_entree",
            "niveau_general_sortie",
            "niveau_technique_sortie",
            "objectif_atteint",
            "commentaire_sortie",
            "formulaire_entree",
            "formulaire_sortie",
            "entry_form_completed_at",
            "exit_form_completed_at",
            "hours_followed",
            "duration_hours",
            "end_date",
            "status",
          ].join(", ")
        )
        .eq("id", inscriptionId)
        .maybeSingle();

      if (error) throw error;
      return (data as unknown) as InscriptionProgressionRow | null;
    },
    enabled: !!inscriptionId,
  });
}

export function useSaveEntryForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      inscriptionId: string;
      formulaire: FormulaireEntreeFormateur;
    }) => {
      if (!isFormulaireEntreeComplete(input.formulaire)) {
        throw new Error(
          "Formulaire d'entrée incomplet (5 compétences CECRL obligatoires)"
        );
      }
      const derived = deriveEntryCertificateFields(input.formulaire);
      const legacy = legacyLevelSyncFromProgression({
        ...derived,
        niveau_general_sortie: null,
        niveau_technique_sortie: null,
        objectif_atteint: null,
        commentaire_sortie: null,
      });

      const payload = {
        ...input.formulaire,
        source: "app" as const,
        submitted_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("inscriptions")
        .update({
          formulaire_entree: payload,
          niveau_general_entree: derived.niveau_general_entree,
          niveau_technique_entree: derived.niveau_technique_entree,
          remarques_entree: derived.remarques_entree,
          entry_form_completed_at: new Date().toISOString(),
          entry_level: legacy.entry_level,
        } as never)
        .eq("id", input.inscriptionId);

      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["inscription-progression", vars.inscriptionId] });
      queryClient.invalidateQueries({ queryKey: ["inscription", vars.inscriptionId] });
      queryClient.invalidateQueries({ queryKey: ["inscriptions"] });
      toast.success("Formulaire d'entrée enregistré");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur formulaire d'entrée");
    },
  });
}

export function useSaveExitForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      inscriptionId: string;
      formulaire: FormulaireSortieFormateur;
      hoursFollowed?: number | null;
      existingEntry?: ProgressionEntryFields;
    }) => {
      if (!isFormulaireSortieComplete(input.formulaire)) {
        throw new Error(
          "Formulaire de sortie incomplet (niveaux, objectif, commentaire assiduité)"
        );
      }

      const derived = deriveExitCertificateFields(input.formulaire);
      const legacy = legacyLevelSyncFromProgression({
        niveau_general_entree: input.existingEntry?.niveau_general_entree ?? null,
        niveau_technique_entree: input.existingEntry?.niveau_technique_entree ?? null,
        remarques_entree: input.existingEntry?.remarques_entree ?? null,
        ...derived,
      });

      const formulairePayload = {
        ...input.formulaire,
        source: "app" as const,
        submitted_at: new Date().toISOString(),
      };

      const payload: Record<string, unknown> = {
        formulaire_sortie: formulairePayload,
        niveau_general_sortie: derived.niveau_general_sortie,
        niveau_technique_sortie: derived.niveau_technique_sortie,
        objectif_atteint: derived.objectif_atteint as ObjectifAtteint,
        commentaire_sortie: derived.commentaire_sortie,
        exit_form_completed_at: new Date().toISOString(),
        exit_level: legacy.exit_level,
        final_general_level: legacy.final_general_level,
        final_specific_level: legacy.final_specific_level,
        progression: legacy.progression,
      };
      if (input.hoursFollowed !== undefined) {
        payload.hours_followed = input.hoursFollowed;
      }

      const { error } = await supabase
        .from("inscriptions")
        .update(payload as never)
        .eq("id", input.inscriptionId);

      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["inscription-progression", vars.inscriptionId] });
      queryClient.invalidateQueries({ queryKey: ["inscription", vars.inscriptionId] });
      queryClient.invalidateQueries({ queryKey: ["inscriptions"] });
      toast.success("Formulaire de sortie enregistré");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur formulaire de sortie");
    },
  });
}

export function useInscriptionCertificates(inscriptionId?: string) {
  return useQuery({
    queryKey: ["certificates", inscriptionId],
    queryFn: async () => {
      if (!inscriptionId) return [];
      const { data, error } = await supabase
        .from("certificates")
        .select("id, pdf_url, issue_date, level_achieved, hours_followed, hours_planned")
        .eq("inscription_id", inscriptionId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!inscriptionId,
  });
}
