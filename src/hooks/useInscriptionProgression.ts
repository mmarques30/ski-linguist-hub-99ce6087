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

async function callSaveFormRpc(args: {
  inscriptionId: string;
  kind: "entree" | "sortie";
  formulaire: FormulaireEntreeFormateur | FormulaireSortieFormateur;
  niveauGeneral: string | null;
  niveauTechnique: string | null;
  remarquesOrCommentaire: string | null;
  objectifAtteint?: string | null;
  hoursFollowed?: number | null;
  entryLevel?: string | null;
  exitLevel?: string | null;
  finalGeneralLevel?: string | null;
  finalSpecificLevel?: string | null;
  progression?: string | null;
}) {
  const { error } = await supabase.rpc("save_formateur_formation_form", {
    p_inscription_id: args.inscriptionId,
    p_kind: args.kind,
    p_formulaire: args.formulaire,
    p_niveau_general: args.niveauGeneral,
    p_niveau_technique: args.niveauTechnique,
    p_remarques_or_commentaire: args.remarquesOrCommentaire,
    p_objectif_atteint: args.objectifAtteint ?? null,
    p_hours_followed: args.hoursFollowed ?? null,
    p_entry_level: args.entryLevel ?? null,
    p_exit_level: args.exitLevel ?? null,
    p_final_general_level: args.finalGeneralLevel ?? null,
    p_final_specific_level: args.finalSpecificLevel ?? null,
    p_progression: args.progression ?? null,
  } as never);

  if (error) throw error;
}

export function useSaveEntryForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      inscriptionId: string;
      formulaire: FormulaireEntreeFormateur;
      /** Pas de toast (ex. sync cohorte). */
      quiet?: boolean;
    }) => {
      if (!isFormulaireEntreeComplete(input.formulaire)) {
        throw new Error(
          "Formulaire d'entrée incomplet (compétences CECRL, attentes, moyens)"
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

      await callSaveFormRpc({
        inscriptionId: input.inscriptionId,
        kind: "entree",
        formulaire: payload,
        niveauGeneral: derived.niveau_general_entree,
        niveauTechnique: derived.niveau_technique_entree,
        remarquesOrCommentaire: derived.remarques_entree,
        entryLevel: legacy.entry_level,
      });
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["inscription-progression", vars.inscriptionId],
      });
      queryClient.invalidateQueries({
        queryKey: ["inscription", vars.inscriptionId],
      });
      queryClient.invalidateQueries({ queryKey: ["inscriptions"] });
      queryClient.invalidateQueries({
        queryKey: ["formateur-portal-inscriptions"],
      });
      if (!vars.quiet) toast.success("Formulaire d'entrée enregistré");
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
      quiet?: boolean;
    }) => {
      if (!isFormulaireSortieComplete(input.formulaire)) {
        throw new Error(
          "Formulaire de sortie incomplet (niveaux, objectif, assiduité/logistique ou dynamique de groupe)"
        );
      }

      const derived = deriveExitCertificateFields(input.formulaire);
      const legacy = legacyLevelSyncFromProgression({
        niveau_general_entree:
          input.existingEntry?.niveau_general_entree ?? null,
        niveau_technique_entree:
          input.existingEntry?.niveau_technique_entree ?? null,
        remarques_entree: input.existingEntry?.remarques_entree ?? null,
        ...derived,
      });

      const formulairePayload = {
        ...input.formulaire,
        source: "app" as const,
        submitted_at: new Date().toISOString(),
      };

      await callSaveFormRpc({
        inscriptionId: input.inscriptionId,
        kind: "sortie",
        formulaire: formulairePayload,
        niveauGeneral: derived.niveau_general_sortie,
        niveauTechnique: derived.niveau_technique_sortie,
        remarquesOrCommentaire: derived.commentaire_sortie,
        objectifAtteint: derived.objectif_atteint as ObjectifAtteint,
        hoursFollowed: input.hoursFollowed,
        exitLevel: legacy.exit_level,
        finalGeneralLevel: legacy.final_general_level,
        finalSpecificLevel: legacy.final_specific_level,
        progression: legacy.progression,
      });
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["inscription-progression", vars.inscriptionId],
      });
      queryClient.invalidateQueries({
        queryKey: ["inscription", vars.inscriptionId],
      });
      queryClient.invalidateQueries({ queryKey: ["inscriptions"] });
      queryClient.invalidateQueries({
        queryKey: ["formateur-portal-inscriptions"],
      });
      if (!vars.quiet) toast.success("Formulaire de sortie enregistré");
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
        .select(
          "id, pdf_url, issue_date, level_achieved, hours_followed, hours_planned"
        )
        .eq("inscription_id", inscriptionId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!inscriptionId,
  });
}
