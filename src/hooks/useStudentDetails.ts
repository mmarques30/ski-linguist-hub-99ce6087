import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Student } from "./useStudents";
import type { InscriptionComplete } from "./useInscriptions";

export interface StudentDetails extends Student {
  inscriptions: InscriptionComplete[];
  stats: {
    totalInscriptions: number;
    completedCourses: number;
    totalHours: number;
    certifications: number;
    languages: string[];
    averageScore: number | null;
  };
}

export function useStudentDetails(studentId: string | undefined) {
  return useQuery({
    queryKey: ["student-details", studentId],
    queryFn: async () => {
      if (!studentId) throw new Error("Student ID is required");

      // Fetch student basic info
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select("*")
        .eq("id", studentId)
        .maybeSingle();

      if (studentError) throw studentError;
      if (!student) throw new Error("Aluno não encontrado");

      // Fetch all inscriptions for this student
      const { data: inscriptions, error: inscriptionsError } = await supabase
        .from("inscriptions_complete")
        .select("*")
        .eq("student_id", studentId)
        .order("start_date", { ascending: false });

      if (inscriptionsError) throw inscriptionsError;

      // Calculate stats
      const inscriptionsList = inscriptions || [];
      const completedCourses = inscriptionsList.filter(
        (i) => i.status === "Terminé" || i.status === "Facturé"
      ).length;

      const totalHours = inscriptionsList.reduce(
        (sum, i) => sum + (Number(i.duration_hours) || 0),
        0
      );

      const certifications = inscriptionsList.filter(
        (i) => i.certification_result && i.certification_result !== "N/A"
      ).length;

      const languages = [
        ...new Set(inscriptionsList.map((i) => i.language).filter(Boolean)),
      ] as string[];

      // Calculate average certification score if available
      const certificationScores = inscriptionsList
        .filter((i) => i.certification_result)
        .map((i) => {
          const levelMap: Record<string, number> = {
            A1: 1,
            A2: 2,
            B1: 3,
            B2: 4,
            C1: 5,
            C2: 6,
          };
          return levelMap[i.certification_result || ""] || null;
        })
        .filter((score): score is number => score !== null);

      const averageScore =
        certificationScores.length > 0
          ? certificationScores.reduce((a, b) => a + b, 0) /
            certificationScores.length
          : null;

      return {
        ...student,
        inscriptions: inscriptionsList as InscriptionComplete[],
        stats: {
          totalInscriptions: inscriptionsList.length,
          completedCourses,
          totalHours,
          certifications,
          languages,
          averageScore,
        },
      } as StudentDetails;
    },
    enabled: !!studentId,
  });
}
