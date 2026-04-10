import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface QualiopiIndicator {
  id: string;
  criterion_number: number;
  indicator_number: string;
  label: string;
  current_value: number | null;
  target_value: number | null;
  unit: string | null;
  measurement_date: string | null;
  evidence_type: string;
  evidence_description: string | null;
  status: string;
  season_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLogEntry {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_values: any;
  new_values: any;
  ip_address: string | null;
  created_at: string;
}

export function useQualiopiIndicators(seasonId?: string) {
  return useQuery({
    queryKey: ["qualiopi-indicators", seasonId],
    queryFn: async () => {
      let query = supabase
        .from("qualiopi_indicators")
        .select("*")
        .order("criterion_number")
        .order("indicator_number");
      if (seasonId) query = query.eq("season_id", seasonId);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as QualiopiIndicator[];
    },
  });
}

export function useUpsertIndicator() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (values: Partial<QualiopiIndicator> & { id?: string }) => {
      if (values.id) {
        const { id, ...rest } = values;
        const { error } = await supabase
          .from("qualiopi_indicators")
          .update(rest as any)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("qualiopi_indicators")
          .insert(values as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["qualiopi-indicators"] });
      toast({ title: "Indicateur enregistré" });
    },
    onError: (e: any) => {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    },
  });
}

export function useAuditLog(filters?: {
  tableName?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["audit-log", filters],
    queryFn: async () => {
      let query = supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(filters?.limit || 200);
      if (filters?.tableName) query = query.eq("table_name", filters.tableName);
      if (filters?.startDate) query = query.gte("created_at", filters.startDate);
      if (filters?.endDate) query = query.lte("created_at", filters.endDate);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as AuditLogEntry[];
    },
  });
}

export function useAutoIndicators() {
  return useQuery({
    queryKey: ["auto-indicators"],
    queryFn: async () => {
      // Satisfaction rate
      const { data: surveys } = await supabase
        .from("satisfaction_surveys")
        .select("satisfaction_content, satisfaction_animation, satisfaction_organization, satisfaction_expectations, satisfaction_materials, satisfaction_utility, satisfaction_duration")
        .not("completed_at", "is", null);

      let satisfactionRate = 0;
      if (surveys && surveys.length > 0) {
        const scores = surveys.map((s) => {
          const vals = [
            s.satisfaction_content, s.satisfaction_animation,
            s.satisfaction_organization, s.satisfaction_expectations,
            s.satisfaction_materials, s.satisfaction_utility, s.satisfaction_duration,
          ].filter((v) => v != null) as number[];
          return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        });
        satisfactionRate = Math.round(
          (scores.reduce((a, b) => a + b, 0) / scores.length / 5) * 100
        );
      }

      // Certification success rate
      const { data: inscriptions } = await supabase
        .from("inscriptions")
        .select("certification_result")
        .not("certification_result", "is", null);

      let certRate = 0;
      if (inscriptions && inscriptions.length > 0) {
        const passed = inscriptions.filter(
          (i) => i.certification_result?.toLowerCase() === "reussi" || i.certification_result?.toLowerCase() === "réussi"
        ).length;
        certRate = Math.round((passed / inscriptions.length) * 100);
      }

      // Continuous improvement count
      const { count: improvementCount } = await supabase
        .from("continuous_improvement")
        .select("id", { count: "exact", head: true });

      // Survey completion rate
      const { count: totalSurveys } = await supabase
        .from("satisfaction_surveys")
        .select("id", { count: "exact", head: true });
      const { count: completedSurveys } = await supabase
        .from("satisfaction_surveys")
        .select("id", { count: "exact", head: true })
        .not("completed_at", "is", null);

      const evalCompletionRate =
        totalSurveys && totalSurveys > 0
          ? Math.round(((completedSurveys || 0) / totalSurveys) * 100)
          : 0;

      return {
        satisfactionRate,
        certRate,
        improvementCount: improvementCount || 0,
        evalCompletionRate,
        totalSurveys: totalSurveys || 0,
        completedSurveys: completedSurveys || 0,
      };
    },
  });
}
