import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const SETTING_KEY = "student_portal_enabled";

function parseEnabled(value: unknown): boolean {
  if (value === true || value === "true") return true;
  if (typeof value === "object" && value !== null && "enabled" in value) {
    return Boolean((value as { enabled: unknown }).enabled);
  }
  return false;
}

export function useStudentPortalEnabled() {
  return useQuery({
    queryKey: ["app-setting", SETTING_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", SETTING_KEY)
        .maybeSingle();
      if (error) throw error;
      return parseEnabled(data?.value);
    },
    staleTime: 60_000,
  });
}

export function useSetStudentPortalEnabled() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (enabled: boolean) => {
      const { error } = await supabase.from("app_settings").upsert(
        {
          key: SETTING_KEY,
          value: enabled,
          description:
            "Active les invitations au portail stagiaire (magic link). Désactivé par défaut.",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );
      if (error) throw error;
      return enabled;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-setting", SETTING_KEY] });
    },
  });
}

/** Dernière invitation portail pour un stagiaire (email_log). */
export function useStudentPortalInviteLog(studentId: string | undefined) {
  return useQuery({
    queryKey: ["portal-invite-log", studentId],
    queryFn: async () => {
      if (!studentId) return null;
      const { data, error } = await supabase
        .from("email_log")
        .select("id, sent_at, status, recipient_email, variables_used")
        .eq("template_slug", "student_portal_invite")
        .order("sent_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      const match = (data || []).find((row) => {
        const vars = row.variables_used as { student_id?: string } | null;
        return vars?.student_id === studentId;
      });
      return match ?? null;
    },
    enabled: Boolean(studentId),
  });
}
