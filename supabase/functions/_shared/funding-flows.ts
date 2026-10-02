/**
 * Flux par modalité de financement — source de vérité produit.
 *
 * Chaque clé (`fifpl` | `agefice` | `opco` | `company` | `self`) définit :
 * - le pack de documents d'inscription (ou aucun) ;
 * - le slug e-mail du dossier (modèle 2) ;
 * - le texte « prochaines étapes » de la confirmation ;
 * - le déclencheur d'envoi du dossier.
 *
 * Miroir front : `src/lib/funding-flows.ts`.
 */

export type FundingFlowKey = "fifpl" | "agefice" | "opco" | "company" | "self";

/** Identifiant du pack de pièces jointes (voir registration-welcome-documents). */
export type FundingPackId = "fifpl" | "agefice" | "convention_programme";

/**
 * Quand envoyer le dossier de formation au stagiaire.
 * - after_deposit : après 150 € / paiement intégral confirmé
 * - after_full_payment : seulement après paiement intégral (pas l'acompte 150 €)
 * - manual : staff / proposition BO (pas d'auto à la soumission)
 * - none : pas de dossier stagiaire (payeur entreprise)
 */
export type FundingDocumentTrigger =
  | "after_deposit"
  | "after_full_payment"
  | "manual"
  | "none";

export type FundingFlowDefinition = {
  key: FundingFlowKey;
  /** Libellé stocké dans `inscriptions.funding_organization`. */
  organizationLabel: string;
  /** Pack PJ (null = aucun envoi auto de dossier). */
  packId: FundingPackId | null;
  /** Slug email_templates pour le dossier (modèle 2). */
  dossierEmailSlug: string;
  documentTrigger: FundingDocumentTrigger;
  /**
   * Si true et aucun flux de paiement à la soumission, on peut enfiler
   * immédiatement. Toujours false pour OPCO (attente analyse FLI) et Entreprise.
   */
  autoEnqueueAtSubmitWithoutPayment: boolean;
  /** Paragraphe HTML injecté dans la confirmation (`{{funding_next_steps}}`). */
  confirmationNextStepsHtml: string;
  /** Titre court pour le BO / checklist. */
  shortLabel: string;
};

const CONFIRMATION_FIFPL = `Prochaines étapes : dès confirmation du règlement des frais de dossier de 150&nbsp;€ (ou du paiement intégral), nous vous enverrons votre dossier FIF-PL (convention, programme, critères et tutoriel) pour votre demande de prise en charge.`;

const CONFIRMATION_AGEFICE = `Prochaines étapes : dès confirmation du règlement des frais de dossier de 150&nbsp;€ (ou du paiement intégral), nous vous enverrons votre dossier AGEFICE (convention, programme, formulaire de demande et liste des pièces). Pensez aux plafonds 2026 et au dépôt en Point d'accueil au moins 15 jours avant le début.`;

const CONFIRMATION_OPCO = `Prochaines étapes : aucun règlement n'est demandé pour l'instant. France Langues International analyse votre dossier OPCO et vous recontactera avec une proposition de prise en charge. Les documents de formation vous seront envoyés ensuite, si besoin.`;

const CONFIRMATION_COMPANY = `Prochaines étapes : le règlement est pris en charge par votre entreprise / école. Les documents contractuels seront transmis à l'organisme payeur. Vous serez informé·e dès que le planning pourra être organisé.`;

const CONFIRMATION_SELF = `Prochaines étapes : dès confirmation du règlement de la totalité de la formation, nous vous enverrons votre convention et votre programme de formation à signer et nous retourner.`;

export const FUNDING_FLOWS: Record<FundingFlowKey, FundingFlowDefinition> = {
  fifpl: {
    key: "fifpl",
    organizationLabel: "FIFPL",
    packId: "fifpl",
    dossierEmailSlug: "inscription_documents_fifpl",
    documentTrigger: "after_deposit",
    autoEnqueueAtSubmitWithoutPayment: false,
    confirmationNextStepsHtml: CONFIRMATION_FIFPL,
    shortLabel: "FIF-PL",
  },
  agefice: {
    key: "agefice",
    organizationLabel: "AGEFICE",
    packId: "agefice",
    dossierEmailSlug: "inscription_documents_agefice",
    documentTrigger: "after_deposit",
    autoEnqueueAtSubmitWithoutPayment: false,
    confirmationNextStepsHtml: CONFIRMATION_AGEFICE,
    shortLabel: "AGEFICE",
  },
  opco: {
    key: "opco",
    organizationLabel: "OPCO",
    packId: null,
    dossierEmailSlug: "inscription_documents_opco",
    documentTrigger: "manual",
    autoEnqueueAtSubmitWithoutPayment: false,
    confirmationNextStepsHtml: CONFIRMATION_OPCO,
    shortLabel: "OPCO",
  },
  company: {
    key: "company",
    organizationLabel: "Entreprise",
    packId: null,
    dossierEmailSlug: "inscription_documents",
    documentTrigger: "none",
    autoEnqueueAtSubmitWithoutPayment: false,
    confirmationNextStepsHtml: CONFIRMATION_COMPANY,
    shortLabel: "Entreprise",
  },
  self: {
    key: "self",
    organizationLabel: "Autofinancement",
    packId: "convention_programme",
    dossierEmailSlug: "inscription_documents_self",
    documentTrigger: "after_full_payment",
    autoEnqueueAtSubmitWithoutPayment: false,
    confirmationNextStepsHtml: CONFIRMATION_SELF,
    shortLabel: "Autofinancement",
  },
};

/** Fallback historique si le slug dédié n'est pas encore publié. */
export const FUNDING_DOSSIER_EMAIL_FALLBACK_SLUG = "inscription_documents";

/**
 * Résout la clé de flux à partir du libellé DB ou de la clé formulaire.
 * Inconnu → `self` si payeur stagiaire ambigu, sinon on reste prudent via markers.
 */
export function resolveFundingFlowKey(
  fundingOrganizationOrType?: string | null,
): FundingFlowKey | null {
  const raw = (fundingOrganizationOrType || "").trim().toLowerCase();
  if (!raw) return null;

  if (raw === "fifpl" || raw.includes("fifpl") || raw.includes("fif-pl")) {
    return "fifpl";
  }
  if (raw === "agefice" || raw.includes("agefice")) return "agefice";
  if (raw === "opco" || raw.includes("opco")) return "opco";
  if (
    raw === "company" ||
    raw === "entreprise" ||
    raw.includes("entreprise") ||
    raw.includes("ecole") ||
    raw.includes("école") ||
    raw.includes("dsf") ||
    raw.includes("partenaire")
  ) {
    return "company";
  }
  if (
    raw === "self" ||
    raw.includes("autofinancement") ||
    raw.includes("auto-financement")
  ) {
    return "self";
  }
  return null;
}

export function getFundingFlow(
  fundingOrganizationOrType?: string | null,
): FundingFlowDefinition | null {
  const key = resolveFundingFlowKey(fundingOrganizationOrType);
  return key ? FUNDING_FLOWS[key] : null;
}

/** True si un rappel DOCUMENT peut être enfilé automatiquement pour ce financement. */
export function canAutoEnqueueInscriptionDocuments(
  fundingOrganization?: string | null,
): boolean {
  const flow = getFundingFlow(fundingOrganization);
  if (!flow) {
    // Legacy sans libellé : conserver le comportement payeur stagiaire + dépôt.
    return true;
  }
  return (
    flow.documentTrigger === "after_deposit" ||
    flow.documentTrigger === "after_full_payment"
  );
}

/**
 * Le paiement reçu autorise-t-il l'envoi du dossier pour ce financement ?
 * - after_deposit : acompte ou total
 * - after_full_payment (autofinancement) : total uniquement
 */
export function paymentTriggersDocumentEnqueue(
  fundingOrganization: string | null | undefined,
  payment: { status: string; amount: number; payment_type?: string | null },
): boolean {
  const status = (payment.status || "").toLowerCase();
  if (status !== "recu" && status !== "valide") return false;
  if (!(Number(payment.amount) > 0)) return false;

  const type = (payment.payment_type || "").toLowerCase();
  const flow = getFundingFlow(fundingOrganization);

  if (!flow) {
    return type === "acompte" || type === "total";
  }
  if (flow.documentTrigger === "after_full_payment") {
    return type === "total";
  }
  if (flow.documentTrigger === "after_deposit") {
    return type === "acompte" || type === "total";
  }
  return false;
}

/**
 * À la soumission sans flux de paiement : n'enfiler que si le flux le permet
 * explicitement (aujourd'hui aucun — OPCO est manuel).
 */
export function shouldEnqueueDocumentsAtSubmitWithoutPayment(
  fundingOrganization?: string | null,
): boolean {
  const flow = getFundingFlow(fundingOrganization);
  if (!flow) return true; // legacy devis / format perso
  return flow.autoEnqueueAtSubmitWithoutPayment;
}

export function dossierEmailSlugsForFunding(
  fundingOrganization?: string | null,
): string[] {
  const flow = getFundingFlow(fundingOrganization);
  if (!flow) return [FUNDING_DOSSIER_EMAIL_FALLBACK_SLUG];
  if (flow.dossierEmailSlug === FUNDING_DOSSIER_EMAIL_FALLBACK_SLUG) {
    return [FUNDING_DOSSIER_EMAIL_FALLBACK_SLUG];
  }
  return [flow.dossierEmailSlug, FUNDING_DOSSIER_EMAIL_FALLBACK_SLUG];
}

export function confirmationNextStepsHtmlForFunding(
  fundingOrganizationOrType?: string | null,
): string {
  const flow = getFundingFlow(fundingOrganizationOrType);
  return (
    flow?.confirmationNextStepsHtml ??
    FUNDING_FLOWS.self.confirmationNextStepsHtml
  );
}
