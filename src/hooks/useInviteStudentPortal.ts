import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isMassSendConfirmed } from "@/lib/email-guards";

export interface PortalInviteResult {
  studentId: string;
  email: string;
  success: boolean;
  error?: string;
  emailSent?: boolean;
}

export function useInviteStudentPortal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      studentIds,
      sendEmail = true,
      confirmedCount,
    }: {
      studentIds: string[];
      sendEmail?: boolean;
      confirmedCount?: number;
    }) => {
      if (!isMassSendConfirmed(studentIds.length, confirmedCount)) {
        throw new Error(
          `Confirmation de masse requise : confirmez l'envoi de ${studentIds.length} invitations`
        );
      }

      const { data, error } = await supabase.functions.invoke("invite-student-portal", {
        body: { studentIds, sendEmail, confirmedCount },
      });

      if (error) {
        throw new Error(error.message || "Impossible d'envoyer les invitations");
      }

      if (!data?.success) {
        throw new Error(data?.error || "Impossible d'envoyer les invitations");
      }

      return data.data as {
        total: number;
        succeeded: number;
        failed: number;
        results: PortalInviteResult[];
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["student-details"] });
    },
  });
}
