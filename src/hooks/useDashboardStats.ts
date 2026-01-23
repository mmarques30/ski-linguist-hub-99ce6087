import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DashboardStats {
  newInscriptions: {
    total: number;
    confirmed: number;
  };
  upcomingTests: {
    total: number;
    confirmed: number;
  };
  monthlyRevenue: {
    projected: number;
    confirmed: number;
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
      const weekAhead = new Date();
      weekAhead.setDate(today.getDate() + 7);

      // Get current month for revenue
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      // Fetch inscriptions from last 30 days
      const { data: inscriptions } = await supabase
        .from("inscriptions")
        .select("id, status, created_at")
        .gte("created_at", thirtyDaysAgo.toISOString());

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

      // Fetch active inscriptions (turmas ativas)
      const { data: activeInscriptions } = await supabase
        .from("inscriptions")
        .select("id, status")
        .eq("status", "En cours");

      // Calculate stats
      const confirmedInscriptions =
        inscriptions?.filter(
          (i) => i.status === "Confirmé" || i.status === "En cours" || i.status === "Facturé"
        ).length || 0;

      const projectedRevenue = invoices?.reduce((sum, i) => sum + (Number(i.amount_ttc) || 0), 0) || 0;
      const confirmedRevenue =
        invoices
          ?.filter((i) => i.status === "paid")
          .reduce((sum, i) => sum + (Number(i.amount_ttc) || 0), 0) || 0;

      // Classes are validated if they have a billed status
      const validatedClasses =
        activeInscriptions?.filter((i) => i.status === "Facturé").length || 0;

      return {
        newInscriptions: {
          total: inscriptions?.length || 0,
          confirmed: confirmedInscriptions,
        },
        upcomingTests: {
          total: tests?.length || 0,
          confirmed: tests?.filter((t) => t.status === "confirmed").length || 0,
        },
        monthlyRevenue: {
          projected: projectedRevenue,
          confirmed: confirmedRevenue,
        },
        activeClasses: {
          total: activeInscriptions?.length || 0,
          validated: validatedClasses,
        },
      } as DashboardStats;
    },
  });
}

export function useRevenueProjections(monthsCount: number = 3) {
  return useQuery({
    queryKey: ["revenue-projections", monthsCount],
    queryFn: async () => {
      const projections = [];
      const today = new Date();

      for (let i = 0; i < monthsCount; i++) {
        const monthDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + i + 1, 0);

        const { data: invoices } = await supabase
          .from("invoices")
          .select("amount_ttc, status")
          .gte("invoice_date", monthDate.toISOString().split("T")[0])
          .lte("invoice_date", endOfMonth.toISOString().split("T")[0]);

        const projected = invoices?.reduce((sum, i) => sum + (Number(i.amount_ttc) || 0), 0) || 0;
        const confirmed =
          invoices
            ?.filter((i) => i.status === "paid")
            .reduce((sum, i) => sum + (Number(i.amount_ttc) || 0), 0) || 0;

        projections.push({
          month: monthDate.toLocaleDateString("fr-FR", { month: "long" }),
          projected,
          confirmed,
        });
      }

      return projections;
    },
  });
}
