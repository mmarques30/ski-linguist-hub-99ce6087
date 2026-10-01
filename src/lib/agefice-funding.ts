/**
 * AGEFICE — Fonds d'Assurance Formation des chefs d'entreprise commerçants.
 *
 * Sources (janvier 2026 / modèles 2025-2026) :
 * - AGEFICE_Pieces_Justificatives_2026.pdf
 * - AGEFICE-Demande-de-prise-en-charge-2025-2026-Editable.pdf
 * - AGEFICE-Modele-attestation-d-assiduite-2025-2026.pdf
 * - https://communication-agefice.fr/plafonds-financiers-annee-2026/
 *
 * Délais : demande au Point d'accueil ≥ 15 jours calendaires avant le début,
 * et ≤ 4 mois avant le début. Remboursement ≤ 4 mois après la fin.
 */

export const AGEFICE_CRITERIA_YEAR = 2026;

/** Lien officiel plafonds financiers (à transmettre au stagiaire). */
export const AGEFICE_CEILINGS_URL =
  "https://communication-agefice.fr/plafonds-financiers-annee-2026/";

export const AGEFICE_SITE_URL = "https://www.agefice.fr";

/** Plafond annuel indicatif CFP ≥ 7 € (hors diplôme RNCP jusqu'à 5000 €). */
export const AGEFICE_ANNUAL_CEILING_CFP_GE_7_EUR = 3000;

/** Plafond annuel indicatif 0 € < CFP < 7 €. */
export const AGEFICE_ANNUAL_CEILING_CFP_LT_7_EUR = 600;

/** Délai minimum avant démarrage (jours calendaires). */
export const AGEFICE_MIN_DAYS_BEFORE_START = 15;

/** Délai maximum avant démarrage pour déposer (mois). */
export const AGEFICE_MAX_MONTHS_BEFORE_START = 4;

export const AGEFICE_DOCUMENT_FILES = {
  piecesJustificatives: "agefice-pieces-justificatives-2026.pdf",
  demandePriseEnCharge: "agefice-demande-prise-en-charge-2025-2026.pdf",
  attestationAssiduite: "agefice-attestation-assiduite-2025-2026.pdf",
} as const;

export type AgeficePackDocument = {
  documentType: "AGEFICE_DEMANDE" | "AGEFICE_PIECES" | "AGEFICE_ASSIDUITE";
  filename: string;
  internalFile: string;
  label: string;
  /** Demande : à l'inscription. Assiduité : pack de fin. */
  phase: "inscription" | "fin_formation";
};

export const AGEFICE_PACK_DOCUMENTS: AgeficePackDocument[] = [
  {
    documentType: "AGEFICE_DEMANDE",
    filename: "AGEFICE-Demande-prise-en-charge-2025-2026.pdf",
    internalFile: AGEFICE_DOCUMENT_FILES.demandePriseEnCharge,
    label: "Demande préalable de financement AGEFICE (à compléter / signer)",
    phase: "inscription",
  },
  {
    documentType: "AGEFICE_PIECES",
    filename: "AGEFICE-Pieces-justificatives-2026.pdf",
    internalFile: AGEFICE_DOCUMENT_FILES.piecesJustificatives,
    label: "Liste des pièces justificatives AGEFICE 2026",
    phase: "inscription",
  },
  {
    documentType: "AGEFICE_ASSIDUITE",
    filename: "AGEFICE-Attestation-assiduite-2025-2026.pdf",
    internalFile: AGEFICE_DOCUMENT_FILES.attestationAssiduite,
    label: "Modèle attestation d'assiduité et de règlement AGEFICE",
    phase: "fin_formation",
  },
];

export const AGEFICE_INSCRIPTION_CHECKLIST: ReadonlyArray<{
  code: string;
  label: string;
  who: "stagiaire" | "fli" | "les_deux";
}> = [
  {
    code: "demande",
    label: "Imprimé de demande daté et signé (stagiaire + OF si mandat)",
    who: "les_deux",
  },
  {
    code: "convention",
    label: "Convention de formation (ou devis) avec NDA, coût, dates, signatures",
    who: "fli",
  },
  {
    code: "programme",
    label: "Programme détaillé (Qualiopi) + horaires / modalités",
    who: "fli",
  },
  {
    code: "calendrier",
    label: "Calendrier présentiel/synchrone si absent de la convention",
    who: "fli",
  },
  {
    code: "cfp",
    label: "Attestation de versement CFP (URSSAF) — ou K-Bis + URSSAF si nouvel affilié",
    who: "stagiaire",
  },
  {
    code: "identite",
    label: "Pièce d'identité avec signature (< 10 ans depuis délivrance)",
    who: "stagiaire",
  },
  {
    code: "pta",
    label: "Dépôt via Point d'accueil AGEFICE du département (≥ 15 j avant début)",
    who: "stagiaire",
  },
];

export function ageficeDepositDeadlineIso(startDate: string): string | null {
  const start = new Date(`${startDate}T12:00:00Z`);
  if (Number.isNaN(start.getTime())) return null;
  const deadline = new Date(start);
  deadline.setUTCDate(deadline.getUTCDate() - AGEFICE_MIN_DAYS_BEFORE_START);
  return deadline.toISOString().slice(0, 10);
}

export function formatAgeficeDepositDeadlineFr(startDate: string): string {
  const iso = ageficeDepositDeadlineIso(startDate);
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export const AGEFICE_REGISTER_COPY = {
  fundingChoiceLabel: "AGEFICE",
  fundingChoiceHelp:
    "Fonds d'Assurance Formation des commerçants. Demande à déposer au moins 15 jours avant le début via un Point d'accueil. Consultez les plafonds 2026.",
  paymentTitle: "Financement AGEFICE",
  paymentDescription:
    "FLI prépare la convention, le programme et le formulaire de demande. Vous joignez CFP, pièce d'identité, et déposez auprès de votre Point d'accueil AGEFICE.",
  paymentAlert:
    "Vérifiez vos plafonds financiers 2026 selon votre cotisation CFP avant de constituer le dossier.",
  ceilingsLinkLabel: "Plafonds financiers AGEFICE 2026",
  confirmationAlert: (startDate?: string | null) => {
    const deadline = startDate ? formatAgeficeDepositDeadlineFr(startDate) : null;
    return (
      "Financement AGEFICE : vous recevrez la convention, le programme et le formulaire de demande. " +
      "Joignez votre attestation CFP et une pièce d'identité (< 10 ans), puis déposez le dossier " +
      "auprès d'un Point d'accueil AGEFICE" +
      (deadline ? ` au plus tard le ${deadline}` : " au moins 15 jours avant le début") +
      `. Plafonds : ${AGEFICE_CEILINGS_URL}`
    );
  },
} as const;

export function buildAgeficeObservation(params: {
  startDate?: string | null;
}): string {
  const lines = [
    "Financement AGEFICE — dossier de demande préalable à constituer",
    `Plafonds 2026 : ${AGEFICE_CEILINGS_URL}`,
  ];
  if (params.startDate) {
    lines.push(
      `Dépôt Point d'accueil au plus tard : ${formatAgeficeDepositDeadlineFr(params.startDate)} (≥ ${AGEFICE_MIN_DAYS_BEFORE_START} j avant début)`,
    );
  }
  return lines.join("\n");
}

export function isAgeficeFunding(type: string | null | undefined): boolean {
  return (type || "").trim().toLowerCase() === "agefice";
}

export function isAgeficeFundingOrganization(
  fundingOrganization: string | null | undefined,
): boolean {
  return (fundingOrganization || "").toLowerCase().includes("agefice");
}
