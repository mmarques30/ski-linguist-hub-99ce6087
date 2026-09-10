/**
 * Buckets privés : lecture staff, ou stagiaire propriétaire.
 * Convention de chemin commune : le premier segment est le student_id
 * (`staff/…` pour les objets internes du bucket `documents`).
 */
export const CERTIFICATE_BUCKET = "certificates";
export const DOCUMENTS_BUCKET = "documents";

export const CERTIFICATE_SIGNED_URL_TTL_SECONDS = 60 * 10;

export function buildCertificatePath(
  studentId: string,
  inscriptionId: string,
  certificateId: string
): string {
  return `${studentId}/${inscriptionId}/${certificateId}.pdf`;
}

/** Les documents émis avant les buckets privés ont une URL publique complète. */
export function isLegacyPublicUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}
