/**
 * Émargement — helpers purs (taux, créneaux, libellés).
 * Voir docs/POINT_EMARGEMENT.md
 */

import {
  FLI_SCHEDULE_HOURS,
  FLI_SCHEDULE_SLOT_LABELS,
  type FliScheduleSlot,
} from "@/lib/fli-schedule-slots";

export type AttendanceDayPart = "matin" | "apres-midi" | "custom";
export type AttendanceSlotStatus =
  | "draft"
  | "open"
  | "instructor_validated"
  | "admin_validated"
  | "closed";
export type AttendanceRecordStatus = "pending" | "present" | "absent" | "excuse";

export const ATTENDANCE_RECORD_LABELS: Record<AttendanceRecordStatus, string> = {
  pending: "En attente",
  present: "Présent",
  absent: "Absent",
  excuse: "Excusé",
};

export const ATTENDANCE_SLOT_STATUS_LABELS: Record<AttendanceSlotStatus, string> = {
  draft: "Brouillon",
  open: "Ouvert",
  instructor_validated: "Validé formateur",
  admin_validated: "Contre-signé",
  closed: "Fermé",
};

export const ATTENDANCE_DAY_PART_LABELS: Record<AttendanceDayPart, string> = {
  matin: FLI_SCHEDULE_SLOT_LABELS.matin,
  "apres-midi": FLI_SCHEDULE_SLOT_LABELS["apres-midi"],
  custom: "Cours",
};

/** Clé de cohorte pour collectif sans ligne `sessions`. */
export function buildAttendanceGroupKey(parts: {
  language?: string | null;
  courseLocation?: string | null;
  startDate?: string | null;
  groupName?: string | null;
  schedule?: string | null;
}): string {
  return [
    (parts.language || "").trim().toLowerCase(),
    (parts.courseLocation || "").trim().toLowerCase(),
    (parts.startDate || "").trim(),
    (parts.groupName || "").trim().toLowerCase(),
    (parts.schedule || "").trim().toLowerCase(),
  ].join("|");
}

/** Plages horaires d’un créneau matin / après-midi le jour donné (Europe/Paris approx. via offset local). */
export function slotRangeForDayPart(
  slotDate: string,
  dayPart: FliScheduleSlot
): { startsAt: Date; endsAt: Date } {
  const [y, m, d] = slotDate.split("-").map(Number);
  if (dayPart === "matin") {
    return {
      startsAt: new Date(y, m - 1, d, 8, 30, 0, 0),
      endsAt: new Date(y, m - 1, d, 12, 30, 0, 0),
    };
  }
  return {
    startsAt: new Date(y, m - 1, d, 13, 30, 0, 0),
    endsAt: new Date(y, m - 1, d, 17, 30, 0, 0),
  };
}

/** Créneau « à la volée » : maintenant → +durée (défaut 3 h). */
export function slotRangeOnTheFly(durationHours = 3, now = new Date()): {
  startsAt: Date;
  endsAt: Date;
  slotDate: string;
} {
  const startsAt = now;
  const endsAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000);
  const slotDate = [
    startsAt.getFullYear(),
    String(startsAt.getMonth() + 1).padStart(2, "0"),
    String(startsAt.getDate()).padStart(2, "0"),
  ].join("-");
  return { startsAt, endsAt, slotDate };
}

export function dayPartLabel(dayPart: AttendanceDayPart): string {
  if (dayPart === "matin" || dayPart === "apres-midi") {
    return `${ATTENDANCE_DAY_PART_LABELS[dayPart]} (${FLI_SCHEDULE_HOURS[dayPart].replace(/^de /, "")})`;
  }
  return ATTENDANCE_DAY_PART_LABELS.custom;
}

/**
 * Taux d’assiduité Paula :
 * (present + excuse) / (present + excuse + absent) × 100
 * pending ignorés.
 */
export function computeAttendanceRatePercent(
  records: Array<{ status: AttendanceRecordStatus }>
): number | null {
  let presentLike = 0;
  let counted = 0;
  for (const r of records) {
    if (r.status === "present" || r.status === "excuse") {
      presentLike += 1;
      counted += 1;
    } else if (r.status === "absent") {
      counted += 1;
    }
  }
  if (counted === 0) return null;
  return Math.round((1000 * presentLike) / counted) / 10;
}

export function canInstructorValidateSlot(
  records: Array<{ status: AttendanceRecordStatus }>
): boolean {
  if (records.length === 0) return false;
  return records.every((r) => r.status !== "pending");
}

export function buildEmargerUrl(origin: string, token: string): string {
  return `${origin.replace(/\/$/, "")}/emarger/${token}`;
}

export function formatSignedElectronically(signedAt: string | null | undefined): string {
  if (!signedAt) return "—";
  try {
    const d = new Date(signedAt);
    return `Signé électroniquement le ${d.toLocaleString("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    })}`;
  } catch {
    return "Signé électroniquement";
  }
}
