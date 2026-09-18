import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type StudentViewMode = "own" | "assist";

type StudentViewContextValue = {
  mode: StudentViewMode;
  /** ID stagiaire effectif (session ou cible d'assistance). */
  studentId: string | null;
  studentName: string | null;
  basePath: string;
  isAssistMode: boolean;
  isLoading: boolean;
};

const StudentViewContext = createContext<StudentViewContextValue>({
  mode: "own",
  studentId: null,
  studentName: null,
  basePath: "/student",
  isAssistMode: false,
  isLoading: false,
});

export function useStudentView() {
  return useContext(StudentViewContext);
}

/** Fournisseur pour le portail réel (mode own) — studentId résolu via auth. */
export function StudentOwnViewProvider({ children }: { children: ReactNode }) {
  const value = useMemo<StudentViewContextValue>(
    () => ({
      mode: "own",
      studentId: null,
      studentName: null,
      basePath: "/student",
      isAssistMode: false,
      isLoading: false,
    }),
    []
  );
  return (
    <StudentViewContext.Provider value={value}>{children}</StudentViewContext.Provider>
  );
}

/** Fournisseur Assister : /portails/stagiaire/:studentId/* */
export function StudentAssistViewProvider({ children }: { children: ReactNode }) {
  const { studentId } = useParams<{ studentId: string }>();

  const { data: student, isLoading } = useQuery({
    queryKey: ["assist-student", studentId],
    queryFn: async () => {
      if (!studentId) return null;
      const { data, error } = await supabase
        .from("students")
        .select("id, first_name, last_name")
        .eq("id", studentId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(studentId),
  });

  const value = useMemo<StudentViewContextValue>(() => {
    const name = student
      ? `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim()
      : null;
    return {
      mode: "assist",
      studentId: studentId ?? null,
      studentName: name || null,
      basePath: studentId ? `/portails/stagiaire/${studentId}` : "/student",
      isAssistMode: true,
      isLoading,
    };
  }, [studentId, student, isLoading]);

  return (
    <StudentViewContext.Provider value={value}>{children}</StudentViewContext.Provider>
  );
}
