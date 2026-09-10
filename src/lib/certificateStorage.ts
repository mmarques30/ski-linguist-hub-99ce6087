/** Bucket privé : lecture staff, ou stagiaire propriétaire (1er segment = student_id). */
export const CERTIFICATE_BUCKET = "certificates";

export const CERTIFICATE_SIGNED_URL_TTL_SECONDS = 60 * 10;

export function buildCertificatePath(
  studentId: string,
  inscriptionId: string,
  certificateId: string
): string {
  return `${studentId}/${inscriptionId}/${certificateId}.pdf`;
}

/** Les certificats émis avant le bucket privé ont une URL publique complète. */
export function isLegacyPublicUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}
