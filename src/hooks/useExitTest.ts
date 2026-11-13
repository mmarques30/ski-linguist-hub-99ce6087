import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { invokeAdminEdgeFunction } from "@/lib/admin-edge-invoke";

export type ExitTestContext = {
  test: {
    id: string;
    invite_token: string;
    language: string;
    status: string | null;
    completed_at: string | null;
    score_percentage: number | null;
    determined_level: string | null;
  };
  inscription: {
    id: string;
    code: string | null;
    language: string;
    start_date: string | null;
    end_date: string | null;
    course_location: string | null;
  } | null;
  student: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
};

export function useExitTestByToken(token: string | undefined) {
  return useQuery({
    queryKey: ["exit-test", token],
    queryFn: async () => {
      if (!token) throw new Error("Token required");
      const { data, error } = await supabase.rpc("get_exit_test_context", {
        p_token: token,
      });
      if (error) throw error;
      const context = (data ?? null) as ExitTestContext | null;
      if (!context?.test) throw new Error("Test de fin introuvable");
      return context;
    },
    enabled: !!token,
  });
}

export function useSubmitExitTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      token,
      payload,
    }: {
      token: string;
      payload: {
        answers: Record<string, unknown>;
        correct_answers: number;
        total_questions: number;
        score_percentage: number;
        determined_level: string;
      };
    }) => {
      const { error } = await supabase.rpc("submit_exit_test_by_token", {
        p_token: token,
        p_data: {
          ...payload,
          completed_at: new Date().toISOString(),
        },
      });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["exit-test", variables.token],
      });
    },
  });
}

export type SendExitTestInviteResult = {
  success?: boolean;
  sent?: boolean;
  to?: string;
  subject?: string;
  exit_test_link?: string;
  error?: string;
  message?: string;
};

export function useSendExitTestInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (inscriptionId: string) => {
      const result = await invokeAdminEdgeFunction<SendExitTestInviteResult>(
        "send-exit-test-invite",
        { inscriptionId }
      );
      if (result?.success === false || result?.error) {
        throw new Error(
          result.error || result.message || "Envoi du test de fin échoué"
        );
      }
      if (!result?.sent) {
        throw new Error(
          result?.message ||
            "Aucun e-mail envoyé — valider le modèle exit_test_invite."
        );
      }
      return result;
    },
    onSuccess: (data, inscriptionId) => {
      queryClient.invalidateQueries({ queryKey: ["inscription", inscriptionId] });
      queryClient.invalidateQueries({ queryKey: ["inscriptions"] });
      toast.success(
        data.to
          ? `Test de fin envoyé à ${data.to}`
          : "Test de fin de formation envoyé"
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de l'envoi du test de fin");
    },
  });
}
