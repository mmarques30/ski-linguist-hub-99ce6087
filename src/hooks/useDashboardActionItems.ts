import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePendingSchedules } from "@/hooks/usePendingSchedules";
import { SCHEDULE_ASSIGNMENT_DAYS_BEFORE } from "@/lib/placement-test-engine";
import { INVOICE_ORIGIN_APP } from "@/lib/invoice-origin";

export interface DashboardActionItem {
  id: string;
  label: string;
  count: number;
  href: string;
  severity: "critical" | "warning" | "info";
}

/**
 * Rail « À traiter » du dashboard — compteurs réels, liens cliquables.
 */
export function useDashboardActionItems() {
  const pendingSchedules = usePendingSchedules();

  const extras = useQuery({
    queryKey: ["dashboard-action-items"],
    queryFn: async () => {
      const today = new Date();
      const todayIso = today.toISOString().split("T")[0];

      const [withoutInstructor, unpaidInvoices, upcomingTests] = await Promise.all([
        supabase
          .from("inscriptions")
          .select("id", { count: "exact", head: true })
          .eq("status", "en_cours")
          .is("instructor_id", null),
        supabase
          .from("invoices")
          .select("id", { count: "exact", head: true })
          .eq("origin", INVOICE_ORIGIN_APP)
          .neq("status", "paid")
          .neq("status", "cancelled")
          .neq("status", "annulee")
          .lt("due_date", todayIso),
        supabase
          .from("test_bookings_complete")
          .select("id", { count: "exact", head: true })
          .gte("datetime", today.toISOString())
          .lte(
            "datetime",
            new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
          ),
      ]);

      if (withoutInstructor.error) throw withoutInstructor.error;
      if (unpaidInvoices.error) throw unpaidInvoices.error;
      if (upcomingTests.error) throw upcomingTests.error;

      return {
        withoutInstructor: withoutInstructor.count ?? 0,
        overdueInvoices: unpaidInvoices.count ?? 0,
        upcomingTests: upcomingTests.count ?? 0,
      };
    },
  });

  const items: DashboardActionItem[] = [
    {
      id: "schedules",
      label: `Horaires J-${SCHEDULE_ASSIGNMENT_DAYS_BEFORE}`,
      count: pendingSchedules.data?.total ?? 0,
      href: "/inscriptions/schedule-validation",
      severity: (pendingSchedules.data?.lateTotal ?? 0) > 0 ? "critical" : "warning",
    },
    {
      id: "tests",
      label: "Tests programmés (7 j)",
      count: extras.data?.upcomingTests ?? 0,
      href: "/tests",
      severity: "info",
    },
    {
      id: "no-instructor",
      label: "Formations sans formateur",
      count: extras.data?.withoutInstructor ?? 0,
      href: "/inscriptions?status=en_cours",
      severity: "warning",
    },
    {
      id: "overdue",
      label: "Factures échues non payées",
      count: extras.data?.overdueInvoices ?? 0,
      href: "/invoices?status=sent",
      severity: "critical",
    },
  ];

  return {
    items,
    isLoading: pendingSchedules.isLoading || extras.isLoading,
    total: items.reduce((sum, i) => sum + i.count, 0),
  };
}
