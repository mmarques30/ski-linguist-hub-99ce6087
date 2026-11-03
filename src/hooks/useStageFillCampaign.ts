import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRegistrationOfferings } from "@/hooks/useRegistrationOfferings";
import { useSeasonFilter } from "@/contexts/SeasonContext";
import {
  computeStageFillRows,
  selectAlumniForStage,
  selectDirectorsForStage,
  type StageFillAlumni,
  type StageFillDirector,
  type StageFillInscription,
  type StageFillRow,
} from "@/lib/commercial-stage-fill";
import type { RegistrationOffering } from "@/lib/registration-offerings";

type DirectoryRow = {
  code: string;
  nom_affiche: string;
  station: string | null;
  directeur: string | null;
  courriel_direction: string | null;
  courriel_ecole: string | null;
  is_active: boolean;
};

type StudentRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  ski_school_code: string | null;
};

type HistoryRow = {
  student_id: string;
  language: string;
  status: string;
  start_date: string;
  end_date: string;
  course_location: string | null;
};

export function useStageFillCampaign() {
  const { seasonStart, seasonEnd } = useSeasonFilter();
  const offeringsQuery = useRegistrationOfferings();

  const inscriptionsQuery = useQuery({
    queryKey: ["stage-fill-inscriptions", seasonStart, seasonEnd],
    queryFn: async (): Promise<StageFillInscription[]> => {
      let q = supabase
        .from("inscriptions")
        .select("id, student_id, language, start_date, end_date, course_location, status, modality");
      if (seasonStart) q = q.gte("start_date", seasonStart);
      if (seasonEnd) q = q.lte("start_date", seasonEnd);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as StageFillInscription[];
    },
  });

  const directoryQuery = useQuery({
    queryKey: ["stage-fill-directory"],
    queryFn: async (): Promise<DirectoryRow[]> => {
      const { data, error } = await supabase
        .from("ski_school_directory")
        .select(
          "code, nom_affiche, station, directeur, courriel_direction, courriel_ecole, is_active"
        )
        .eq("is_active", true);
      if (error) throw error;
      return (data ?? []) as DirectoryRow[];
    },
    staleTime: 10 * 60 * 1000,
  });

  const studentsQuery = useQuery({
    queryKey: ["stage-fill-students"],
    queryFn: async (): Promise<StudentRow[]> => {
      const { data, error } = await supabase
        .from("students")
        .select("id, first_name, last_name, email, ski_school_code");
      if (error) throw error;
      return (data ?? []) as StudentRow[];
    },
    staleTime: 10 * 60 * 1000,
  });

  const historyQuery = useQuery({
    queryKey: ["stage-fill-history"],
    queryFn: async (): Promise<HistoryRow[]> => {
      const { data, error } = await supabase
        .from("inscriptions")
        .select("student_id, language, status, start_date, end_date, course_location")
        .not("student_id", "is", null);
      if (error) throw error;
      return (data ?? []) as HistoryRow[];
    },
    staleTime: 10 * 60 * 1000,
  });

  const rows: StageFillRow[] = useMemo(() => {
    if (!offeringsQuery.data || !inscriptionsQuery.data) return [];
    return computeStageFillRows(offeringsQuery.data, inscriptionsQuery.data);
  }, [offeringsQuery.data, inscriptionsQuery.data]);

  const underMin = useMemo(() => rows.filter((r) => r.underMin), [rows]);

  const isLoading =
    offeringsQuery.isLoading ||
    inscriptionsQuery.isLoading ||
    directoryQuery.isLoading ||
    studentsQuery.isLoading ||
    historyQuery.isLoading;

  const error =
    offeringsQuery.error ||
    inscriptionsQuery.error ||
    directoryQuery.error ||
    studentsQuery.error ||
    historyQuery.error;

  function directorsFor(offering: RegistrationOffering): StageFillDirector[] {
    return selectDirectorsForStage(offering, directoryQuery.data ?? []);
  }

  function alumniFor(offering: RegistrationOffering): StageFillAlumni[] {
    return selectAlumniForStage(
      offering,
      studentsQuery.data ?? [],
      historyQuery.data ?? []
    );
  }

  return {
    rows,
    underMin,
    isLoading,
    error: error instanceof Error ? error : error ? new Error(String(error)) : null,
    directorsFor,
    alumniFor,
    refetch: () => {
      void offeringsQuery.refetch();
      void inscriptionsQuery.refetch();
      void directoryQuery.refetch();
      void studentsQuery.refetch();
      void historyQuery.refetch();
    },
  };
}
