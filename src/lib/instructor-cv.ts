import { DOCUMENTS_BUCKET } from "@/lib/certificateStorage";

/** Préfixe Storage des CV formateur (bucket `documents`, staff seul). */
export const INSTRUCTOR_CV_STORAGE_PREFIX = "staff/instructors";

export const INSTRUCTOR_CV_BUCKET = DOCUMENTS_BUCKET;

export function buildInstructorCvPath(instructorId: string): string {
  const id = instructorId.trim();
  if (!id) throw new Error("instructorId requis");
  return `${INSTRUCTOR_CV_STORAGE_PREFIX}/${id}/cv.pdf`;
}

/** Lien Google Drive issu de l’import Point 3. */
export function isGoogleDriveCvUrl(value: string): boolean {
  return /drive\.google\.com/i.test(value.trim());
}

/** URL complète (Drive ou autre) vs chemin Storage. */
export function isExternalCvUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

export function instructorCvOpenLabel(value: string | null | undefined): string {
  if (!value?.trim()) return "Aucun CV";
  if (isGoogleDriveCvUrl(value)) return "Ouvrir le CV (Google Drive)";
  if (isExternalCvUrl(value)) return "Ouvrir le CV";
  return "Télécharger le CV";
}
