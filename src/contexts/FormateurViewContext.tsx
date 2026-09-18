import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type FormateurViewMode = "own" | "assist";

type FormateurViewContextValue = {
  mode: FormateurViewMode;
  instructorId: string | null;
  instructorName: string | null;
  basePath: string;
  isAssistMode: boolean;
  isLoading: boolean;
};

const FormateurViewContext = createContext<FormateurViewContextValue>({
  mode: "own",
  instructorId: null,
  instructorName: null,
  basePath: "/formateur",
  isAssistMode: false,
  isLoading: false,
});

export function useFormateurView() {
  return useContext(FormateurViewContext);
}

export function FormateurOwnViewProvider({ children }: { children: ReactNode }) {
  const value = useMemo<FormateurViewContextValue>(
    () => ({
      mode: "own",
      instructorId: null,
      instructorName: null,
      basePath: "/formateur",
      isAssistMode: false,
      isLoading: false,
    }),
    []
  );
  return (
    <FormateurViewContext.Provider value={value}>{children}</FormateurViewContext.Provider>
  );
}

/** /portails/formateur/:instructorId/* — admin voit l'espace du formateur. */
export function FormateurAssistViewProvider({ children }: { children: ReactNode }) {
  const { instructorId } = useParams<{ instructorId: string }>();

  const { data: instructor, isLoading } = useQuery({
    queryKey: ["assist-formateur", instructorId],
    queryFn: async () => {
      if (!instructorId) return null;
      const { data, error } = await supabase
        .from("instructors")
        .select("id, first_name, last_name")
        .eq("id", instructorId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(instructorId),
  });

  const value = useMemo<FormateurViewContextValue>(() => {
    const name = instructor
      ? `${instructor.first_name ?? ""} ${instructor.last_name ?? ""}`.trim()
      : null;
    return {
      mode: "assist",
      instructorId: instructorId ?? null,
      instructorName: name || null,
      basePath: instructorId ? `/portails/formateur/${instructorId}` : "/formateur",
      isAssistMode: true,
      isLoading,
    };
  }, [instructorId, instructor, isLoading]);

  return (
    <FormateurViewContext.Provider value={value}>{children}</FormateurViewContext.Provider>
  );
}
