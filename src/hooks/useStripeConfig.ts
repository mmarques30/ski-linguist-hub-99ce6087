import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StripeConfigStatus {
  secretKeyConfigured: boolean;
  webhookSecretConfigured: boolean;
  hasSecretKey?: boolean;
  hasWebhookSecret?: boolean;
  keyValid: boolean;
  mode: "test" | "live" | null;
  configured: boolean;
  keyError?: string;
  webhookUrl: string | null;
  checkoutFunction: string;
  webhookFunction: string;
  requiredEvents: string[];
}

export function useStripeConfig() {
  return useQuery({
    queryKey: ["stripe-config"],
    queryFn: async (): Promise<StripeConfigStatus> => {
      const { data, error } = await supabase.functions.invoke("check-stripe-config");

      if (error) {
        throw new Error(error.message || "Impossible de vérifier la configuration Stripe");
      }

      if (!data?.success) {
        throw new Error(data?.error || "Impossible de vérifier la configuration Stripe");
      }

      const status = data.data as StripeConfigStatus;
      return {
        ...status,
        secretKeyConfigured: status.secretKeyConfigured ?? status.hasSecretKey ?? false,
        webhookSecretConfigured: status.webhookSecretConfigured ?? status.hasWebhookSecret ?? false,
      };
    },
    staleTime: 30_000,
  });
}
