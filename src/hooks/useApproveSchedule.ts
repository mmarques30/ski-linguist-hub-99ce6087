import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { ScheduleStatus } from "@/lib/placement-test-engine";

export function useApproveSchedule() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      inscriptionId,
      scheduleStatus,
    }: {
      inscriptionId: string;
      scheduleStatus: Exclude<ScheduleStatus, "pending">;
    }) => {
      const { data, error } = await supabase
        .from("inscriptions")
        .update({
          schedule_status: scheduleStatus,
          schedule: scheduleStatus,
          schedule_approved_at: new Date().toISOString(),
          schedule_approved_by: user?.id || null,
        })
        .eq("id", inscriptionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["inscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["inscription-details", vars.inscriptionId] });
    },
  });
}
