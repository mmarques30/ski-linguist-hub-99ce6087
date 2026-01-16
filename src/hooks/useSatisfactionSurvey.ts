import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SatisfactionSurvey {
  id: string;
  inscription_id: string;
  student_id: string;
  token: string;
  satisfaction_content: number | null;
  satisfaction_animation: number | null;
  satisfaction_duration: number | null;
  satisfaction_utility: number | null;
  satisfaction_materials: number | null;
  satisfaction_organization: number | null;
  satisfaction_expectations: number | null;
  strong_points: string | null;
  weak_points: string | null;
  exit_test_scores: Record<string, number> | null;
  completed_at: string | null;
  reminder_1_sent_at: string | null;
  reminder_2_sent_at: string | null;
  created_at: string;
}

export interface SurveyWithInscription extends SatisfactionSurvey {
  inscription: {
    id: string;
    code: string | null;
    language: string;
    start_date: string;
    end_date: string;
    duration_hours: number | null;
    course_location: string | null;
    instructor_name?: string | null;
  } | null;
  student: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

export function useSurveyByToken(token: string | undefined) {
  return useQuery({
    queryKey: ["survey", token],
    queryFn: async () => {
      if (!token) throw new Error("Token required");

      // First get the survey
      const { data: survey, error: surveyError } = await supabase
        .from("satisfaction_surveys")
        .select("*")
        .eq("token", token)
        .single();

      if (surveyError) throw surveyError;

      // Get inscription data
      const { data: inscription, error: inscriptionError } = await supabase
        .from("inscriptions_complete")
        .select("*")
        .eq("id", survey.inscription_id)
        .single();

      if (inscriptionError && inscriptionError.code !== "PGRST116") {
        console.error("Error fetching inscription:", inscriptionError);
      }

      // Get student data
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select("id, first_name, last_name, email")
        .eq("id", survey.student_id)
        .single();

      if (studentError && studentError.code !== "PGRST116") {
        console.error("Error fetching student:", studentError);
      }

      return {
        ...survey,
        inscription: inscription ? {
          id: inscription.id,
          code: inscription.code,
          language: inscription.language,
          start_date: inscription.start_date,
          end_date: inscription.end_date,
          duration_hours: inscription.duration_hours,
          course_location: inscription.course_location,
          instructor_name: inscription.instructor_name,
        } : null,
        student: student || null,
      } as SurveyWithInscription;
    },
    enabled: !!token,
  });
}

export function useSubmitSurvey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      token,
      data,
    }: {
      token: string;
      data: Partial<SatisfactionSurvey>;
    }) => {
      const { error } = await supabase
        .from("satisfaction_surveys")
        .update({
          ...data,
          completed_at: new Date().toISOString(),
        })
        .eq("token", token);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["survey", variables.token] });
    },
  });
}

export function useCreateSurveyForInscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      inscriptionId,
      studentId,
    }: {
      inscriptionId: string;
      studentId: string;
    }) => {
      // Check if survey already exists
      const { data: existing } = await supabase
        .from("satisfaction_surveys")
        .select("token")
        .eq("inscription_id", inscriptionId)
        .single();

      if (existing) {
        return existing.token;
      }

      // Create new survey
      const { data, error } = await supabase
        .from("satisfaction_surveys")
        .insert({
          inscription_id: inscriptionId,
          student_id: studentId,
        })
        .select("token")
        .single();

      if (error) throw error;
      return data.token;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["satisfaction_surveys"] });
    },
  });
}
