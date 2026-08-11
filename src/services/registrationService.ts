import { supabase } from "@/integrations/supabase/client";
import type { RegistrationData } from "@/pages/register/Index";
import type { RegistrationPaymentOption } from "@/lib/registration-payments";

export interface RegistrationSubmissionResult {
  inscriptionId: string;
  inscriptionCode: string;
  studentId: string;
  needsAdminCall: boolean;
  emailSent: boolean;
  paymentFlow: "stripe" | "virement" | "none";
  documentsSent?: boolean;
}

export async function submitRegistration(
  data: RegistrationData
): Promise<RegistrationSubmissionResult> {
  const { data: result, error } = await supabase.functions.invoke("submit-registration", {
    body: { registration: data },
  });

  if (error) {
    throw new Error(error.message || "Erreur lors de la soumission de l'inscription");
  }

  if (!result?.success) {
    throw new Error(result?.error || "Erreur lors de la soumission de l'inscription");
  }

  return result.data as RegistrationSubmissionResult;
}

export async function createRegistrationCheckout(params: {
  inscriptionId: string;
  paymentOption: RegistrationPaymentOption;
  email: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ checkoutUrl: string }> {
  const { data: result, error } = await supabase.functions.invoke("create-registration-checkout", {
    body: params,
  });

  if (error) {
    throw new Error(error.message || "Impossible de préparer le paiement en ligne");
  }

  if (!result?.success) {
    throw new Error(result?.error || "Impossible de préparer le paiement en ligne");
  }

  return result.data as { checkoutUrl: string };
}
