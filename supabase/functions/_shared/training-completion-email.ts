/**
 * Ajuste le texte du pack fin quand certaines PJ sont absentes
 * (ex. pas de certificat faute de formulaire de sortie).
 *
 * Aligné sur `src/lib/training-completion-email.ts` — garder les deux d'accord.
 */

export function stripCertificateMentionsFromCompletionEmail(input: {
  subject: string;
  html: string;
}): { subject: string; html: string } {
  const subject = input.subject
    .replace(/\s*:\s*certificat,\s*/gi, " : ")
    .replace(/certificat,\s*/gi, "")
    .replace(/,\s*certificat(\s+et)?/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  const html = input.html
    // Liste à puces du modèle 10a
    .replace(
      /<li[^>]*>\s*Certificat de fin de formation\s*<\/li>\s*/gi,
      ""
    )
    .replace(/certificat,\s*attestation/gi, "attestation")
    .replace(/certificat et attestation/gi, "attestation");

  return { subject, html };
}
