/**
 * Type de client facture — détection DSF Formation (import / notes).
 */

export type InvoiceClientType = "stagiaire" | "ecole_ski" | "dsf" | "autre";

function fold(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Client facturé « DSF Formation » (nom ou tête de notes d'import). */
export function isDsfFormationClient(
  clientNameOrNotesHead: string | null | undefined
): boolean {
  if (!clientNameOrNotesHead) return false;
  const folded = fold(clientNameOrNotesHead);
  return folded === "dsf formation" || folded.startsWith("dsf formation ");
}

/**
 * Après classification paiement/ESF : force `dsf` si le nom client
 * (ou la tête des notes) est DSF Formation.
 */
export function applyDsfFormationClientType(
  clientType: InvoiceClientType,
  clientName: string | null | undefined,
  notes?: string | null
): InvoiceClientType {
  if (isDsfFormationClient(clientName)) return "dsf";
  const head =
    notes
      ?.split(/\r?\n/)
      .map((l) => l.trim())
      .find((l) => l.length > 0 && !l.startsWith("---"))
      ?.split(/\s+[—–-]\s+/)[0]
      ?.trim() || null;
  if (isDsfFormationClient(head)) return "dsf";
  return clientType;
}
