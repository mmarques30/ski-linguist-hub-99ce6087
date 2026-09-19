import { describe, expect, it } from "vitest";
import {
  buildPartnerDedupClusters,
  directorStationMatchesEsf,
  findDedupMatchesFor,
  mergeDedupMapEntry,
  normalizePartnerStation,
  normalizePartnerText,
  parsePartnerDedupMap,
  partnerIdsInDedupClusters,
  pickPreferredPartner,
  resolveDedupKeeper,
  suggestPartnerDisplayName,
  type PartnerDedupInput,
} from "./partner-dedup";

function p(partial: Partial<PartnerDedupInput> & Pick<PartnerDedupInput, "id" | "name">): PartnerDedupInput {
  return {
    type: "directeur",
    status: "prospect",
    station: null,
    contact_email: null,
    contact_name: null,
    contact_phone: null,
    ...partial,
  };
}

describe("partner-dedup normalize", () => {
  it("normalise accents et ponctuation", () => {
    expect(normalizePartnerText("ESF Samoëns")).toBe("esf samoens");
    expect(normalizePartnerStation("ESF VAL D'ISERE")).toBe("val d isere");
  });
});

describe("directorStationMatchesEsf", () => {
  const esf = p({
    id: "esf1",
    name: "ESF COURCHEVEL 1550",
    type: "esf",
    status: "actif",
    station: "courchevel",
  });

  it("matche station = nom ESF", () => {
    expect(directorStationMatchesEsf("ESF COURCHEVEL 1550", esf)).toBe(true);
  });

  it("ne matche pas une station voisine (Chapelle ≠ Abondance)", () => {
    const abondance = p({
      id: "esf2",
      name: "ESF ABONDANCE",
      type: "esf",
      status: "actif",
      station: "abondance",
    });
    expect(directorStationMatchesEsf("ESF CHAPELLE D'ABONDANCE (LA)", abondance)).toBe(false);
  });

  it("matche station courte = station ESF", () => {
    const avoriaz = p({
      id: "esf3",
      name: "ESF AVORIAZ",
      type: "esf",
      status: "actif",
      station: "avoriaz",
    });
    expect(directorStationMatchesEsf("AVORIAZ", avoriaz)).toBe(true);
  });
});

describe("suggestPartnerDisplayName", () => {
  it("extrait le nom derrière À l'attention", () => {
    expect(
      suggestPartnerDisplayName(
        p({ id: "1", name: "À L'Attention De Loïc Lemoine" })
      )
    ).toBe("Loïc Lemoine");
  });

  it("utilise contact_name si le nom est un e-mail", () => {
    expect(
      suggestPartnerDisplayName(
        p({
          id: "1",
          name: "info@esfarcs1600.com",
          contact_name: "Pascal Bohard",
        })
      )
    ).toBe("Pascal Bohard");
  });
});

describe("pickPreferredPartner", () => {
  it("préfère ESF actif au directeur prospect", () => {
    const keeper = pickPreferredPartner([
      p({ id: "d", name: "Jean Dupont", type: "directeur", status: "prospect" }),
      p({ id: "e", name: "ESF TEST", type: "esf", status: "actif", station: "test" }),
    ]);
    expect(keeper.id).toBe("e");
  });

  it("évite le nom = e-mail", () => {
    const keeper = pickPreferredPartner([
      p({ id: "a", name: "info@esf.fr", type: "directeur", status: "prospect" }),
      p({ id: "b", name: "ESF FOO", type: "directeur", status: "prospect", station: "foo" }),
    ]);
    expect(keeper.id).toBe("b");
  });
});

describe("buildPartnerDedupClusters", () => {
  it("regroupe les doublons de casse même station", () => {
    const clusters = buildPartnerDedupClusters([
      p({
        id: "1",
        name: "Yannick BUFFET",
        type: "directeur",
        status: "prospect",
        station: "ESF PRAZ/ARLY",
      }),
      p({
        id: "2",
        name: "YANNICK BUFFET",
        type: "directeur",
        status: "prospect",
        station: "ESF PRAZ/ARLY",
      }),
      p({
        id: "3",
        name: "Autre",
        type: "directeur",
        status: "prospect",
        station: "ailleurs",
      }),
    ]);
    expect(clusters.some((c) => c.reason === "same_name_station")).toBe(true);
    const ids = partnerIdsInDedupClusters(clusters);
    expect(ids.has("1")).toBe(true);
    expect(ids.has("2")).toBe(true);
    expect(ids.has("3")).toBe(false);
  });

  it("ne regroupe pas Intersport sur des stations différentes", () => {
    const clusters = buildPartnerDedupClusters([
      p({ id: "1", name: "Intersport", type: "magasin", status: "prospect", station: "MEGEVE" }),
      p({ id: "2", name: "Intersport", type: "magasin", status: "prospect", station: "FLAINE" }),
    ]);
    expect(clusters.filter((c) => c.reason === "same_name_station")).toHaveLength(0);
  });

  it("lie un directeur prospect à l'ESF actif de sa station", () => {
    const clusters = buildPartnerDedupClusters([
      p({
        id: "esf",
        name: "ESF ARCS 1600",
        type: "esf",
        status: "actif",
        station: "arcs 1600",
      }),
      p({
        id: "dir",
        name: "info@esfarcs1600.com",
        type: "directeur",
        status: "prospect",
        station: "ESF ARCS 1600",
        contact_email: "info@esfarcs1600.com",
      }),
      p({
        id: "mag",
        name: "Sport 2000",
        type: "magasin",
        status: "prospect",
        station: "LES ARCS",
      }),
    ]);
    const esfCluster = clusters.find((c) => c.reason === "directeur_esf");
    expect(esfCluster).toBeTruthy();
    expect(esfCluster!.keeperId).toBe("esf");
    expect(esfCluster!.members.map((m) => m.id).sort()).toEqual(["dir", "esf"]);
  });
});

describe("findDedupMatchesFor", () => {
  it("retourne les pairs d'un membre", () => {
    const partners = [
      p({ id: "esf", name: "ESF TEST", type: "esf", status: "actif", station: "test" }),
      p({
        id: "dir",
        name: "À L'Attention De Alice",
        type: "directeur",
        status: "prospect",
        station: "ESF TEST",
      }),
    ];
    const clusters = buildPartnerDedupClusters(partners);
    const matches = findDedupMatchesFor("dir", clusters);
    expect(matches).toHaveLength(1);
    expect(matches[0].partner.id).toBe("esf");
    expect(matches[0].reason).toBe("directeur_esf");
  });
});

describe("dedup map", () => {
  it("parse et résout les chaînes", () => {
    expect(parsePartnerDedupMap({ a: "b", b: "c" })).toEqual({ a: "b", b: "c" });
    const map = mergeDedupMapEntry({ a: "b" }, "b", "c");
    expect(map.b).toBe("c");
    expect(map.a).toBe("c");
    expect(resolveDedupKeeper("a", map)).toBe("c");
  });
});
