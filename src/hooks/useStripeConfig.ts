import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StripeConfigStatus {
  secretKeyConfigured: boolean;
  webhookSecretConfigured: boolean;
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

      return data.data as StripeConfigStatus;
    },
    staleTime: 30_000,
  });
}
