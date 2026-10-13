import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SkiSchoolDirectoryRow } from "@/lib/ski-school-directory";

/** Liste active du référentiel, filtrable par réseau. */
export function useSkiSchoolDirectory(reseau?: string | null) {
  return useQuery({
    queryKey: ["ski-school-directory", reseau ?? "all"],
    enabled: Boolean(reseau) && reseau !== "Indépendant.e" && reseau !== "Autre",
    queryFn: async () => {
      let q = supabase
        .from("ski_school_directory")
        .select("id, reseau, code, nom_affiche, station, departement")
        .eq("is_active", true)
        .order("station", { ascending: true })
        .order("nom_affiche", { ascending: true });

      if (reseau) {
        q = q.eq("reseau", reseau);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as SkiSchoolDirectoryRow[];
    },
  });
}
