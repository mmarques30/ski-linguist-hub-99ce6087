// Validation des horaires J-10
//
// La liste ne montrait que les inscriptions dont la date de début tombe entre
// aujourd'hui et J+10. Une inscription dont le début est passé sans que
// l'horaire ait été validé disparaissait donc de l'écran, silencieusement,
// quelle que soit son origine : saisie back-office, conversion de prospect,
// import CSV ou formulaire public arrivé moins de dix jours avant le départ.
// La base en comptait 23 dans ce cas, la plus ancienne datant du 18/07/2024.
//
// Les inscriptions dont le cycle est terminé (terminée, facturée, annulée) ne
// sont pas des retards : elles quittent le flux J-10.

import { SCHEDULE_ASSIGNMENT_DAYS_BEFORE } from '@/lib/placement-test-engine';

export const SCHEDULE_PENDING = 'pending';

export const SCHEDULE_SLOTS = ['matin', 'apres-midi'] as const;

export type ScheduleSlot = (typeof SCHEDULE_SLOTS)[number];

export const SCHEDULE_SLOT_LABELS: Record<ScheduleSlot, string> = {
  matin: 'Matin',
  'apres-midi': 'Après-midi',
};

/** Statuts d'inscription qui sortent définitivement du flux J-10. */
export const SCHEDULE_OUT_OF_SCOPE_STATUSES = ['terminee', 'facturee', 'annulee'];

export function todayKey(now: Date = new Date()): string {
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().split('T')[0];
}

export function addDaysKey(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split('T')[0];
}

/** Horizon haut de la liste : J+10 inclus. */
export function scheduleHorizonKey(today: string): string {
  return addDaysKey(today, SCHEDULE_ASSIGNMENT_DAYS_BEFORE);
}

export function daysBetween(fromKey: string, toKey: string): number {
  const from = Date.parse(`${fromKey}T00:00:00Z`);
  const to = Date.parse(`${toKey}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to)) return 0;
  return Math.round((to - from) / 86_400_000);
}

export interface ScheduleDeadline {
  /** Jours restants avant le début ; négatif quand la date est passée. */
  days: number;
  late: boolean;
  /** Libellé court affiché sur le groupe. */
  label: string;
}

export function scheduleDeadline(startDate: string, today: string): ScheduleDeadline {
  const days = daysBetween(today, startDate);

  if (days < 0) {
    const retard = Math.abs(days);
    return {
      days,
      late: true,
      label: retard === 1 ? 'Commencée depuis 1 jour' : `Commencée depuis ${retard} jours`,
    };
  }
  if (days === 0) return { days, late: false, label: "Commence aujourd'hui" };
  if (days === 1) return { days, late: false, label: 'Commence demain' };
  return { days, late: false, label: `Commence dans ${days} jours` };
}

export interface PendingScheduleRow {
  id: string;
  start_date: string;
  language: string;
}

export interface PendingScheduleGroupOf<T extends PendingScheduleRow> {
  startDate: string;
  language: string;
  deadline: ScheduleDeadline;
  inscriptions: T[];
}

/**
 * Regroupe par date de début et langue, retards d'abord (du plus ancien au
 * plus récent), puis les échéances à venir.
 */
export function groupPendingSchedules<T extends PendingScheduleRow>(
  rows: T[],
  today: string
): PendingScheduleGroupOf<T>[] {
  const groups = new Map<string, PendingScheduleGroupOf<T>>();

  for (const row of rows) {
    const key = `${row.start_date}::${row.language}`;
    const existing = groups.get(key);
    if (existing) {
      existing.inscriptions.push(row);
      continue;
    }
    groups.set(key, {
      startDate: row.start_date,
      language: row.language,
      deadline: scheduleDeadline(row.start_date, today),
      inscriptions: [row],
    });
  }

  return Array.from(groups.values()).sort((a, b) => {
    if (a.deadline.late !== b.deadline.late) return a.deadline.late ? -1 : 1;
    const parDate = a.startDate.localeCompare(b.startDate);
    return parDate !== 0 ? parDate : a.language.localeCompare(b.language);
  });
}
