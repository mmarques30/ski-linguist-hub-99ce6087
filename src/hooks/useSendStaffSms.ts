import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invokeAdminEdgeFunction } from "@/lib/admin-edge-invoke";
import { STAFF_SMS_EDGE } from "@/lib/staff-sms";

export type SendStaffSmsInput = {
  to: string;
  content: string;
  templateSlug?: string;
  recipientName?: string | null;
  studentId?: string | null;
  inscriptionId?: string | null;
};

type SendStaffSmsResponse = {
  success: boolean;
  error?: string;
  data?: {
    to: string;
    sender: string;
    messageId: string | number | null;
    templateSlug: string;
  };
};

export function useSendStaffSms() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SendStaffSmsInput) => {
      const payload = await invokeAdminEdgeFunction<SendStaffSmsResponse>(
        STAFF_SMS_EDGE,
        input
      );
      if (!payload?.success || !payload.data) {
        throw new Error(payload?.error || "Impossible d'envoyer le SMS");
      }
      return payload.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-log"] });
      queryClient.invalidateQueries({ queryKey: ["email-log-journal"] });
    },
  });
}
