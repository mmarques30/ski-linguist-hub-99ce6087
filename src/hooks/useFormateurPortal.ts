import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFormateurView } from "@/contexts/FormateurViewContext";
import type { FormateurInscriptionRow, FormateurInstructorIdentity } from "@/lib/formateur-portal";
import {
  offeringMatchesInstructor,
  toFormateurCatalogSession,
} from "@/lib/formateur-portal";
import type { RegistrationOffering } from "@/lib/registration-offerings";

export type { FormateurInscriptionRow, FormateurCatalogSession } from "@/lib/formateur-portal";
export {
  splitFormateurInscriptions,
  splitFormateurCatalogSessions,
  uniqueStagiairesFromInscriptions,
} from "@/lib/formateur-portal";

const INSCRIPTION_SELECT =
  "id, code, language, start_date, end_date, status, student_id, student_name, student_email, student_phone, student_city, student_company, course_location, course_address, modality, rhythm, schedule, group_name, ski_school_name, duration_hours, expectations, entry_test_id, entry_test_score, entry_level, formulaire_entree, remarques_entree, entry_form_completed_at, exit_form_completed_at, niveau_general_entree, niveau_technique_entree, niveau_general_sortie, niveau_technique_sortie";

/** Profil instructeur : soi-même (auth) ou cible Assister. */
export function useFormateurProfile() {
  const { user } = useAuth();
  const { isAssistMode, instructorId: assistInstructorId, isLoading: assistLoading } =
    useFormateurView();

  return useQuery({
    queryKey: [
      "formateur-portal-profile",
      isAssistMode ? assistInstructorId : user?.id,
    ],
    enabled: isAssistMode ? Boolean(assistInstructorId) && !assistLoading : Boolean(user),
    queryFn: async () => {
      if (isAssistMode) {
        const { data, error } = await supabase
          .from("instructors")
          .select(
            "id, first_name, last_name, email, phone, languages, status, city, photo_url, address, postal_code, pays, civilite, siret, tax_status, identifiant_etranger, assujetti_tva, statut_administratif, cv_url, vigilance_attestation_url, vigilance_attestation_received_at, vigilance_attestation_expires_at, specialty_details, bio, hourly_rate"
          )
          .eq("id", assistInstructorId!)
          .maybeSingle();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from("instructors")
        .select(
          "id, first_name, last_name, email, phone, languages, status, city, photo_url, address, postal_code, pays, civilite, siret, tax_status, identifiant_etranger, assujetti_tva, statut_administratif, cv_url, vigilance_attestation_url, vigilance_attestation_received_at, vigilance_attestation_expires_at, specialty_details, bio, hourly_rate"
        )
        .eq("auth_user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useFormateurInscriptions(instructorId: string | undefined) {
  return useQuery({
    queryKey: ["formateur-portal-inscriptions", instructorId],
    enabled: Boolean(instructorId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inscriptions_complete")
        .select(INSCRIPTION_SELECT)
        .eq("instructor_id", instructorId!)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as FormateurInscriptionRow[];
    },
  });
}

export function useFormateurSessions(instructorId: string | undefined) {
  return useQuery({
    queryKey: ["formateur-portal-sessions", instructorId],
    enabled: Boolean(instructorId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructor_sessions")
        .select(
          "id, session_date, start_time, end_time, duration_hours, status, location, notes, inscription_id, inscriptions(code, language, students(first_name, last_name))"
        )
        .eq("instructor_id", instructorId!)
        .order("session_date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/**
 * Sessions catalogue affectées au formateur (via instructor_id ou libellé),
 * visibles même sans inscrits.
 */
export function useFormateurCatalogSessions(
  profile: FormateurInstructorIdentity | null | undefined
) {
  return useQuery({
    queryKey: [
      "formateur-portal-catalog-sessions",
      profile?.id,
      profile?.first_name,
      profile?.last_name,
    ],
    enabled: Boolean(profile?.id),
    queryFn: async () => {
      const { data: season } = await supabase
        .from("seasons")
        .select("id")
        .eq("is_current", true)
        .maybeSingle();

      let query = supabase
        .from("registration_offerings")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (season?.id) {
        query = query.or(`season_id.eq.${season.id},season_id.is.null`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const offerings = (data ?? []) as Array<
        RegistrationOffering & { instructor_id?: string | null }
      >;

      return offerings
        .filter((offering) => offeringMatchesInstructor(offering, profile!))
        .map(toFormateurCatalogSession);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useFormateurPayments(instructorId: string | undefined) {
  return useQuery({
    queryKey: ["formateur-portal-payments", instructorId],
    enabled: Boolean(instructorId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructor_payments")
        .select(
          "id, montant, periode_debut, periode_fin, date_paiement, moyen_paiement, reference_paiement, statut, notes"
        )
        .eq("instructor_id", instructorId!)
        .order("periode_debut", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useFormateurContracts(instructorId: string | undefined) {
  return useQuery({
    queryKey: ["formateur-portal-contracts", instructorId],
    enabled: Boolean(instructorId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructor_contracts")
        .select(
          "id, contract_number, start_date, end_date, signed_at, pdf_url, student_or_company, created_at"
        )
        .eq("instructor_id", instructorId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}
