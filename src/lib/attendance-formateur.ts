/**
 * Émargement formateur — regroupement demi-journée (matin / après-midi)
 * et option « tous ensemble » (vendredi).
 *
 * Cas métier station : 2 groupes L→V (matin / AP), tous réunis le vendredi.
 */

import { buildAttendanceGroupKey } from "@/lib/attendance";
import {
  FLI_SCHEDULE_SLOT_LABELS,
  inferSlotFromSchedule,
  type FliScheduleSlot,
} from "@/lib/fli-schedule-slots";
import type { FormateurInscriptionRow } from "@/lib/formateur-portal";
import { displayLanguageLabel } from "@/lib/taught-languages";

export type AttendanceMember = {
  inscriptionId: string;
  studentId: string;
  studentName: string;
};

export type HalfDayOpenOption = {
  id: string;
  kind: "half-day" | "ensemble";
  dayPart: FliScheduleSlot;
  groupKey: string;
  title: string;
  subtitle: string;
  members: AttendanceMember[];
};

type SessionBase = {
  language: string;
  location: string;
  startDate: string;
  endDate: string;
};

function sessionBaseOf(row: FormateurInscriptionRow): SessionBase | null {
  const language = (row.language || "").trim().toLowerCase();
  const location = (row.course_location || "").trim().toLowerCase();
  const startDate = (row.start_date || "").trim();
  const endDate = (row.end_date || "").trim();
  if (!language || !startDate || !endDate) return null;
  return { language, location, startDate, endDate };
}

function sessionBaseKey(base: SessionBase): string {
  return [base.language, base.location, base.startDate, base.endDate].join("|");
}

/** Stagiaire dont la mission couvre la date (YYYY-MM-DD). */
export function inscriptionActiveOnDate(
  row: FormateurInscriptionRow,
  slotDate: string
): boolean {
  const start = (row.start_date || "").slice(0, 10);
  const end = (row.end_date || row.start_date || "").slice(0, 10);
  if (!start) return false;
  return start <= slotDate && slotDate <= end;
}

export function isFridayIsoDate(slotDate: string): boolean {
  const [y, m, d] = slotDate.split("-").map(Number);
  if (!y || !m || !d) return false;
  // Midi local pour éviter les décalages UTC
  return new Date(y, m - 1, d, 12, 0, 0).getDay() === 5;
}

export function todayIsoDate(now = new Date()): string {
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

export function buildHalfDayGroupKey(
  base: SessionBase,
  dayPart: FliScheduleSlot
): string {
  return buildAttendanceGroupKey({
    language: base.language,
    courseLocation: base.location,
    startDate: base.startDate,
    groupName: `half-${dayPart}`,
    schedule: dayPart,
  });
}

/** Même clé pour matin et après-midi « ensemble » — différenciés par day_part. */
export function buildEnsembleGroupKey(base: SessionBase): string {
  return buildAttendanceGroupKey({
    language: base.language,
    courseLocation: base.location,
    startDate: base.startDate,
    groupName: "ensemble",
    schedule: "ensemble",
  });
}

function toMembers(rows: FormateurInscriptionRow[]): AttendanceMember[] {
  const out: AttendanceMember[] = [];
  for (const row of rows) {
    if (!row.student_id) continue;
    out.push({
      inscriptionId: row.id,
      studentId: row.student_id,
      studentName: row.student_name?.trim() || "Stagiaire",
    });
  }
  return out.sort((a, b) => a.studentName.localeCompare(b.studentName, "fr"));
}

function sessionLabel(base: SessionBase, sample: FormateurInscriptionRow): string {
  const lang = sample.language
    ? displayLanguageLabel(sample.language)
    : base.language;
  const place = sample.course_location?.trim() || base.location || "Station";
  return `${lang} · ${place}`;
}

/**
 * Options d'ouverture pour une date :
 * - Groupe matin / Groupe après-midi (si stagiaires avec horaire FLI)
 * - Le vendredi : « Tous ensemble » matin et/ou après-midi (tous les stagiaires de la session)
 */
export function listHalfDayOpenOptions(
  inscriptions: FormateurInscriptionRow[],
  slotDate: string
): HalfDayOpenOption[] {
  const active = inscriptions.filter((r) => inscriptionActiveOnDate(r, slotDate));
  const bySession = new Map<
    string,
    { base: SessionBase; sample: FormateurInscriptionRow; rows: FormateurInscriptionRow[] }
  >();

  for (const row of active) {
    const base = sessionBaseOf(row);
    if (!base) continue;
    const key = sessionBaseKey(base);
    const existing = bySession.get(key);
    if (existing) {
      existing.rows.push(row);
    } else {
      bySession.set(key, { base, sample: row, rows: [row] });
    }
  }

  const friday = isFridayIsoDate(slotDate);
  const options: HalfDayOpenOption[] = [];

  for (const { base, sample, rows } of bySession.values()) {
    const label = sessionLabel(base, sample);
    const matinRows = rows.filter(
      (r) => inferSlotFromSchedule(r.schedule) === "matin"
    );
    const apresRows = rows.filter(
      (r) => inferSlotFromSchedule(r.schedule) === "apres-midi"
    );

    if (matinRows.length > 0) {
      const members = toMembers(matinRows);
      if (members.length > 0) {
        options.push({
          id: `half|${sessionBaseKey(base)}|matin`,
          kind: "half-day",
          dayPart: "matin",
          groupKey: buildHalfDayGroupKey(base, "matin"),
          title: `Groupe matin — ${label}`,
          subtitle: `${members.length} stagiaire${members.length > 1 ? "s" : ""} · ${FLI_SCHEDULE_SLOT_LABELS.matin} (8h30–12h30)`,
          members,
        });
      }
    }

    if (apresRows.length > 0) {
      const members = toMembers(apresRows);
      if (members.length > 0) {
        options.push({
          id: `half|${sessionBaseKey(base)}|apres-midi`,
          kind: "half-day",
          dayPart: "apres-midi",
          groupKey: buildHalfDayGroupKey(base, "apres-midi"),
          title: `Groupe après-midi — ${label}`,
          subtitle: `${members.length} stagiaire${members.length > 1 ? "s" : ""} · ${FLI_SCHEDULE_SLOT_LABELS["apres-midi"]} (13h30–17h30)`,
          members,
        });
      }
    }

    // Vendredi : tous les stagiaires de la session, quel que soit le créneau habituel
    if (friday) {
      const allMembers = toMembers(rows);
      if (allMembers.length >= 2) {
        const ensembleKey = buildEnsembleGroupKey(base);
        for (const dayPart of ["matin", "apres-midi"] as FliScheduleSlot[]) {
          options.push({
            id: `ensemble|${sessionBaseKey(base)}|${dayPart}`,
            kind: "ensemble",
            dayPart,
            groupKey: ensembleKey,
            title: `Tous ensemble (${FLI_SCHEDULE_SLOT_LABELS[dayPart].toLowerCase()}) — ${label}`,
            subtitle: `${allMembers.length} stagiaires · vendredi · ${
              dayPart === "matin" ? "8h30–12h30" : "13h30–17h30"
            }`,
            members: allMembers,
          });
        }
      }
    }
  }

  return options.sort((a, b) => a.title.localeCompare(b.title, "fr"));
}
