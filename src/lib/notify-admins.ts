import { supabase } from "@/integrations/supabase/client";

export type StaffNotificationType =
  | "inscription"
  | "paiement"
  | "test"
  | "evaluation"
  | "schedule_validation";

/** Insère une notification pour chaque admin (best-effort, non bloquant). */
export async function notifyAdmins(params: {
  type: StaffNotificationType;
  title: string;
  message?: string;
  link?: string;
}): Promise<void> {
  try {
    const { data: admins, error } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");
    if (error || !admins?.length) return;

    const rows = admins.map((admin) => ({
      user_id: admin.user_id,
      type: params.type,
      title: params.title,
      message: params.message ?? null,
      link: params.link ?? null,
    }));

    await supabase.from("notifications").insert(rows);
  } catch {
    // Les producteurs de notifications ne doivent jamais faire échouer l'action métier.
  }
}
