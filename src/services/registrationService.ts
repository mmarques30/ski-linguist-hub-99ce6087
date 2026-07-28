import { supabase } from "@/integrations/supabase/client";
import type { RegistrationData } from "@/pages/register/Index";

export interface RegistrationSubmissionResult {
  inscriptionId: string;
  inscriptionCode: string;
  studentId: string;
  needsAdminCall: boolean;
  emailSent: boolean;
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
