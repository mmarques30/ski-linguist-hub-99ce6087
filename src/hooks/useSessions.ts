import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Session {
  id: string;
  title: string;
  season_id: string | null;
  instructor_id: string | null;
  language: string;
  level: string;
  modality: string;
  max_students: number;
  current_students: number;
  start_datetime: string;
  end_datetime: string;
  recurrence: string | null;
  location: string | null;
  room: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  instructor_first_name?: string | null;
  instructor_last_name?: string | null;
}

export interface SessionEnrollment {
  id: string;
  session_id: string;
  inscription_id: string | null;
  student_id: string;
  attendance_status: string;
  notes: string | null;
  created_at: string;
  // Joined
  student_first_name?: string;
  student_last_name?: string;
  student_email?: string;
}

export function useSessions(filters?: {
  startDate?: string;
  endDate?: string;
  language?: string;
  instructorId?: string;
}) {
  return useQuery({
    queryKey: ["sessions", filters],
    queryFn: async () => {
      let query = supabase
        .from("sessions")
        .select("*, instructors(first_name, last_name)")
        .order("start_datetime", { ascending: true });

      if (filters?.startDate) {
        query = query.gte("start_datetime", filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte("start_datetime", filters.endDate);
      }
      if (filters?.language && filters.language !== "all") {
        query = query.eq("language", filters.language);
      }
      if (filters?.instructorId && filters.instructorId !== "all") {
        query = query.eq("instructor_id", filters.instructorId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((s: any) => ({
        ...s,
        instructor_first_name: s.instructors?.first_name || null,
        instructor_last_name: s.instructors?.last_name || null,
      })) as Session[];
    },
  });
}

export function useSessionEnrollments(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["session-enrollments", sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const { data, error } = await supabase
        .from("session_enrollments")
        .select("*, students(first_name, last_name, email)")
        .eq("session_id", sessionId);
      if (error) throw error;
      return (data || []).map((e: any) => ({
        ...e,
        student_first_name: e.students?.first_name,
        student_last_name: e.students?.last_name,
        student_email: e.students?.email,
      })) as SessionEnrollment[];
    },
    enabled: !!sessionId,
  });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (session: Omit<Session, "id" | "created_at" | "updated_at" | "current_students" | "instructor_first_name" | "instructor_last_name">) => {
      const { data, error } = await supabase
        .from("sessions")
        .insert(session)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

export function useUpdateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Session> & { id: string }) => {
      const { data, error } = await supabase
        .from("sessions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sessions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

export function useEnrollStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (enrollment: { session_id: string; student_id: string; inscription_id?: string }) => {
      // Check max students
      const { data: session } = await supabase
        .from("sessions")
        .select("max_students, current_students")
        .eq("id", enrollment.session_id)
        .single();

      if (session && session.current_students >= session.max_students) {
        throw new Error("Session complète — nombre maximum d'étudiants atteint");
      }

      // Check student time conflict
      const { data: sessionData } = await supabase
        .from("sessions")
        .select("start_datetime, end_datetime")
        .eq("id", enrollment.session_id)
        .single();

      if (sessionData) {
        const { data: conflicts } = await supabase
          .from("session_enrollments")
          .select("session_id, sessions(start_datetime, end_datetime)")
          .eq("student_id", enrollment.student_id);

        const hasConflict = (conflicts || []).some((c: any) => {
          const s = c.sessions;
          if (!s) return false;
          return (
            new Date(s.start_datetime) < new Date(sessionData.end_datetime) &&
            new Date(s.end_datetime) > new Date(sessionData.start_datetime)
          );
        });

        if (hasConflict) {
          throw new Error("Ce stagiaire a déjà une session au même créneau");
        }
      }

      const { data, error } = await supabase
        .from("session_enrollments")
        .insert(enrollment)
        .select()
        .single();
      if (error) throw error;

      // Increment current_students
      await supabase.rpc("increment_session_students" as any, { p_session_id: enrollment.session_id });

      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      qc.invalidateQueries({ queryKey: ["session-enrollments", vars.session_id] });
    },
  });
}

export function useRemoveEnrollment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, sessionId }: { id: string; sessionId: string }) => {
      const { error } = await supabase.from("session_enrollments").delete().eq("id", id);
      if (error) throw error;

      // Decrement current_students
      const { data: session } = await supabase
        .from("sessions")
        .select("current_students")
        .eq("id", sessionId)
        .single();

      if (session) {
        await supabase
          .from("sessions")
          .update({ current_students: Math.max(0, (session.current_students || 1) - 1) })
          .eq("id", sessionId);
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      qc.invalidateQueries({ queryKey: ["session-enrollments", vars.sessionId] });
    },
  });
}

// Check instructor conflict
export async function checkInstructorConflict(
  instructorId: string,
  startDatetime: string,
  endDatetime: string,
  excludeSessionId?: string
): Promise<boolean> {
  let query = supabase
    .from("sessions")
    .select("id")
    .eq("instructor_id", instructorId)
    .lt("start_datetime", endDatetime)
    .gt("end_datetime", startDatetime)
    .neq("status", "annulee");

  if (excludeSessionId) {
    query = query.neq("id", excludeSessionId);
  }

  const { data } = await query;
  return (data || []).length > 0;
}

// Unassigned inscriptions (no session enrollment)
export function useUnassignedInscriptions() {
  return useQuery({
    queryKey: ["unassigned-inscriptions"],
    queryFn: async () => {
      // Get all inscription IDs that have session enrollments
      const { data: enrolled } = await supabase
        .from("session_enrollments")
        .select("inscription_id");

      const enrolledIds = (enrolled || [])
        .map((e) => e.inscription_id)
        .filter(Boolean) as string[];

      // Get active inscriptions not in that list
      let query = supabase
        .from("inscriptions")
        .select("id, code, language, student_id, students(first_name, last_name)")
        .in("status", ["confirmee", "en_cours"])
        .order("created_at", { ascending: false })
        .limit(50);

      const { data, error } = await query;
      if (error) throw error;

      // Filter client-side for those not enrolled
      return (data || [])
        .filter((i: any) => !enrolledIds.includes(i.id))
        .map((i: any) => ({
          id: i.id,
          code: i.code,
          language: i.language,
          student_id: i.student_id,
          student_name: i.students ? `${i.students.first_name} ${i.students.last_name}` : "—",
        }));
    },
  });
}
