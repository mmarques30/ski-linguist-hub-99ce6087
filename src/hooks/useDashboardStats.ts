import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DashboardSpark {
  label: string;
  value: number;
}

export interface DashboardStats {
  newInscriptions: {
    total: number;
    confirmed: number;
    /** Variation en % sur les 30 jours précédents. */
    evolution: number | null;
    /** Volume quotidien des 30 derniers jours, pour la mini-courbe. */
    spark: DashboardSpark[];
  };
  upcomingTests: {
    total: number;
    confirmed: number;
  };
  monthlyRevenue: {
    projected: number;
    confirmed: number;
    /** Variation en % du CA facturé par rapport au mois précédent. */
    evolution: number | null;
  };
  activeClasses: {
    total: number;
    validated: number;
  };
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      // Calculate date ranges
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(today.getDate() - 60);
      const weekAhead = new Date();
      weekAhead.setDate(today.getDate() + 7);

      // Get current month for revenue
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const startOfPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endOfPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0);

      // Fetch inscriptions from last 30 days
      // Soixante jours : les trente derniers pour la valeur, les trente
      // précédents pour la variation. Une seule requête au lieu de deux.
      const { data: inscriptionsWindow } = await supabase
        .from("inscriptions")
        .select("id, status, created_at")
        .gte("created_at", sixtyDaysAgo.toISOString());

      const inscriptions = (inscriptionsWindow ?? []).filter(
        (i) => new Date(i.created_at) >= thirtyDaysAgo
      );
      const inscriptionsPrevious = (inscriptionsWindow ?? []).filter(
        (i) => new Date(i.created_at) < thirtyDaysAgo
      );

      // Fetch upcoming tests
      const { data: tests } = await supabase
        .from("test_bookings_complete")
        .select("id, status")
        .gte("datetime", today.toISOString())
        .lte("datetime", weekAhead.toISOString());

      // Fetch invoices for current month
      const { data: invoices } = await supabase
        .from("invoices")
        .select("id, amount_ttc, status")
        .gte("invoice_date", startOfMonth.toISOString().split("T")[0])
        .lte("invoice_date", endOfMonth.toISOString().split("T")[0]);

      const { data: prevInvoices } = await supabase
        .from("invoices")
        .select("id, amount_ttc, status")
        .gte("invoice_date", startOfPrevMonth.toISOString().split("T")[0])
        .lte("invoice_date", endOfPrevMonth.toISOString().split("T")[0]);

      // Fetch active inscriptions (turmas ativas)
      const { data: activeInscriptions } = await supabase
        .from("inscriptions")
        .select("id, status, instructor_id")
        .eq("status", "en_cours");
      // Calculate stats
      const confirmedInscriptions =
        inscriptions?.filter(
          (i) => i.status === "confirmee" || i.status === "en_cours" || i.status === "facturee"
        ).length || 0;

      const projectedRevenue = invoices?.reduce((sum, i) => sum + (Number(i.amount_ttc) || 0), 0) || 0;
      const confirmedRevenue =
        invoices
          ?.filter((i) => i.status === "paid")
          .reduce((sum, i) => sum + (Number(i.amount_ttc) || 0), 0) || 0;

      const pourcentage = (courant: number, precedent: number): number | null => {
        if (!precedent) return null;
        return Math.round(((courant - precedent) / precedent) * 1000) / 10;
      };

      // Volume quotidien des 30 derniers jours pour la mini-courbe des tuiles.
      const spark: DashboardSpark[] = [];
      const sparkIndex = new Map<string, number>();
      for (let offset = 29; offset >= 0; offset -= 1) {
        const date = new Date(today);
        date.setDate(today.getDate() - offset);
        const key = date.toISOString().slice(0, 10);
        sparkIndex.set(key, spark.length);
        spark.push({ label: key.slice(5), value: 0 });
      }
      for (const row of inscriptions) {
        const key = new Date(row.created_at).toISOString().slice(0, 10);
        const slot = sparkIndex.get(key);
        if (slot !== undefined) spark[slot].value += 1;
      }

      const prevRevenue =
        prevInvoices?.reduce((sum, i) => sum + (Number(i.amount_ttc) || 0), 0) || 0;

      // Classes are confirmed if they have an instructor assigned
      const validatedClasses =
        activeInscriptions?.filter((i) => i.instructor_id != null).length || 0;

      return {
        newInscriptions: {
          total: inscriptions.length,
          confirmed: confirmedInscriptions,
          evolution: pourcentage(inscriptions.length, inscriptionsPrevious.length),
          spark,
        },
        upcomingTests: {
          total: tests?.length || 0,
          confirmed: tests?.filter((t) => t.status === "confirmed").length || 0,
        },
        monthlyRevenue: {
          projected: projectedRevenue,
          confirmed: confirmedRevenue,
          evolution: pourcentage(projectedRevenue, prevRevenue),
        },
        activeClasses: {
          total: activeInscriptions?.length || 0,
          validated: validatedClasses,
        },
      } as DashboardStats;
    },
  });
}
