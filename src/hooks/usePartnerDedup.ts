import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  assertProspectionNonGelee,
  PROSPECTION_MONITEURS_GELEE,
} from "@/lib/prospection-gel";
import {
  buildPartnerDedupClusters,
  findDedupMatchesFor,
  mergeDedupMapEntry,
  parsePartnerDedupMap,
  PARTNER_DEDUP_MAP_KEY,
  partnerIdsInDedupClusters,
  pickPreferredPartner,
  suggestPartnerDisplayName,
  type PartnerDedupInput,
  type PartnerDedupMap,
  type PartnerDedupMatch,
} from "@/lib/partner-dedup";

async function remapPartnerForeignKeys(loserId: string, keeperId: string): Promise<void> {
  const steps: Array<() => PromiseLike<{ error: { message: string } | null }>> = [
    () =>
      supabase.from("inscriptions").update({ partner_id: keeperId }).eq("partner_id", loserId),
    () => supabase.from("leads").update({ partner_id: keeperId }).eq("partner_id", loserId),
    () =>
      supabase.from("ski_schools").update({ partner_id: keeperId }).eq("partner_id", loserId),
    () =>
      supabase
        .from("partner_contacts")
        .update({ partner_id: keeperId })
        .eq("partner_id", loserId),
    () =>
      supabase
        .from("partner_contracts")
        .update({ partner_id: keeperId })
        .eq("partner_id", loserId),
    () =>
      supabase
        .from("course_intakes")
        .update({ hosting_partner_id: keeperId })
        .eq("hosting_partner_id", loserId),
  ];

  // ski_monitors est gelé en écriture : on ne tente le remap que si le gel est levé.
  if (!PROSPECTION_MONITEURS_GELEE) {
    steps.push(() =>
      supabase.from("ski_monitors").update({ partner_id: keeperId }).eq("partner_id", loserId)
    );
  }

  for (const step of steps) {
    const { error } = await step();
    if (error) throw error;
  }
}

async function ensureContactFromLoser(
  keeperId: string,
  loser: PartnerDedupInput
): Promise<void> {
  const display =
    suggestPartnerDisplayName(loser) ||
    (loser.type === "directeur" && !loser.name.includes("@") ? loser.name.trim() : null) ||
    loser.contact_name?.trim() ||
    null;
  if (!display && !loser.contact_email) return;

  const { data: existing, error: readErr } = await supabase
    .from("partner_contacts")
    .select("id, email, name")
    .eq("partner_id", keeperId);
  if (readErr) throw readErr;

  const email = (loser.contact_email || (loser.name.includes("@") ? loser.name : null) || "")
    .trim()
    .toLowerCase();
  if (
    existing?.some(
      (c) =>
        (email && c.email?.toLowerCase() === email) ||
        (display && c.name.trim().toLowerCase() === display.toLowerCase())
    )
  ) {
    return;
  }

  const { error } = await supabase.from("partner_contacts").insert({
    partner_id: keeperId,
    name: display || email || "Contact fusionné",
    role: loser.type === "directeur" ? "Directeur" : null,
    email: email || null,
    phone: loser.contact_phone || null,
    is_primary: false,
  });
  if (error) throw error;
}

export function usePartnerDedupMap() {
  return useQuery({
    queryKey: ["app-settings", PARTNER_DEDUP_MAP_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", PARTNER_DEDUP_MAP_KEY)
        .maybeSingle();
      if (error) throw error;
      return parsePartnerDedupMap(data?.value);
    },
    staleTime: 60_000,
  });
}

export function usePartnerDedupIndex() {
  const mapQuery = usePartnerDedupMap();

  const inventoryQuery = useQuery({
    queryKey: ["partners-dedup-inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partners")
        .select("id, name, type, status, station, contact_email, contact_name, contact_phone");
      if (error) throw error;
      return (data || []) as PartnerDedupInput[];
    },
    staleTime: 60_000,
  });

  const derived = useMemo(() => {
    const map = mapQuery.data ?? {};
    const all = inventoryQuery.data ?? [];
    const active = all.filter((p) => !map[p.id]);
    const clusters = buildPartnerDedupClusters(active);
    const duplicateIds = partnerIdsInDedupClusters(clusters);
    return { map, all, clusters, duplicateIds };
  }, [inventoryQuery.data, mapQuery.data]);

  return {
    ...derived,
    isLoading: inventoryQuery.isLoading || mapQuery.isLoading,
    error: inventoryQuery.error || mapQuery.error,
    matchesFor(partnerId: string): PartnerDedupMatch[] {
      return findDedupMatchesFor(partnerId, derived.clusters);
    },
  };
}

export function useMergePartners() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      keeperId,
      loserId,
      loser,
    }: {
      keeperId: string;
      loserId: string;
      loser: PartnerDedupInput;
    }) => {
      if (keeperId === loserId) throw new Error("Impossible de fusionner une fiche avec elle-même");

      await remapPartnerForeignKeys(loserId, keeperId);
      await ensureContactFromLoser(keeperId, loser);

      const { data: setting, error: readErr } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", PARTNER_DEDUP_MAP_KEY)
        .maybeSingle();
      if (readErr) throw readErr;
      const current = parsePartnerDedupMap(setting?.value);
      const next = mergeDedupMapEntry(current, loserId, keeperId);
      const { error: upsertErr } = await supabase.from("app_settings").upsert(
        {
          key: PARTNER_DEDUP_MAP_KEY,
          value: next,
          description: "BL-038 — fiches partenaires fusionnées (loser → keeper)",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );
      if (upsertErr) throw upsertErr;

      let deleted = false;
      if (!PROSPECTION_MONITEURS_GELEE) {
        assertProspectionNonGelee();
        const { error: delErr } = await supabase.from("partners").delete().eq("id", loserId);
        if (delErr) throw delErr;
        deleted = true;
      }

      return { deleted, map: next as PartnerDedupMap };
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["partners"] });
      qc.invalidateQueries({ queryKey: ["partners-dedup-inventory"] });
      qc.invalidateQueries({ queryKey: ["app-settings", PARTNER_DEDUP_MAP_KEY] });
      qc.invalidateQueries({ queryKey: ["partner"] });
      qc.invalidateQueries({ queryKey: ["partner-contacts"] });
      qc.invalidateQueries({ queryKey: ["partner-contracts"] });
      qc.invalidateQueries({ queryKey: ["partner-inscriptions"] });
      toast({
        title: "Fusion effectuée",
        description: result.deleted
          ? "La fiche doublon a été fusionnée et supprimée."
          : "Liens et contact repris. La fiche fantôme reste visible tant que le gel prospection n’est pas levé (elle est masquée dans la liste).",
      });
    },
    onError: (e: Error) =>
      toast({ variant: "destructive", title: "Fusion impossible", description: e.message }),
  });
}

export function preferredKeeperAmong(
  current: PartnerDedupInput,
  match: PartnerDedupInput
): PartnerDedupInput {
  return pickPreferredPartner([current, match]);
}
