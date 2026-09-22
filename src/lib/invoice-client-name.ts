/**
 * Nom client affiché sur une facture.
 * Priorité : stagiaire lié → segment avant « — » dans les notes (import historique).
 */

export function clientNameFromInvoiceNotes(notes: string | null | undefined): string | null {
  if (!notes) return null;
  const firstLine = notes
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0 && !line.startsWith("---"));
  if (!firstLine) return null;
  // Import point 9 : « Nom Prénom — désignation… »
  const beforeDash = firstLine.split(/\s+[—–-]\s+/)[0]?.trim();
  if (!beforeDash) return null;
  // Ignore le bandeau technique d'import s'il était seul sur la ligne
  if (/^Import historique/i.test(beforeDash)) return null;
  return beforeDash;
}

export function resolveInvoiceClientName(invoice: {
  notes?: string | null;
  inscription?: { student_name?: string | null; student_company?: string | null } | null;
}): string {
  const fromStudent = invoice.inscription?.student_name?.trim();
  if (fromStudent) return fromStudent;
  const fromCompany = invoice.inscription?.student_company?.trim();
  if (fromCompany) return fromCompany;
  return clientNameFromInvoiceNotes(invoice.notes) || "-";
}
