import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SkiMonitor {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  partner_id: string | null;
  ski_school_id: string | null;
  home_station: string | null;
  status: "active" | "unsubscribed";
  notes: string | null;
  created_at: string;
  updated_at: string;
  partner?: { name: string; station: string | null } | null;
  ski_school?: { name: string } | null;
}

export function useSkiMonitors(filters?: {
  search?: string;
  status?: string;
  partnerId?: string;
}) {
  return useQuery({
    queryKey: ["ski-monitors", filters],
    queryFn: async () => {
      let query = supabase
        .from("ski_monitors")
        .select("*, partner:partner_id(name, station), ski_school:ski_school_id(name)")
        .order("last_name", { ascending: true });

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }
      if (filters?.partnerId) {
        query = query.eq("partner_id", filters.partnerId);
      }
      if (filters?.search) {
        query = query.or(
          `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,home_station.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as SkiMonitor[];
    },
  });
}

export function useSkiMonitorStats() {
  return useQuery({
    queryKey: ["ski-monitor-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ski_monitors")
        .select("status, partner_id, home_station");
      if (error) throw error;

      const all = data || [];
      const active = all.filter((m) => m.status === "active").length;
      const stations = new Set(all.map((m) => m.home_station).filter(Boolean));

      return {
        total: all.length,
        active,
        stations: stations.size,
      };
    },
  });
}

export function useCreateSkiMonitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (monitor: Omit<SkiMonitor, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase.from("ski_monitors").insert(monitor).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ski-monitors"] });
      qc.invalidateQueries({ queryKey: ["ski-monitor-stats"] });
    },
  });
}

export function useUpdateSkiMonitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SkiMonitor> & { id: string }) => {
      const { data, error } = await supabase.from("ski_monitors").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ski-monitors"] });
      qc.invalidateQueries({ queryKey: ["ski-monitor-stats"] });
    },
  });
}

export function useDeleteSkiMonitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ski_monitors").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ski-monitors"] });
      qc.invalidateQueries({ queryKey: ["ski-monitor-stats"] });
    },
  });
}

export function useImportSkiMonitors() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: Array<{
      first_name: string;
      last_name: string;
      email: string;
      phone: string | null;
      home_station: string | null;
      status: "active" | "unsubscribed";
      notes: string | null;
    }>) => {
      const BATCH = 150;
      let imported = 0;
      const errors: string[] = [];

      for (let i = 0; i < rows.length; i += BATCH) {
        const batch = rows.slice(i, i + BATCH).map((r) => ({
          first_name: r.first_name,
          last_name: r.last_name,
          email: r.email,
          phone: r.phone,
          home_station: r.home_station,
          status: r.status,
          notes: r.notes,
          partner_id: null,
          ski_school_id: null,
        }));

        const { error } = await supabase
          .from("ski_monitors")
          .upsert(batch, { onConflict: "email", ignoreDuplicates: false });

        if (error) {
          errors.push(`Lot ${Math.floor(i / BATCH) + 1}: ${error.message}`);
        } else {
          imported += batch.length;
        }
      }

      if (errors.length > 0 && imported === 0) {
        throw new Error(errors.join("\n"));
      }

      return { imported, errors };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ski-monitors"] });
      qc.invalidateQueries({ queryKey: ["ski-monitor-stats"] });
    },
  });
}
