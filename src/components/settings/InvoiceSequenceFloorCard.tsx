import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Hash, Loader2 } from "lucide-react";
import { StatusPill, SurfaceCard } from "@/components/ui-kit";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const SETTING_KEY = "invoice_sequence_floor";

function parseFloor(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

export function InvoiceSequenceFloorCard() {
  const qc = useQueryClient();
  const [draft, setDraft] = useState("0");

  const query = useQuery({
    queryKey: ["app-settings", SETTING_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value, description")
        .eq("key", SETTING_KEY)
        .maybeSingle();
      if (error) throw error;
      return {
        floor: parseFloor(data?.value),
        description: data?.description ?? null,
      };
    },
  });

  useEffect(() => {
    if (query.data) setDraft(String(query.data.floor));
  }, [query.data]);

  const save = useMutation({
    mutationFn: async (floor: number) => {
      const { error } = await supabase.from("app_settings").upsert(
        {
          key: SETTING_KEY,
          value: floor,
          description:
            "Plancher de séquence facture ; 0 = désactivé (prochaine facture = MAX+1).",
        },
        { onConflict: "key" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["app-settings", SETTING_KEY] });
      toast.success("Plancher de numérotation enregistré");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Enregistrement impossible");
    },
  });

  const handleSave = () => {
    const n = Number.parseInt(draft, 10);
    if (!Number.isFinite(n) || n < 0) {
      toast.error("Le plancher doit être un entier ≥ 0");
      return;
    }
    save.mutate(n);
  };

  return (
    <SurfaceCard
      title="Numérotation des factures"
      icon={Hash}
      description={`Plancher de séquence (${SETTING_KEY}). Une nouvelle facture sans numéro reçoit GREATEST(MAX existant, plancher) + 1. Mettre 0 après l'import historique : le MAX en base suffit.`}
      actions={
        query.isLoading ? undefined : (
          <StatusPill tone={(query.data?.floor ?? 0) > 0 ? "warning" : "neutral"}>
            {(query.data?.floor ?? 0) > 0
              ? `Plancher ${query.data?.floor}`
              : "Plancher désactivé"}
          </StatusPill>
        )
      }
    >
      {query.isLoading ? (
        <div aria-busy="true">
          <span className="sr-only">Chargement...</span>
          <Skeleton className="h-10 w-64 rounded-[var(--radius)]" />
        </div>
      ) : (
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-2">
            <Label htmlFor="invoice-sequence-floor">Plancher (0 = désactivé)</Label>
            <Input
              id="invoice-sequence-floor"
              type="number"
              min={0}
              step={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-40 tabular"
            />
          </div>
          <Button onClick={handleSave} disabled={save.isPending}>
            {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Enregistrer le plancher
          </Button>
        </div>
      )}
    </SurfaceCard>
  );
}
