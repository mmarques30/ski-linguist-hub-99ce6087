/**
 * BL-027 — financement OPCO : questionnaire inscription + propositions BO.
 *
 * À l'inscription publique : aucun règlement ; collecte d'infos OPCO/NAF.
 * En back-office : correction du mode de financement + propositions de
 * règlement (payeur stagiaire / entreprise / OPCO, formules libres).
 */

import { REGISTRATION_PAYMENT_OPTIONS } from "@/lib/registration-payments";

export const FUNDING_ORGANIZATION_OPTIONS = [
  { value: "FIFPL", label: "FIFPL" },
  { value: "OPCO", label: "OPCO" },
  { value: "Entreprise", label: "Entreprise (école de ski)" },
  { value: "Autofinancement", label: "Autofinancement" },
] as const;

export type FundingOrganizationValue =
  (typeof FUNDING_ORGANIZATION_OPTIONS)[number]["value"];

/** Payeur d'une proposition de règlement (décision Paula : selon le cas). */
export const PROPOSAL_PAYER_TYPES = [
  { value: "stagiaire", label: "Stagiaire" },
  { value: "entreprise", label: "Entreprise" },
  { value: "opco", label: "OPCO" },
] as const;

export type ProposalPayerType = (typeof PROPOSAL_PAYER_TYPES)[number]["value"];

/** Formules de règlement possibles pour une proposition BO. */
export const PROPOSAL_PAYMENT_FORMULAS = [
  {
    value: REGISTRATION_PAYMENT_OPTIONS.STRIPE_DEPOSIT_CHEQUE,
    label: "150 € carte bancaire en ligne + solde chèque",
  },
  {
    value: REGISTRATION_PAYMENT_OPTIONS.VIREMENT_DEPOSIT,
    label: "150 € virement + solde chèque",
  },
  {
    value: REGISTRATION_PAYMENT_OPTIONS.STRIPE_FULL,
    label: "Paiement intégral carte bancaire en ligne",
  },
  {
    value: REGISTRATION_PAYMENT_OPTIONS.VIREMENT_FULL,
    label: "Paiement intégral virement",
  },
  { value: "cheque_full", label: "Chèque (intégral ou solde)" },
  { value: "organisme", label: "Prise en charge organisme (sans acompte stagiaire)" },
  { value: "custom", label: "Autre (détail dans les notes)" },
  { value: "none", label: "Aucun règlement pour l’instant" },
] as const;

export type ProposalPaymentFormula =
  (typeof PROPOSAL_PAYMENT_FORMULAS)[number]["value"];

export const FUNDING_PROPOSAL_STATUSES = [
  { value: "brouillon", label: "Brouillon" },
  { value: "proposee", label: "Proposée au client" },
  { value: "acceptee", label: "Acceptée" },
  { value: "refusee", label: "Refusée" },
  { value: "payee", label: "Payée / soldée" },
] as const;

export type FundingProposalStatus =
  (typeof FUNDING_PROPOSAL_STATUSES)[number]["value"];

export interface OpcoQuestionnaire {
  /** Le candidat connaît-il l'OPCO qui le prendra en charge ? */
  knowsOpco: boolean | null;
  /** Nom / libellé de l'OPCO si connu */
  opcoName: string;
  /** Code NAF si OPCO inconnu */
  nafCode: string;
  /** Explication libre du cas */
  caseNotes: string;
}

export const EMPTY_OPCO_QUESTIONNAIRE: OpcoQuestionnaire = {
  knowsOpco: null,
  opcoName: "",
  nafCode: "",
  caseNotes: "",
};

export interface FundingDetailsPayload {
  version: 1;
  source: "register" | "admin";
  opco?: OpcoQuestionnaire;
}

export function serializeFundingDetails(payload: FundingDetailsPayload): string {
  return JSON.stringify(payload);
}

export function parseFundingDetails(
  raw: string | null | undefined
): FundingDetailsPayload | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as FundingDetailsPayload;
    if (!parsed || parsed.version !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function validateOpcoQuestionnaire(
  q: OpcoQuestionnaire
): string | null {
  if (q.knowsOpco === null) {
    return "Indiquez si vous connaissez l’OPCO qui prendra en charge votre dossier.";
  }
  if (q.knowsOpco) {
    if (!q.opcoName.trim()) {
      return "Précisez le nom de l’OPCO.";
    }
  } else if (!q.nafCode.trim()) {
    return "Indiquez le code NAF de votre activité.";
  }
  return null;
}

export function formatOpcoQuestionnaireSummary(q: OpcoQuestionnaire): string {
  const lines = [
    "Financement OPCO — dossier à analyser par FLI pour définir les modalités du contrat (aucun frais facturé pour le moment).",
  ];
  if (q.knowsOpco === true) {
    lines.push(`OPCO connu : ${q.opcoName.trim() || "(non précisé)"}`);
  } else if (q.knowsOpco === false) {
    lines.push(`OPCO inconnu — code NAF : ${q.nafCode.trim() || "(non précisé)"}`);
  }
  if (q.caseNotes.trim()) {
    lines.push(`Précisions du candidat :\n${q.caseNotes.trim()}`);
  }
  return lines.join("\n");
}

export function proposalPayerLabel(value: string | null | undefined): string {
  return PROPOSAL_PAYER_TYPES.find((p) => p.value === value)?.label || value || "—";
}

export function proposalFormulaLabel(value: string | null | undefined): string {
  return (
    PROPOSAL_PAYMENT_FORMULAS.find((f) => f.value === value)?.label || value || "—"
  );
}

export function proposalStatusLabel(value: string | null | undefined): string {
  return (
    FUNDING_PROPOSAL_STATUSES.find((s) => s.value === value)?.label || value || "—"
  );
}

/** Textes publics `/register` (décision Paula 21/09). */
export const OPCO_REGISTER_COPY = {
  fundingChoiceHelp:
    "Financement par votre OPCO — votre dossier sera étudié par FLI. Aucun frais ne sera facturé pour le moment.",
  paymentTitle: "Financement OPCO",
  paymentDescription:
    "Nous allons analyser votre dossier pour définir les modalités du contrat, selon l’OPCO qui prendra en charge votre dossier.",
  paymentAlert:
    "Aucun frais pour le moment. Notre équipe vous contactera pour finaliser les modalités avec votre organisme financeur.",
  confirmationAlert:
    "Financement OPCO : aucun règlement n’est demandé à cette étape. FLI analysera votre dossier pour définir les modalités du contrat selon l’OPCO concerné.",
} as const;
