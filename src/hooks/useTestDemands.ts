import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TestDemandRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  profession: string | null;
  profession_autre: string | null;
  ski_school_id: string | null;
  ski_school_name: string | null;
  carte_syndicale: string | null;
  ski_discipline: string | null;
  training_cycle: string | null;
  student_id: string | null;
  created_at: string;
};

export type ScheduledBookingRow = {
  id: string;
  datetime: string;
  language: string;
  status: string;
  payment_type: string;
  sponsor_type: string;
  instructor_id: string | null;
  instructor_name: string | null;
  candidate_id: string;
  candidate_name: string | null;
  candidate_email: string | null;
  candidate_phone: string | null;
  ski_school: string | null;
  google_meet_link: string | null;
};

const DEMANDS_KEY = ["test-demands"] as const;
const SCHEDULED_KEY = ["test-bookings-scheduled"] as const;

/** Demandes `/reserver-test` sans réservation pending/confirmed. */
export function useTestDemands() {
  return useQuery({
    queryKey: DEMANDS_KEY,
    queryFn: async (): Promise<TestDemandRow[]> => {
      const { data: candidates, error } = await supabase
        .from("test_candidates")
        .select(
          "id, name, email, phone, profession, profession_autre, ski_school_id, carte_syndicale, ski_discipline, training_cycle, student_id, created_at, ski_schools(name)"
        )
        .order("created_at", { ascending: false });
      if (error) throw error;

      const { data: active, error: activeError } = await supabase
        .from("test_bookings")
        .select("candidate_id")
        .in("status", ["pending_payment", "confirmed"]);
      if (activeError) throw activeError;

      const busy = new Set((active ?? []).map((b) => b.candidate_id));

      return (candidates ?? [])
        .filter((c) => !busy.has(c.id))
        .map((c) => {
          const school = c.ski_schools as { name: string } | null;
          return {
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone,
            profession: c.profession,
            profession_autre: c.profession_autre,
            ski_school_id: c.ski_school_id,
            ski_school_name: school?.name ?? null,
            carte_syndicale: c.carte_syndicale,
            ski_discipline: c.ski_discipline,
            training_cycle: c.training_cycle,
            student_id: c.student_id,
            created_at: c.created_at,
          };
        });
    },
  });
}

/** Réservations planifiées (pas encore completed). */
export function useScheduledTestBookings() {
  return useQuery({
    queryKey: SCHEDULED_KEY,
    queryFn: async (): Promise<ScheduledBookingRow[]> => {
      const { data, error } = await supabase
        .from("test_bookings_complete")
        .select(
          "id, datetime, language, status, payment_type, sponsor_type, instructor_id, instructor_name, candidate_id, candidate_name, candidate_email, candidate_phone, ski_school, google_meet_link"
        )
        .in("status", ["pending_payment", "confirmed"])
        .order("datetime", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ScheduledBookingRow[];
    },
  });
}

export type CreateBookingFromDemandeInput = {
  candidateId: string;
  language: string;
  datetimeIso: string;
  instructorId: string;
  sponsorType: "esf" | "ecole_ski" | "dsf";
  paymentType: string;
  previousTest?: boolean;
  previousResult?: string;
};

export function useCreateBookingFromDemande() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateBookingFromDemandeInput) => {
      const { data, error } = await supabase.rpc(
        "create_test_booking_from_candidate",
        {
          p_candidate_id: input.candidateId,
          p_language: input.language,
          p_datetime: input.datetimeIso,
          p_instructor_id: input.instructorId,
          p_sponsor_type: input.sponsorType,
          p_payment_type: input.paymentType,
          p_previous_test: input.previousTest ?? false,
          p_previous_result: input.previousResult ?? null,
        }
      );
      if (error) throw error;
      if (!data) throw new Error("Identifiant de réservation manquant");
      return data as string;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DEMANDS_KEY });
      void queryClient.invalidateQueries({ queryKey: SCHEDULED_KEY });
      void queryClient.invalidateQueries({ queryKey: ["test-bookings-to-evaluate"] });
    },
  });
}

export function useMarkBookingCompleted() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await supabase
        .from("test_bookings")
        .update({ status: "completed" })
        .eq("id", bookingId);
      if (error) throw error;
      return bookingId;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SCHEDULED_KEY });
      void queryClient.invalidateQueries({ queryKey: ["test-bookings-to-evaluate"] });
    },
  });
}
