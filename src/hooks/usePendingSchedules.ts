import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  SCHEDULE_OUT_OF_SCOPE_STATUSES,
  SCHEDULE_PENDING,
  groupPendingSchedules,
  scheduleDeadline,
  scheduleHorizonKey,
  todayKey,
  type PendingScheduleGroupOf,
} from "@/lib/schedule-validation";
import { needsMorningAfternoonGroup } from "@/lib/registration-group-notice";

export interface PendingScheduleInscription {
  id: string;
  code: string | null;
  language: string;
  start_date: string;
  /** BL-029 : start_date n'est que le début souhaité par le stagiaire. */
  dates_to_confirm: boolean;
  entry_level: string | null;
  /** Horaire repris du fichier d'import, quand il existe. */
  schedule: string | null;
  schedule_status: string;
  schedule_reminder_sent_at: string | null;
  status: string;
  modality: string | null;
  course_type: string | null;
  student_id: string | null;
  student_name: string;
  student_email: string | null;
  /** Vrai quand la formation a déjà commencé sans horaire validé. */
  late: boolean;
}

export type PendingScheduleGroup = PendingScheduleGroupOf<PendingScheduleInscription>;

export function usePendingSchedules() {
  return useQuery({
    queryKey: ["pending-schedules"],
    queryFn: async () => {
      const today = todayKey();
      const horizon = scheduleHorizonKey(today);

      // Pas de plancher sur start_date : une inscription dont le début est
      // passé sans horaire validé doit rester visible. Seules les inscriptions
      // dont le cycle est clos quittent la liste. Les individuels / en ligne
      // sont exclus : pas de groupe matin / après-midi à constituer.
      const { data, error } = await supabase
        .from("inscriptions")
        .select(
          `
          id,
          code,
          language,
          start_date,
          dates_to_confirm,
          entry_level,
          schedule,
          schedule_status,
          schedule_reminder_sent_at,
          status,
          modality,
          course_type,
          student_id,
          students!inner(first_name, last_name, email)
        `
        )
        .eq("schedule_status", SCHEDULE_PENDING)
        .not("status", "in", `(${SCHEDULE_OUT_OF_SCOPE_STATUSES.join(",")})`)
        .lte("start_date", horizon)
        .order("start_date", { ascending: true });

      if (error) throw error;

      const inscriptions: PendingScheduleInscription[] = (data || [])
        .filter((row) => needsMorningAfternoonGroup(row.modality, row.course_type))
        .map((row) => {
          const student = row.students as {
            first_name: string;
            last_name: string;
            email: string | null;
          } | null;
          return {
            id: row.id,
            code: row.code,
            language: row.language,
            start_date: row.start_date,
            dates_to_confirm: row.dates_to_confirm ?? false,
            entry_level: row.entry_level,
            schedule: row.schedule,
            schedule_status: row.schedule_status,
            schedule_reminder_sent_at: row.schedule_reminder_sent_at,
            status: row.status,
            modality: row.modality,
            course_type: row.course_type,
            student_id: row.student_id,
            student_name: student
              ? `${student.first_name} ${student.last_name}`.trim()
              : "—",
            student_email: student?.email ?? null,
            late: scheduleDeadline(row.start_date, today).late,
          };
        });

      const groups = groupPendingSchedules(inscriptions, today);

      return {
        inscriptions,
        groups,
        total: inscriptions.length,
        lateTotal: inscriptions.filter((i) => i.late).length,
      };
    },
  });
}
