import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useStudentProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["student-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useStudentInscriptions(studentId: string | undefined) {
  return useQuery({
    queryKey: ["student-inscriptions", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const { data, error } = await supabase
        .from("inscriptions")
        .select("*, instructors(first_name, last_name)")
        .eq("student_id", studentId)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return (data || []).map((i: any) => ({
        ...i,
        instructor_name: i.instructors
          ? `${i.instructors.first_name} ${i.instructors.last_name}`
          : null,
      }));
    },
    enabled: !!studentId,
  });
}

export function useStudentSessions(studentId: string | undefined) {
  return useQuery({
    queryKey: ["student-sessions", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const { data: enrollments, error } = await supabase
        .from("session_enrollments")
        .select("*, sessions(*, instructors(first_name, last_name))")
        .eq("student_id", studentId);
      if (error) throw error;
      return (enrollments || [])
        .map((e: any) => e.sessions)
        .filter(Boolean)
        .sort(
          (a: any, b: any) =>
            new Date(a.start_datetime).getTime() -
            new Date(b.start_datetime).getTime()
        );
    },
    enabled: !!studentId,
  });
}

export function useStudentTests(studentId: string | undefined) {
  return useQuery({
    queryKey: ["student-tests", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const { data, error } = await supabase
        .from("placement_tests")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!studentId,
  });
}

export function useStudentCertificates(studentId: string | undefined) {
  return useQuery({
    queryKey: ["student-certificates", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const { data, error } = await supabase
        .from("certificates")
        .select("*")
        .eq("student_id", studentId)
        .order("issue_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!studentId,
  });
}

export function useStudentDocuments(studentId: string | undefined) {
  return useQuery({
    queryKey: ["student-documents", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      // Get inscriptions first to find their IDs
      const { data: inscriptions } = await supabase
        .from("inscriptions")
        .select("id, code")
        .eq("student_id", studentId);

      if (!inscriptions?.length) return [];

      const inscriptionIds = inscriptions.map((i) => i.id);
      const { data, error } = await supabase
        .from("document_sendings")
        .select("*")
        .in("inscription_id", inscriptionIds)
        .order("sent_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!studentId,
  });
}

export function useStudentSurveys(studentId: string | undefined) {
  return useQuery({
    queryKey: ["student-surveys", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const { data, error } = await supabase
        .from("satisfaction_surveys")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!studentId,
  });
}
