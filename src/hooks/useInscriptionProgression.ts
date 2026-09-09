import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  isEntryFormComplete,
  isExitFormComplete,
  legacyLevelSyncFromProgression,
  type ObjectifAtteint,
  type ProgressionEntryFields,
  type ProgressionExitFields,
} from "@/lib/certificate-progression";

export type InscriptionProgressionRow = ProgressionEntryFields &
  ProgressionExitFields & {
    id: string;
    entry_form_completed_at: string | null;
    exit_form_completed_at: string | null;
    hours_followed: number | null;
    duration_hours: number | null;
    end_date: string;
    status: string;
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
      return data as InscriptionProgressionRow | null;
    },
    enabled: !!inscriptionId,
  });
}

export function useSaveEntryForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      inscriptionId: string;
      fields: ProgressionEntryFields;
    }) => {
      if (!isEntryFormComplete(input.fields)) {
        throw new Error("Niveaux général et technique d'entrée obligatoires");
      }
      const legacy = legacyLevelSyncFromProgression({
        ...input.fields,
        niveau_general_sortie: null,
        niveau_technique_sortie: null,
        objectif_atteint: null,
        commentaire_sortie: null,
      });

      const { error } = await supabase
        .from("inscriptions")
        .update({
          niveau_general_entree: input.fields.niveau_general_entree?.trim() || null,
          niveau_technique_entree: input.fields.niveau_technique_entree?.trim() || null,
          remarques_entree: input.fields.remarques_entree?.trim() || null,
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
      fields: ProgressionExitFields;
      hoursFollowed?: number | null;
      existingEntry?: ProgressionEntryFields;
    }) => {
      if (!isExitFormComplete(input.fields)) {
        throw new Error(
          "Formulaire de sortie incomplet (niveaux CECRL, objectif, commentaire)"
        );
      }

      const legacy = legacyLevelSyncFromProgression({
        niveau_general_entree: input.existingEntry?.niveau_general_entree ?? null,
        niveau_technique_entree: input.existingEntry?.niveau_technique_entree ?? null,
        remarques_entree: input.existingEntry?.remarques_entree ?? null,
        ...input.fields,
      });

      const payload: Record<string, unknown> = {
          niveau_general_sortie: input.fields.niveau_general_sortie?.trim() || null,
          niveau_technique_sortie: input.fields.niveau_technique_sortie?.trim() || null,
          objectif_atteint: input.fields.objectif_atteint as ObjectifAtteint,
          commentaire_sortie: input.fields.commentaire_sortie?.trim() || null,
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
