import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  computePaymentSettlement,
  docsSentStatus,
  sumReceivedPayments,
  type InscriptionDocsSentStatus,
  type InscriptionPaymentSettlement,
} from "@/lib/inscription-ops-visibility";

export interface InscriptionComplete {
  id: string;
  code: string | null;
  modality: string | null;
  course_type: string | null;
  language: string;
  status: string;
  start_date: string;
  end_date: string;
  duration_hours: number | null;
  price: number | null;
  entry_level: string | null;
  entry_test_id?: string | null;
  dates_to_confirm?: boolean | null;
  exit_level?: string | null;
  course_location?: string | null;
  end_pack_sent_at?: string | null;
  /** Enrichi côté liste (table inscriptions) — pas toujours dans la vue SQL. */
  documents_sent_at?: string | null;
  /** Somme des paiements status=recu (enrichi liste). */
  payments_received_total?: number;
  docs_sent_status?: InscriptionDocsSentStatus;
  payment_settlement?: InscriptionPaymentSettlement;
  season_id?: string | null;
  certification_result: string | null;
  created_at: string;
  student_id?: string | null;
  student_name: string | null;
  student_email: string | null;
  student_phone: string | null;
  student_city: string | null;
  student_company: string | null;
  instructor_name: string | null;
  ski_school_name: string | null;
}

/** Découpe les `.in(...)` PostgREST (URL / payload) pour la vue par formation. */
const OPS_VISIBILITY_ID_CHUNK = 200;

async function enrichInscriptionsOpsVisibility(
  rows: InscriptionComplete[],
): Promise<InscriptionComplete[]> {
  if (rows.length === 0) return rows;
  const ids = rows.map((r) => r.id);

  const docsById = new Map<string, string | null>();
  const paysById = new Map<
    string,
    Array<{ amount?: number | null; status?: string | null }>
  >();

  for (let i = 0; i < ids.length; i += OPS_VISIBILITY_ID_CHUNK) {
    const chunk = ids.slice(i, i + OPS_VISIBILITY_ID_CHUNK);
    const [{ data: opsRows, error: opsErr }, { data: payRows, error: payErr }] =
      await Promise.all([
        supabase
          .from("inscriptions")
          .select("id, documents_sent_at")
          .in("id", chunk),
        supabase
          .from("payments")
          .select("inscription_id, amount, status")
          .in("inscription_id", chunk),
      ]);
    if (opsErr) throw opsErr;
    if (payErr) throw payErr;

    for (const row of opsRows ?? []) {
      docsById.set(row.id, row.documents_sent_at);
    }
    for (const p of payRows ?? []) {
      const list = paysById.get(p.inscription_id) ?? [];
      list.push(p);
      paysById.set(p.inscription_id, list);
    }
  }

  const receivedById = new Map<string, number>();
  for (const [id, list] of paysById) {
    receivedById.set(id, sumReceivedPayments(list));
  }

  return rows.map((row) => {
    const documents_sent_at =
      docsById.get(row.id) ?? row.documents_sent_at ?? null;
    const payments_received_total = receivedById.get(row.id) ?? 0;
    return {
      ...row,
      documents_sent_at,
      payments_received_total,
      docs_sent_status: docsSentStatus(documents_sent_at),
      payment_settlement: computePaymentSettlement({
        price: row.price,
        receivedTotal: payments_received_total,
      }),
    };
  });
}

export function useInscriptions(filters?: {
  status?: string;
  /** Multi-statut : prioritaire sur `status` ; tableau vide → aucun résultat. */
  statuses?: string[];
  language?: string;
  search?: string;
  seasonId?: string | null;
  seasonStart?: string | null;
  seasonEnd?: string | null;
  /** Plafond PostgREST — défaut 100 (liste) ; vue par formation monte plus haut. */
  limit?: number;
}) {
  return useQuery({
    queryKey: ["inscriptions", filters],
    queryFn: async () => {
      if (filters?.statuses && filters.statuses.length === 0) {
        return [] as InscriptionComplete[];
      }

      let query = supabase
        .from("inscriptions_complete")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.statuses && filters.statuses.length > 0) {
        query = query.in("status", filters.statuses);
      } else if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      if (filters?.language && filters.language !== "all") {
        query = query.eq("language", filters.language);
      }

      // Prefer date range: live data has season_id NULL almost everywhere.
      if (filters?.seasonStart && filters?.seasonEnd) {
        query = query
          .gte("start_date", filters.seasonStart)
          .lte("start_date", filters.seasonEnd);
      } else if (filters?.seasonId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        query = (query as any).eq("season_id", filters.seasonId);
      }

      if (filters?.search) {
        query = query.or(
          `student_name.ilike.%${filters.search}%,student_email.ilike.%${filters.search}%,code.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query.limit(filters?.limit ?? 100);

      if (error) throw error;
      return enrichInscriptionsOpsVisibility((data ?? []) as InscriptionComplete[]);
    },
  });
}

export function useInscriptionStats() {
  return useQuery({
    queryKey: ["inscription-stats"],
    queryFn: async () => {
      const { data: inscriptions, error } = await supabase
        .from("inscriptions")
        .select("status, price, language, modality, created_at");

      if (error) throw error;

      const rows = inscriptions ?? [];
      const total = rows.length;
      const totalRevenue = rows.reduce((sum, i) => sum + (Number(i.price) || 0), 0);

      const byStatus = rows.reduce((acc, i) => {
        acc[i.status] = (acc[i.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const byLanguage = rows.reduce((acc, i) => {
        acc[i.language] = (acc[i.language] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const byModality = rows.reduce((acc, i) => {
        const key = (i as { modality?: string | null }).modality || "Non précisée";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Série des 12 derniers mois, à partir des dates déjà chargées : pas de
      // requête supplémentaire, et le graphique porte des chiffres réels.
      const now = new Date();
      const months: Array<{ key: string; label: string; count: number; revenue: number }> = [];
      const index = new Map<string, number>();
      for (let offset = 11; offset >= 0; offset -= 1) {
        const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        index.set(key, months.length);
        months.push({
          key,
          label: date.toLocaleDateString("fr-FR", { month: "short" }),
          count: 0,
          revenue: 0,
        });
      }
      for (const row of rows) {
        const raw = (row as { created_at?: string | null }).created_at;
        if (!raw) continue;
        const date = new Date(raw);
        if (Number.isNaN(date.getTime())) continue;
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const slot = index.get(key);
        if (slot === undefined) continue;
        months[slot].count += 1;
        months[slot].revenue += Number(row.price) || 0;
      }

      return {
        total,
        totalRevenue,
        byStatus,
        byLanguage,
        byModality,
        byMonth: months,
        active: byStatus['en_cours'] || 0,
        completed: byStatus['terminee'] || 0,
        billed: byStatus['facturee'] || 0,
      };
    },
  });
}

export function useUpdateInscriptionStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from("inscriptions")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["inscription-stats"] });
      queryClient.invalidateQueries({ queryKey: ["inscription-details"] });
      queryClient.invalidateQueries({ queryKey: ["inscription-timeline"] });
      queryClient.invalidateQueries({ queryKey: ["inscriptions-a-avancer"] });
    },
  });
}

export interface StatusAdvanceReport {
  dry_run: boolean;
  transition: string;
  nombre: number;
  inscriptions: { code: string | null; debut: string }[];
}

/**
 * Compte les inscriptions confirmées dont la date de début est atteinte : elles
 * devraient être « En cours ». Le job pg_cron qui fait ce rattrapage la nuit
 * existe mais reste inactif, donc l'écran propose de le déclencher à la main.
 */
export function useDueStatusAdvances() {
  return useQuery({
    queryKey: ["inscriptions-a-avancer"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("avancer_statuts_inscriptions", {
        _dry_run: true,
      });

      if (error) throw error;
      return data as unknown as StatusAdvanceReport;
    },
    retry: false,
  });
}

export function useAdvanceDueStatuses() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("avancer_statuts_inscriptions", {
        _dry_run: false,
      });

      if (error) throw error;
      return data as unknown as StatusAdvanceReport;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["inscription-stats"] });
      queryClient.invalidateQueries({ queryKey: ["inscription-details"] });
      queryClient.invalidateQueries({ queryKey: ["inscriptions-a-avancer"] });
    },
  });
}

export function useDeleteInscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("inscriptions")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["inscription-stats"] });
    },
  });
}

export function useRecentInscriptions() {
  return useQuery({
    queryKey: ["recent-inscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inscriptions_complete")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      // Deduplicate by student_id, keeping most recent (already sorted)
      const seen = new Map<string, InscriptionComplete>();
      for (const insc of (data || [])) {
        const key = insc.student_id || insc.id;
        if (!seen.has(key)) {
          seen.set(key, insc as InscriptionComplete);
        }
      }
      return Array.from(seen.values()).slice(0, 5);
    },
  });
}
