import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function source(relatif: string): string {
  return readFileSync(join(process.cwd(), relatif), "utf8");
}

describe("BL-038 — hard dedup partenaires", () => {
  it("expose la lib de détection et le mapping app_settings", () => {
    const lib = source("src/lib/partner-dedup.ts");
    expect(lib).toContain("PARTNER_DEDUP_MAP_KEY");
    expect(lib).toContain("buildPartnerDedupClusters");
    expect(lib).toContain("directorStationMatchesEsf");
    expect(lib).toContain("pickPreferredPartner");
    expect(lib).toContain("suggestPartnerDisplayName");
  });

  it("branche le filtre Doublons et le badge sur la liste", () => {
    const list = source("src/pages/partners/PartnersList.tsx");
    expect(list).toContain("usePartnerDedupIndex");
    expect(list).toContain('value="doublons"');
    expect(list).toContain("Doublon");
    expect(list).toContain("duplicateIds");
  });

  it("affiche le panneau de fusion sur la fiche", () => {
    const details = source("src/pages/partners/PartnerDetails.tsx");
    expect(details).toContain("PartnerDedupPanel");
    expect(details).toContain("dedupMatches");
    expect(details).toContain("supersededBy");
  });

  it("merge remappe les FK et enregistre le mapping", () => {
    const hook = source("src/hooks/usePartnerDedup.ts");
    expect(hook).toContain("useMergePartners");
    expect(hook).toContain("PARTNER_DEDUP_MAP_KEY");
    expect(hook).toContain("partner_contacts");
    expect(hook).toContain("inscriptions");
    expect(hook).toContain("PROSPECTION_MONITEURS_GELEE");
  });
});
