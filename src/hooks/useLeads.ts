import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Lead {
  id: string;
  source: string;
  partner_id: string | null;
  contact_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  company: string | null;
  language_interest: string | null;
  estimated_students: number | null;
  estimated_revenue: number | null;
  status: string;
  assigned_to: string | null;
  next_action: string | null;
  next_action_date: string | null;
  loss_reason: string | null;
  notes: string | null;
  inscription_id: string | null;
  season_id: string | null;
  created_at: string;
  updated_at: string;
  partner?: { name: string } | null;
}

export const LEAD_STATUSES = [
  { key: "nouveau", label: "Nouveau", color: "bg-blue-500" },
  { key: "contacte", label: "Contacté", color: "bg-amber-500" },
  { key: "en_negociation", label: "En négociation", color: "bg-purple-500" },
  { key: "converti", label: "Converti", color: "bg-green-500" },
  { key: "perdu", label: "Perdu", color: "bg-destructive" },
] as const;

export const LEAD_SOURCES = [
  { key: "site_web", label: "Site web" },
  { key: "esf", label: "ESF / Partenaire" },
  { key: "bouche_a_oreille", label: "Bouche à oreille" },
  { key: "salon", label: "Salon / Événement" },
  { key: "autre", label: "Autre" },
] as const;

export function useLeads(filters?: { status?: string; source?: string; search?: string }) {
  return useQuery({
    queryKey: ["leads", filters],
    queryFn: async () => {
      let query = supabase
        .from("leads")
        .select("*, partner:partner_id(name)")
        .order("created_at", { ascending: false });

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }
      if (filters?.source && filters.source !== "all") {
        query = query.eq("source", filters.source);
      }
      if (filters?.search) {
        query = query.or(
          `contact_name.ilike.%${filters.search}%,company.ilike.%${filters.search}%,contact_email.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Lead[];
    },
  });
}

export function useLeadKPIs() {
  return useQuery({
    queryKey: ["lead-kpis"],
    queryFn: async () => {
      const { data: leads, error } = await supabase
        .from("leads")
        .select("status, estimated_revenue, source, created_at, updated_at");
      if (error) throw error;

      const all = leads || [];
      const total = all.length;
      const converted = all.filter((l) => l.status === "converti");
      const lost = all.filter((l) => l.status === "perdu");
      const conversionRate = total > 0 ? (converted.length / (converted.length + lost.length || 1)) * 100 : 0;

      const pipelineByStatus: Record<string, number> = {};
      for (const l of all) {
        pipelineByStatus[l.status] = (pipelineByStatus[l.status] || 0) + Number(l.estimated_revenue || 0);
      }

      // Average conversion time (days) for converted leads
      const conversionTimes = converted.map((l) => {
        const created = new Date(l.created_at).getTime();
        const updated = new Date(l.updated_at).getTime();
        return (updated - created) / (1000 * 60 * 60 * 24);
      });
      const avgConversionDays =
        conversionTimes.length > 0
          ? conversionTimes.reduce((a, b) => a + b, 0) / conversionTimes.length
          : 0;

      // Top sources
      const sourceCount: Record<string, number> = {};
      for (const l of all) {
        sourceCount[l.source] = (sourceCount[l.source] || 0) + 1;
      }

      return {
        total,
        convertedCount: converted.length,
        lostCount: lost.length,
        conversionRate,
        pipelineByStatus,
        avgConversionDays,
        sourceCount,
        totalPipelineRevenue: all
          .filter((l) => !["converti", "perdu"].includes(l.status))
          .reduce((s, l) => s + Number(l.estimated_revenue || 0), 0),
      };
    },
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (lead: Partial<Lead> & { contact_name: string }) => {
      const { data, error } = await supabase.from("leads").insert(lead).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead-kpis"] });
    },
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Lead> & { id: string }) => {
      const { data, error } = await supabase.from("leads").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead-kpis"] });
    },
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead-kpis"] });
    },
  });
}
