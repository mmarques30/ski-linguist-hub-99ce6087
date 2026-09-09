import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StripeConfigStatus {
  secretKeyConfigured: boolean;
  secretKeyValid: boolean;
  secretKeyError: string | null;
  webhookSecretConfigured: boolean;
  webhookSecretFromEnv?: boolean;
  webhookSecretFromSettings?: boolean;
  mode: "test" | "live" | null;
  configured: boolean;
  webhookUrl: string | null;
  checkoutFunction: string;
  verifyCheckoutFunction?: string;
  provisionWebhookFunction?: string;
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

      return data.data as StripeConfigStatus;
    },
    staleTime: 30_000,
  });
}

export function useProvisionStripeWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("provision-stripe-webhook");

      if (error) {
        throw new Error(error.message || "Impossible de configurer le webhook Stripe");
      }

      if (!data?.success) {
        throw new Error(data?.error || "Impossible de configurer le webhook Stripe");
      }

      return data.data as {
        webhookUrl: string;
        endpointId: string;
        created: boolean;
        webhookSecretConfigured: boolean;
        envSecretConfigured: boolean;
        message: string;
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stripe-config"] });
    },
  });
}
