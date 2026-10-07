import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { STAFF_SMS_EDGE } from "@/lib/staff-sms";

export type SendStaffSmsInput = {
  to: string;
  content: string;
  templateSlug?: string;
  recipientName?: string | null;
  studentId?: string | null;
  inscriptionId?: string | null;
};

export function useSendStaffSms() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SendStaffSmsInput) => {
      const { data, error } = await supabase.functions.invoke(STAFF_SMS_EDGE, {
        body: input,
      });

      if (error) {
        throw new Error(error.message || "Impossible d'envoyer le SMS");
      }
      if (!data?.success) {
        throw new Error(data?.error || "Impossible d'envoyer le SMS");
      }
      return data.data as {
        to: string;
        sender: string;
        messageId: string | number | null;
        templateSlug: string;
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-log"] });
      queryClient.invalidateQueries({ queryKey: ["email-log-journal"] });
    },
  });
}
