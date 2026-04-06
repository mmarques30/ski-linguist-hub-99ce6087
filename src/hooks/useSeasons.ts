import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Season {
  id: string;
  name: string;
  slug: string;
  start_date: string;
  end_date: string;
  status: string;
  is_current: boolean;
  revenue_target: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PricingRule {
  id: string;
  season_id: string;
  language: string;
  level: string;
  duration_hours: number;
  modality: string;
  base_price: number;
  group_discount_percent: number | null;
  esf_partner_price: number | null;
  opco_eligible: boolean | null;
  created_at: string;
  updated_at: string;
}

export function useSeasons() {
  return useQuery({
    queryKey: ["seasons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seasons")
        .select("*")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data as Season[];
    },
  });
}

export function useCurrentSeason() {
  return useQuery({
    queryKey: ["current-season"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seasons")
        .select("*")
        .eq("is_current", true)
        .maybeSingle();
      if (error) throw error;
      return data as Season | null;
    },
  });
}

export function useCreateSeason() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (season: Omit<Season, "id" | "created_at" | "updated_at" | "is_current" | "status">) => {
      const { data, error } = await supabase
        .from("seasons")
        .insert({ ...season, status: "planifiee", is_current: false })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["seasons"] }),
  });
}

export function useUpdateSeason() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Season> & { id: string }) => {
      const { data, error } = await supabase
        .from("seasons")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["seasons"] }),
  });
}

export function useDeleteSeason() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("seasons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["seasons"] }),
  });
}

export function useActivateSeason() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (seasonId: string) => {
      const { error } = await supabase.rpc("activate_season", { p_season_id: seasonId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["seasons"] });
      qc.invalidateQueries({ queryKey: ["current-season"] });
    },
  });
}

// Pricing Rules
export function usePricingRules(seasonId: string | undefined) {
  return useQuery({
    queryKey: ["pricing-rules", seasonId],
    queryFn: async () => {
      if (!seasonId) return [];
      const { data, error } = await supabase
        .from("pricing_rules")
        .select("*")
        .eq("season_id", seasonId)
        .order("language")
        .order("level")
        .order("duration_hours");
      if (error) throw error;
      return data as PricingRule[];
    },
    enabled: !!seasonId,
  });
}

export function useCreatePricingRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rule: Omit<PricingRule, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("pricing_rules")
        .insert(rule)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["pricing-rules", vars.season_id] }),
  });
}

export function useUpdatePricingRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PricingRule> & { id: string }) => {
      const { data, error } = await supabase
        .from("pricing_rules")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pricing-rules"] }),
  });
}

export function useDeletePricingRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pricing_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pricing-rules"] }),
  });
}

export function usePriceLookup(
  seasonId: string | undefined,
  language: string | undefined,
  level: string | undefined,
  modality: string | undefined,
  durationHours: number | undefined
) {
  return useQuery({
    queryKey: ["price-lookup", seasonId, language, level, modality, durationHours],
    queryFn: async () => {
      if (!seasonId || !language || !level || !modality || !durationHours) return null;
      const { data, error } = await supabase
        .from("pricing_rules")
        .select("base_price, group_discount_percent, esf_partner_price")
        .eq("season_id", seasonId)
        .eq("language", language)
        .eq("level", level)
        .eq("modality", modality)
        .eq("duration_hours", durationHours)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!seasonId && !!language && !!level && !!modality && !!durationHours,
  });
}
