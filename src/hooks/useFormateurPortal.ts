import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFormateurView } from "@/contexts/FormateurViewContext";
import type { FormateurInscriptionRow } from "@/lib/formateur-portal";

export type { FormateurInscriptionRow } from "@/lib/formateur-portal";
export {
  splitFormateurInscriptions,
  uniqueStagiairesFromInscriptions,
} from "@/lib/formateur-portal";

const INSCRIPTION_SELECT =
  "id, code, language, start_date, end_date, status, student_id, student_name, student_email, student_phone, course_location, course_address, modality, rhythm, schedule, group_name, ski_school_name";

/** Profil instructeur : soi-même (auth) ou cible Assister. */
export function useFormateurProfile() {
  const { user } = useAuth();
  const { isAssistMode, instructorId: assistInstructorId, isLoading: assistLoading } =
    useFormateurView();

  return useQuery({
    queryKey: [
      "formateur-portal-profile",
      isAssistMode ? assistInstructorId : user?.id,
    ],
    enabled: isAssistMode ? Boolean(assistInstructorId) && !assistLoading : Boolean(user),
    queryFn: async () => {
      if (isAssistMode) {
        const { data, error } = await supabase
          .from("instructors")
          .select(
            "id, first_name, last_name, email, phone, languages, status, city, photo_url"
          )
          .eq("id", assistInstructorId!)
          .maybeSingle();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from("instructors")
        .select(
          "id, first_name, last_name, email, phone, languages, status, city, photo_url"
        )
        .eq("auth_user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useFormateurInscriptions(instructorId: string | undefined) {
  return useQuery({
    queryKey: ["formateur-portal-inscriptions", instructorId],
    enabled: Boolean(instructorId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inscriptions_complete")
        .select(INSCRIPTION_SELECT)
        .eq("instructor_id", instructorId!)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as FormateurInscriptionRow[];
    },
  });
}

export function useFormateurSessions(instructorId: string | undefined) {
  return useQuery({
    queryKey: ["formateur-portal-sessions", instructorId],
    enabled: Boolean(instructorId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructor_sessions")
        .select(
          "id, session_date, start_time, end_time, duration_hours, status, location, notes, inscription_id, inscriptions(code, language, students(first_name, last_name))"
        )
        .eq("instructor_id", instructorId!)
        .order("session_date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}
