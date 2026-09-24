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

/**
 * Ordre de tentative pour createSignedUrl : bucket demandé d'abord, puis
 * documents / certificates (évite « Document indisponible » si le mauvais
 * bucket est passé par erreur). Les buckets hors de cette liste (ex.
 * evaluation-pdfs) ne sont pas ajoutés en secours.
 */
export function resolveDownloadBuckets(preferred: string): string[] {
  const extras = [DOCUMENTS_BUCKET, CERTIFICATE_BUCKET];
  const ordered = [preferred, ...extras.filter((b) => b !== preferred)];
  return [...new Set(ordered)];
}
