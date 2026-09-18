/**
 * Checklist opérationnelle fiche inscription (Vague B).
 * Six jalons : horaire · docs · paiement · facture · portail · enquête.
 */

export type ChecklistItemKey =
  | "horaire"
  | "docs"
  | "paiement"
  | "facture"
  | "portail"
  | "enquete";

export interface ChecklistItem {
  key: ChecklistItemKey;
  label: string;
  done: boolean;
  detail: string;
  href?: string;
}

export interface InscriptionOpsChecklistInput {
  inscriptionId: string;
  scheduleStatus?: string | null;
  schedule?: string | null;
  documentsSentAt?: string | null;
  /** Undefined = données docs pas encore chargées → item non coché. */
  missingDocsCount?: number;
  paymentsReceivedTotal?: number;
  invoicesCount?: number;
  hasPortalAccount?: boolean;
  portalInviteSent?: boolean;
  hasSurvey?: boolean;
  surveyCompleted?: boolean;
}

const SCHEDULE_DONE = new Set([
  "approved",
  "valide",
  "validated",
  "confirme",
  "confirmé",
  "matin",
  "apres-midi",
  "après-midi",
]);

export function buildInscriptionOpsChecklist(
  input: InscriptionOpsChecklistInput
): ChecklistItem[] {
  const scheduleDone =
    SCHEDULE_DONE.has((input.scheduleStatus || "").toLowerCase()) ||
    Boolean(input.schedule?.trim());

  const docsDone =
    Boolean(input.documentsSentAt) ||
    (typeof input.missingDocsCount === "number" && input.missingDocsCount === 0);

  const paiementDone = (input.paymentsReceivedTotal ?? 0) > 0;
  const factureDone = (input.invoicesCount ?? 0) > 0;
  const portailDone = Boolean(input.hasPortalAccount || input.portalInviteSent);
  const enqueteDone = Boolean(input.hasSurvey);

  const base = `/inscriptions/${input.inscriptionId}`;

  return [
    {
      key: "horaire",
      label: "Horaire",
      done: scheduleDone,
      detail: scheduleDone
        ? input.schedule?.trim() || "Horaire renseigné / validé"
        : "À valider (dialog Horaire)",
      href: base,
    },
    {
      key: "docs",
      label: "Documents",
      done: docsDone,
      detail: docsDone
        ? input.documentsSentAt
          ? "Documents envoyés"
          : "Aucun document manquant"
        : typeof input.missingDocsCount === "number"
          ? `${input.missingDocsCount} document(s) manquant(s)`
          : "Documents à vérifier",
      href: `${base}?tab=documents`,
    },
    {
      key: "paiement",
      label: "Paiement",
      done: paiementDone,
      detail: paiementDone
        ? `${(input.paymentsReceivedTotal ?? 0).toFixed(0)} € encaissé(s)`
        : "Aucun paiement enregistré",
      href: `${base}?tab=financial`,
    },
    {
      key: "facture",
      label: "Facture",
      done: factureDone,
      detail: factureDone
        ? `${input.invoicesCount} facture(s)`
        : "Aucune facture",
      href: `${base}?tab=financial`,
    },
    {
      key: "portail",
      label: "Portail",
      done: portailDone,
      detail: input.hasPortalAccount
        ? "Compte stagiaire lié"
        : input.portalInviteSent
          ? "Invitation envoyée"
          : "Pas encore invité",
      href: `${base}?tab=access`,
    },
    {
      key: "enquete",
      label: "Enquête",
      done: enqueteDone,
      detail: input.surveyCompleted
        ? "Enquête complétée"
        : input.hasSurvey
          ? "Lien créé"
          : "Pas encore créée",
      href: `${base}?tab=access`,
    },
  ];
}

export function checklistCompletion(items: ChecklistItem[]): {
  done: number;
  total: number;
} {
  return { done: items.filter((i) => i.done).length, total: items.length };
}
