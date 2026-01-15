import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

export type TestEvaluation = Tables<"test_evaluations">;
export type TestBookingComplete = Tables<"test_bookings_complete">;

export function useTestBookingsToEvaluate() {
  return useQuery({
    queryKey: ["test-bookings-to-evaluate"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_bookings_complete")
        .select("*")
        .eq("status", "completed")
        .is("evaluation_id", null)
        .order("datetime", { ascending: false });
      
      if (error) throw error;
      return data as TestBookingComplete[];
    },
  });
}

export function useTestBookingForEvaluation(bookingId: string) {
  return useQuery({
    queryKey: ["test-booking-evaluation", bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_bookings_complete")
        .select("*")
        .eq("id", bookingId)
        .maybeSingle();
      
      if (error) throw error;
      return data as TestBookingComplete | null;
    },
    enabled: !!bookingId,
  });
}

export function useTestEvaluation(bookingId: string) {
  return useQuery({
    queryKey: ["test-evaluation", bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_evaluations")
        .select("*")
        .eq("booking_id", bookingId)
        .maybeSingle();
      
      if (error) throw error;
      return data as TestEvaluation | null;
    },
    enabled: !!bookingId,
  });
}

export interface CreateEvaluationData {
  booking_id: string;
  score_general: number;
  score_comprehension: number;
  score_expression: number;
  score_structure: number;
  score_technique: number;
  score_conversation: number;
  scoring_system: 'sur_5' | 'sur_20';
  attestation_type: string;
  appreciation_intro?: string;
  appreciation_comprehension?: string;
  appreciation_grammar?: string;
  appreciation_technique?: string;
  appreciation_conclusion?: string;
  comments_introduction?: string;
  comments_comprehension?: string;
  comments_expression?: string;
  comments_grammar?: string;
  comments_technique?: string;
  comments_conclusion?: string;
  comments?: string;
  grammar_points?: string[];
  vocabulary_examples?: string[];
  criteria_checklist?: Record<string, boolean>;
  selected_phrase_ids?: string[];
}

export function useCreateTestEvaluation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (evaluation: CreateEvaluationData) => {
      const { data, error } = await supabase
        .from("test_evaluations")
        .insert(evaluation)
        .select()
        .single();
      
      if (error) throw error;

      // Update booking status
      await supabase
        .from("test_bookings")
        .update({ status: "evaluated" })
        .eq("id", evaluation.booking_id);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["test-bookings-to-evaluate"] });
      queryClient.invalidateQueries({ queryKey: ["test-evaluation"] });
      toast({ title: "Évaluation enregistrée avec succès" });
    },
    onError: (error: Error) => {
      toast({ 
        variant: "destructive", 
        title: "Erreur", 
        description: error.message 
      });
    },
  });
}

export function useUpdateTestEvaluation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TestEvaluation> & { id: string }) => {
      const { data, error } = await supabase
        .from("test_evaluations")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["test-evaluation"] });
      toast({ title: "Évaluation mise à jour" });
    },
    onError: (error: Error) => {
      toast({ 
        variant: "destructive", 
        title: "Erreur", 
        description: error.message 
      });
    },
  });
}
