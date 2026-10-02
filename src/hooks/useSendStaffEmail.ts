import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SendStaffEmailInput = {
  to: string;
  subject: string;
  bodyText: string;
  recipientName?: string | null;
  studentId?: string | null;
  inscriptionId?: string | null;
};

export function useSendStaffEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SendStaffEmailInput) => {
      const { data, error } = await supabase.functions.invoke("send-staff-email", {
        body: input,
      });

      if (error) {
        throw new Error(error.message || "Impossible d'envoyer l'e-mail");
      }
      if (!data?.success) {
        throw new Error(data?.error || "Impossible d'envoyer l'e-mail");
      }
      return data.data as { to: string; subject: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-log"] });
      queryClient.invalidateQueries({ queryKey: ["inscription-client-access"] });
    },
  });
}
