import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isMassSendConfirmed } from "@/lib/email-guards";

export interface FormateurPortalInviteResult {
  instructorId: string;
  email: string;
  success: boolean;
  error?: string;
  emailSent?: boolean;
}

export function useInviteFormateurPortal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      instructorIds,
      sendEmail = true,
      confirmedCount,
    }: {
      instructorIds: string[];
      sendEmail?: boolean;
      confirmedCount?: number;
    }) => {
      if (!isMassSendConfirmed(instructorIds.length, confirmedCount)) {
        throw new Error(
          `Confirmation de masse requise : confirmez l'envoi de ${instructorIds.length} invitations`
        );
      }

      const { data, error } = await supabase.functions.invoke("invite-formateur-portal", {
        body: { instructorIds, sendEmail, confirmedCount },
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
        results: FormateurPortalInviteResult[];
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instructors"] });
      queryClient.invalidateQueries({ queryKey: ["instructor"] });
      queryClient.invalidateQueries({ queryKey: ["formateur-portal-invite-log"] });
    },
  });
}

export function useFormateurPortalInviteLog(instructorId: string | undefined) {
  return useQuery({
    queryKey: ["formateur-portal-invite-log", instructorId],
    enabled: Boolean(instructorId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_log")
        .select("id, sent_at, status, recipient_email")
        .eq("template_slug", "formateur_portal_invite")
        .contains("variables_used", { instructor_id: instructorId })
        .order("sent_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
