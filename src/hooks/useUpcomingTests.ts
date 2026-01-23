import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UpcomingTest {
  id: string;
  candidate_name: string;
  candidate_email: string | null;
  test_type: string;
  test_date: string;
  test_time: string;
  instructor_name: string | null;
  status: string;
}

export function useUpcomingTests(daysAhead: number = 7) {
  return useQuery({
    queryKey: ["upcoming-tests", daysAhead],
    queryFn: async () => {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + daysAhead);

      const { data, error } = await supabase
        .from("test_bookings_complete")
        .select("*")
        .gte("datetime", today.toISOString())
        .lte("datetime", futureDate.toISOString())
        .order("datetime", { ascending: true });

      if (error) throw error;

      return (data || []).map((test) => ({
        id: test.id,
        candidate_name: test.candidate_name || "Candidat inconnu",
        candidate_email: test.candidate_email,
        test_type: test.language ? `Test ${test.language}` : "Test de niveau",
        test_date: new Date(test.datetime).toLocaleDateString("fr-FR"),
        test_time: new Date(test.datetime).toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        instructor_name: test.instructor_name,
        status: test.status || "confirmed",
      })) as UpcomingTest[];
    },
  });
}

export function useTestStats() {
  return useQuery({
    queryKey: ["test-stats"],
    queryFn: async () => {
      const today = new Date();
      const weekAhead = new Date();
      weekAhead.setDate(today.getDate() + 7);

      const { data, error } = await supabase
        .from("test_bookings_complete")
        .select("id, status")
        .gte("datetime", today.toISOString())
        .lte("datetime", weekAhead.toISOString());

      if (error) throw error;

      return {
        total: data?.length || 0,
        confirmed: data?.filter((t) => t.status === "confirmed").length || 0,
      };
    },
  });
}
