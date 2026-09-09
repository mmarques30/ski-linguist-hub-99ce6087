import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SCHEDULE_ASSIGNMENT_DAYS_BEFORE } from "@/lib/placement-test-engine";

export interface PendingScheduleInscription {
  id: string;
  code: string | null;
  language: string;
  start_date: string;
  entry_level: string | null;
  schedule_status: string;
  schedule_reminder_sent_at: string | null;
  student_id: string | null;
  student_name: string;
  student_email: string | null;
}

export interface PendingScheduleGroup {
  startDate: string;
  language: string;
  inscriptions: PendingScheduleInscription[];
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function usePendingSchedules() {
  return useQuery({
    queryKey: ["pending-schedules"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const horizon = addDays(today, SCHEDULE_ASSIGNMENT_DAYS_BEFORE);
      const todayKey = formatDateKey(today);
      const horizonKey = formatDateKey(horizon);

      const { data, error } = await supabase
        .from("inscriptions")
        .select(
          `
          id,
          code,
          language,
          start_date,
          entry_level,
          schedule_status,
          schedule_reminder_sent_at,
          student_id,
          students!inner(first_name, last_name, email)
        `
        )
        .eq("schedule_status", "pending")
        .neq("status", "annulee")
        .gte("start_date", todayKey)
        .lte("start_date", horizonKey)
        .order("start_date", { ascending: true });

      if (error) throw error;

      const inscriptions: PendingScheduleInscription[] = (data || []).map((row) => {
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
          entry_level: row.entry_level,
          schedule_status: row.schedule_status,
          schedule_reminder_sent_at: row.schedule_reminder_sent_at,
          student_id: row.student_id,
          student_name: student
            ? `${student.first_name} ${student.last_name}`.trim()
            : "—",
          student_email: student?.email ?? null,
        };
      });

      const groupMap = new Map<string, PendingScheduleGroup>();

      for (const inscription of inscriptions) {
        const key = `${inscription.start_date}::${inscription.language}`;
        const existing = groupMap.get(key);
        if (existing) {
          existing.inscriptions.push(inscription);
        } else {
          groupMap.set(key, {
            startDate: inscription.start_date,
            language: inscription.language,
            inscriptions: [inscription],
          });
        }
      }

      return {
        inscriptions,
        groups: Array.from(groupMap.values()).sort((a, b) =>
          a.startDate.localeCompare(b.startDate)
        ),
        total: inscriptions.length,
      };
    },
  });
}
