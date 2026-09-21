/**
 * BL-014 — recrutement formateur·rice : candidat·e → actif·ve.
 */

export type InstructorCandidatFields = {
  email?: string | null;
  phone?: string | null;
  languages?: string[] | null;
  siret?: string | null;
  tax_status?: string | null;
  statut_administratif?: string | null;
  vigilance_attestation_url?: string | null;
  vigilance_attestation_received_at?: string | null;
};

/** Manques signalés avant activation (soft — n’empêchent pas la confirmation). */
export function candidatActivationGaps(
  instructor: InstructorCandidatFields
): string[] {
  const gaps: string[] = [];
  if (!instructor.email?.trim()) gaps.push("e-mail manquant");
  if (!instructor.phone?.trim()) gaps.push("téléphone manquant");
  if (!instructor.languages?.length) gaps.push("aucune langue renseignée");
  if (!instructor.siret?.trim() && !instructor.tax_status?.trim()) {
    gaps.push("SIRET / statut fiscal non renseigné");
  }
  if (!instructor.statut_administratif?.trim()) {
    gaps.push("statut administratif non renseigné");
  }
  if (
    !instructor.vigilance_attestation_url?.trim() &&
    !instructor.vigilance_attestation_received_at
  ) {
    gaps.push("attestation de vigilance non renseignée");
  }
  return gaps;
}

export function activationConfirmDescription(gaps: string[]): string {
  if (gaps.length === 0) {
    return "Le statut passera de candidat·e à actif·ve. La personne pourra être affectée aux inscriptions.";
  }
  return (
    "Le statut passera de candidat·e à actif·ve. Points encore à compléter : " +
    gaps.join(" ; ") +
    "."
  );
}

/** Presets statut administratif (valeurs libres en base — hors statut RH actif/candidat). */
export const STATUT_ADMINISTRATIF_PRESETS = [
  { value: "à régulariser", label: "À régulariser" },
  {
    value: "à confirmer (micro-entreprise ou société)",
    label: "À confirmer (micro-entreprise ou société)",
  },
  { value: "portage salarial", label: "Portage salarial" },
  { value: "salarié·e", label: "Salarié·e" },
  { value: "étranger", label: "Étranger" },
  { value: "étranger (CNPJ Brésil)", label: "Étranger (CNPJ Brésil)" },
  { value: "facturation depuis l'étranger", label: "Facturation depuis l'étranger" },
  { value: "gérante FLI (interne)", label: "Gérante FLI (interne)" },
  { value: "dossier_complet", label: "Dossier complet" },
  { value: "dossier_incomplet", label: "Dossier incomplet" },
] as const;
