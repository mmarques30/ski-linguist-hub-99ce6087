import type { Json } from "@/integrations/supabase/types";
import type { RegistrationOffering } from "@/lib/registration-offerings";

export type FormateurInscriptionRow = {
  id: string;
  code: string | null;
  language: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  student_id: string | null;
  student_name: string | null;
  student_email: string | null;
  student_phone: string | null;
  student_city?: string | null;
  student_company?: string | null;
  course_location: string | null;
  course_address: string | null;
  modality: string | null;
  rhythm: string | null;
  schedule: string | null;
  group_name: string | null;
  ski_school_name: string | null;
  duration_hours?: number | null;
  expectations?: string | null;
  entry_test_id?: string | null;
  entry_test_score?: string | null;
  entry_level?: string | null;
  formulaire_entree?: Json | null;
  remarques_entree?: string | null;
  entry_form_completed_at?: string | null;
  exit_form_completed_at?: string | null;
  niveau_general_entree?: string | null;
  niveau_technique_entree?: string | null;
  niveau_general_sortie?: string | null;
  niveau_technique_sortie?: string | null;
};

/** Session catalogue (/register) rattachée au formateur, même sans inscrits. */
export type FormateurCatalogSession = {
  id: string;
  session_code: string | null;
  location_label: string;
  language_label: string;
  modality_label: string;
  format_label: string | null;
  date_label: string | null;
  start_date: string | null;
  end_date: string | null;
  duration_hours: number | null;
  enrollment_status: string | null;
  instructor_label: string | null;
};

export type FormateurInstructorIdentity = {
  id: string;
  first_name: string | null;
  last_name: string | null;
};

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** Casse / accents / espaces (y compris NBSP) ignorés. */
export function normalizeInstructorLabel(value: string | null | undefined): string {
  return stripAccents(value || "")
    .replace(/[\u00a0\u202f\u2007\u2009\ufeff]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Rapproche `instructor_label` du catalogue à une fiche formateur.
 * Accepte « Prénom Nom », « Nom Prénom », ou un seul jeton (= prénom ou nom).
 */
export function instructorLabelMatchesProfile(
  label: string | null | undefined,
  profile: Pick<FormateurInstructorIdentity, "first_name" | "last_name">
): boolean {
  const labelNorm = normalizeInstructorLabel(label);
  if (!labelNorm) return false;

  const first = normalizeInstructorLabel(profile.first_name);
  const last = normalizeInstructorLabel(profile.last_name);
  if (!first && !last) return false;

  const full = [first, last].filter(Boolean).join(" ");
  const fullRev = [last, first].filter(Boolean).join(" ");
  if (labelNorm === full || labelNorm === fullRev) return true;
  if (first && labelNorm === first) return true;
  if (last && labelNorm === last) return true;
  return false;
}

export function offeringMatchesInstructor(
  offering: Pick<RegistrationOffering, "instructor_label"> & {
    instructor_id?: string | null;
  },
  profile: FormateurInstructorIdentity
): boolean {
  // FK prioritaire : si renseigné, ne pas retomber sur le libellé (évite les collisions).
  if (offering.instructor_id) {
    return offering.instructor_id === profile.id;
  }
  return instructorLabelMatchesProfile(offering.instructor_label, profile);
}

export function toFormateurCatalogSession(
  offering: RegistrationOffering & { instructor_id?: string | null }
): FormateurCatalogSession {
  return {
    id: offering.id,
    session_code: offering.session_code ?? null,
    location_label: offering.location_label,
    language_label: offering.language_label,
    modality_label: offering.modality_label,
    format_label: offering.format_label ?? null,
    date_label: offering.date_label ?? null,
    start_date: offering.start_date,
    end_date: offering.end_date,
    duration_hours: offering.duration_hours ?? null,
    enrollment_status: offering.enrollment_status ?? null,
    instructor_label: offering.instructor_label ?? null,
  };
}

function splitByDates<T extends { start_date: string | null; end_date: string | null }>(
  rows: T[]
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming: T[] = [];
  const current: T[] = [];
  const past: T[] = [];

  for (const row of rows) {
    const start = row.start_date ? new Date(row.start_date) : null;
    const end = row.end_date ? new Date(row.end_date) : start;
    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(0, 0, 0, 0);

    if (end && end < today) {
      past.push(row);
    } else if (start && start > today) {
      upcoming.push(row);
    } else {
      current.push(row);
    }
  }

  upcoming.sort((a, b) => (a.start_date || "").localeCompare(b.start_date || ""));
  current.sort((a, b) => (a.start_date || "").localeCompare(b.start_date || ""));

  return { upcoming, current, past };
}

export function splitFormateurInscriptions(rows: FormateurInscriptionRow[]) {
  return splitByDates(rows);
}

export function splitFormateurCatalogSessions(rows: FormateurCatalogSession[]) {
  return splitByDates(rows);
}

export function uniqueStagiairesFromInscriptions(rows: FormateurInscriptionRow[]) {
  const byStudent = new Map<
    string,
    {
      studentId: string;
      name: string;
      email: string | null;
      phone: string | null;
      inscriptions: FormateurInscriptionRow[];
    }
  >();

  for (const row of rows) {
    const key = row.student_id || `anon:${row.id}`;
    const existing = byStudent.get(key);
    if (existing) {
      existing.inscriptions.push(row);
      continue;
    }
    byStudent.set(key, {
      studentId: key,
      name: row.student_name?.trim() || "Stagiaire",
      email: row.student_email,
      phone: row.student_phone,
      inscriptions: [row],
    });
  }

  return [...byStudent.values()].sort((a, b) => a.name.localeCompare(b.name, "fr"));
}
