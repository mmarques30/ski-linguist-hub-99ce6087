import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useSaveEntryForm,
  useSaveExitForm,
} from "@/hooks/useInscriptionProgression";
import {
  emptyFormulaireEntree,
  emptyFormulaireSortie,
  type FormulaireEntreeFormateur,
  type FormulaireSortieFormateur,
} from "@/lib/formateur-formation-forms";
import type { FormateurStagiaireNiveauRow } from "@/lib/formateur-stagiaire-niveaux";
import { supabase } from "@/integrations/supabase/client";

/**
 * Après enregistrement du dossier courant, propage les niveaux vers les
 * autres inscriptions du groupe (certificat + JSONB minimal).
 */
export function useSyncCohortNiveaux() {
  const queryClient = useQueryClient();
  const saveEntry = useSaveEntryForm();
  const saveExit = useSaveExitForm();

  return useMutation({
    mutationFn: async (input: {
      kind: "entree" | "sortie";
      currentInscriptionId: string;
      niveaux: FormateurStagiaireNiveauRow[];
      /** Formulaire déjà sauvé pour le dossier courant (référence groupe). */
      templateEntree?: FormulaireEntreeFormateur;
      templateSortie?: FormulaireSortieFormateur;
    }) => {
      const siblings = input.niveaux.filter(
        (r) => r.inscription_id !== input.currentInscriptionId
      );
      for (const row of siblings) {
        if (input.kind === "entree") {
          const base =
            input.templateEntree ||
            emptyFormulaireEntree({ type_formation: "collective" });
          const formulaire: FormulaireEntreeFormateur = {
            ...base,
            stagiaires_niveaux: input.niveaux,
            expression_orale: row.niveau_general,
            comprehension_orale: row.niveau_general,
            comprehension_ecrite: row.niveau_general,
            expression_ecrite: row.niveau_technique,
            connaissances_grammaticales: row.niveau_technique,
            source: "app",
          };
          // Contourne la validation « compétences » en réutilisant le save RPC
          // via un update direct des colonnes synthèse si le formulaire sibling
          // n'est pas encore « complet » côté textes groupe — on force les champs
          // texte depuis le template.
          await saveEntry.mutateAsync({
            inscriptionId: row.inscription_id,
            formulaire,
            quiet: true,
          });
        } else {
          const base =
            input.templateSortie ||
            emptyFormulaireSortie({
              type_formation: "collective",
              objectif_atteint: "oui",
            });
          const formulaire: FormulaireSortieFormateur = {
            ...base,
            stagiaires_niveaux: input.niveaux,
            niveau_general: row.niveau_general,
            niveau_specifique: row.niveau_technique,
            source: "app",
          };
          await saveExit.mutateAsync({
            inscriptionId: row.inscription_id,
            formulaire,
            quiet: true,
          });
        }
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["formateur-portal-inscriptions"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["inscription-progression"],
      });
    },
    onError: (error: Error) => {
      toast.error(
        error.message ||
          "Niveaux du groupe partiellement enregistrés — vérifie les dossiers."
      );
    },
  });
}

/** Lecture rapide des niveaux déjà en base pour hydrater la grille. */
export async function fetchInscriptionNiveaux(ids: string[]) {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("inscriptions")
    .select(
      "id, niveau_general_entree, niveau_technique_entree, niveau_general_sortie, niveau_technique_sortie, formulaire_entree, formulaire_sortie"
    )
    .in("id", ids);
  if (error) throw error;
  return data ?? [];
}
