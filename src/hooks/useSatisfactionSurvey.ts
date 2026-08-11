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

      const { data, error } = await supabase.rpc("get_satisfaction_survey_context", {
        p_token: token,
      });

      if (error) throw error;
      const context = (data ?? null) as {
        survey?: SatisfactionSurvey;
        inscription?: SurveyWithInscription["inscription"];
        student?: SurveyWithInscription["student"];
      } | null;
      if (!context?.survey) throw new Error("Enquête introuvable");

      const survey = context.survey;
      return {
        ...survey,
        inscription: context.inscription ?? null,
        student: context.student ?? null,
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
      const { error } = await supabase.rpc("submit_satisfaction_survey_by_token", {
        p_token: token,
        p_data: {
          ...data,
          completed_at: new Date().toISOString(),
        },
      });

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
