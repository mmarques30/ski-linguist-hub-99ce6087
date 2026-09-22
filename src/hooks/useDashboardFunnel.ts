import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FunnelStage {
  key: string;
  label: string;
  value: number;
  /**
   * Conversion depuis l'étape précédente, en pourcentage — renseignée
   * uniquement quand l'étape est réellement un sous-ensemble de la
   * précédente. Leads, tests et dossiers sont trois populations distinctes :
   * afficher un ratio entre elles produirait des « 182 % » dénués de sens.
   */
  conversion: number | null;
  href: string;
}

/**
 * Entonnoir commercial → formation, en comptages serveur uniquement
 * (`count: "exact", head: true`) : aucune ligne n'est rapatriée.
 *
 * Les étapes sont des états réels de la base, pas une projection : on lit le
 * nombre de leads, de tests passés, de dossiers créés, de dossiers confirmés
 * ou au-delà, et de dossiers facturés.
 */
export function useDashboardFunnel() {
  return useQuery({
    queryKey: ["dashboard-funnel"],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<FunnelStage[]> => {
      const countOf = async (
        table: string,
        apply?: (query: ReturnType<typeof supabase.from>) => unknown
      ): Promise<number> => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let query: any = supabase.from(table as never).select("*", { count: "exact", head: true });
        if (apply) query = apply(query);
        const { count, error } = await query;
        if (error) return 0;
        return count ?? 0;
      };

      const [leads, tests, dossiers, confirmes, factures] = await Promise.all([
        countOf("leads"),
        countOf("placement_tests"),
        countOf("inscriptions"),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        countOf("inscriptions", (q: any) =>
          q.in("status", ["confirmee", "en_cours", "terminee", "facturee"])
        ),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        countOf("inscriptions", (q: any) => q.eq("status", "facturee")),
      ]);

      /** `nested` : l'étape est un sous-ensemble strict de la précédente. */
      const raw: Array<Omit<FunnelStage, "conversion"> & { nested: boolean }> = [
        { key: "leads", label: "Leads", value: leads, href: "/gestion/commercial", nested: false },
        { key: "tests", label: "Tests de niveau", value: tests, href: "/tests", nested: false },
        {
          key: "dossiers",
          label: "Dossiers créés",
          value: dossiers,
          href: "/inscriptions",
          nested: false,
        },
        {
          key: "confirmes",
          label: "Confirmés et au-delà",
          value: confirmes,
          href: "/inscriptions?status=confirmee",
          nested: true,
        },
        {
          key: "factures",
          label: "Facturés",
          value: factures,
          href: "/inscriptions?status=facturee",
          nested: true,
        },
      ];

      return raw.map(({ nested, ...stage }, position) => {
        const previous = position === 0 ? null : raw[position - 1].value;
        return {
          ...stage,
          conversion:
            nested && previous && previous > 0
              ? Math.round((stage.value / previous) * 100)
              : null,
        };
      });
    },
  });
}
