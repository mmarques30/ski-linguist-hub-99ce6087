import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { languagesInclude } from "@/lib/taught-languages";

export interface Instructor {
  id: string;
  first_name: string | null;
  last_name: string;
  email: string | null;
  phone: string | null;
  languages: string[] | null;
  specialties: string[] | null;
  geographic_zones: string[] | null;
  hourly_rate: number | null;
  siret: string | null;
  status: string | null;
  is_active: boolean | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  specialty_details: string | null;
  status_notes: string | null;
  tax_status: string | null;
  availability_status: string | null;
  bio: string | null;
  photo_url: string | null;
  rating_average: number | null;
  certifications: any[] | null;
  auth_user_id: string | null;
  alias: string[] | null;
  civilite: string | null;
  pays: string | null;
  statut_administratif: string | null;
  identifiant_etranger: string | null;
  assujetti_tva: boolean | null;
  consentement_temoignage: string | null;
  consentement_photo: string | null;
  cv_url: string | null;
  formulaire_2026: boolean | null;
  date_naissance: string | null;
  created_at: string;
  updated_at: string | null;
}

export type InstructorStatusFilter = "actif" | "inactif" | "candidat" | "all";

export interface InstructorSession {
  id: string;
  instructor_id: string;
  inscription_id: string | null;
  session_date: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  status: string;
  location: string | null;
  notes: string | null;
  created_at: string;
}

interface InstructorFilters {
  language?: string;
  availability?: string;
  search?: string;
  /** Défaut liste métier : actif. Sélecteurs d'affectation : actif uniquement. */
  status?: InstructorStatusFilter;
}

export function useInstructors(filters?: InstructorFilters) {
  return useQuery({
    queryKey: ["instructors", filters],
    queryFn: async () => {
      let query = supabase.from("instructors").select("*").order("last_name");

      const statusFilter = filters?.status ?? "actif";
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (filters?.search) {
        query = query.or(
          `last_name.ilike.%${filters.search}%,first_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
        );
      }
      if (filters?.availability) {
        query = query.eq("availability_status", filters.availability);
      }

      const { data, error } = await query;
      if (error) throw error;

      let results = (data || []) as Instructor[];
      if (filters?.language) {
        results = results.filter((i) => languagesInclude(i.languages, filters.language!));
      }
      return results;
    },
  });
}

export function useInstructorDetails(id: string | undefined) {
  return useQuery({
    queryKey: ["instructor", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructors")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as Instructor;
    },
  });
}

export function useInstructorInscriptions(instructorId: string | undefined) {
  return useQuery({
    queryKey: ["instructor-inscriptions", instructorId],
    enabled: !!instructorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inscriptions_complete")
        .select("id, code, language, start_date, end_date, status, student_name, course_location")
        .eq("instructor_id", instructorId!)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useInstructorSessions(instructorId: string | undefined) {
  return useQuery({
    queryKey: ["instructor-sessions", instructorId],
    enabled: !!instructorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructor_sessions")
        .select("*, inscriptions(code, language, students(first_name, last_name))")
        .eq("instructor_id", instructorId!)
        .order("session_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export interface InstructorContract {
  id: string;
  instructor_id: string;
  inscription_id: string | null;
  contract_number: string | null;
  signed_at: string | null;
  pdf_url: string | null;
  created_at: string;
  start_date: string;
  end_date: string;
  student_or_company: string | null;
}

export function useInstructorContracts(instructorId: string | undefined) {
  return useQuery({
    queryKey: ["instructor-contracts", instructorId],
    enabled: !!instructorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructor_contracts")
        .select(
          "id, instructor_id, inscription_id, contract_number, signed_at, pdf_url, created_at, start_date, end_date, student_or_company"
        )
        .eq("instructor_id", instructorId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as InstructorContract[];
    },
  });
}

export function useInstructorPayments(instructorId: string | undefined) {
  return useQuery({
    queryKey: ["instructor-payments", instructorId],
    enabled: !!instructorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructor_payments")
        .select("*")
        .eq("instructor_id", instructorId!)
        .order("periode_debut", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateInstructor() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (values: Partial<Instructor>) => {
      const { data, error } = await supabase
        .from("instructors")
        .insert(values as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["instructors"] });
      toast({ title: "Formateur créé" });
    },
    onError: (e: any) => {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    },
  });
}

export function useUpdateInstructor() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<Instructor> & { id: string }) => {
      const { error } = await supabase
        .from("instructors")
        .update(values as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["instructors"] });
      qc.invalidateQueries({ queryKey: ["instructor"] });
      toast({ title: "Formateur mis à jour" });
    },
    onError: (e: any) => {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    },
  });
}

export function useDeleteInstructor() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("instructors").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["instructors"] });
      toast({ title: "Formateur supprimé" });
    },
    onError: (e: any) => {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    },
  });
}

export function useCreateInstructorSession() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (values: Omit<InstructorSession, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("instructor_sessions")
        .insert(values as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["instructor-sessions"] });
      toast({ title: "Session créée" });
    },
    onError: (e: any) => {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    },
  });
}

export async function checkScheduleConflict(
  instructorId: string,
  sessionDate: string,
  startTime: string,
  endTime: string,
  excludeId?: string
): Promise<boolean> {
  let query = supabase
    .from("instructor_sessions")
    .select("id")
    .eq("instructor_id", instructorId)
    .eq("session_date", sessionDate)
    .lt("start_time", endTime)
    .gt("end_time", startTime)
    .neq("status", "annulee");

  if (excludeId) query = query.neq("id", excludeId);

  const { data } = await query;
  return (data || []).length > 0;
}
