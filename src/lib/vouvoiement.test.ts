import { describe, expect, it } from "vitest";
import { collectTutoiement, findTutoiementMatches, hasTutoiement } from "./vouvoiement";

describe("contrôle vouvoiement", () => {
  it("accepte le vouvoiement", () => {
    expect(hasTutoiement("Vous comprenez les consignes. Votre diction est claire.")).toBe(
      false
    );
  });

  it("détecte tu / ton / ta / tes", () => {
    expect(findTutoiementMatches("Tu dois revoir ta prononciation et tes structures.")).toEqual(
      expect.arrayContaining(["tu", "ta", "tes"])
    );
  });

  it("ne confond pas situation / attitude", () => {
    expect(hasTutoiement("Votre attitude en situation professionnelle est adaptée.")).toBe(
      false
    );
  });

  it("regroupe les blocs en infraction", () => {
    const hits = collectTutoiement([
      { label: "Introduction", text: "Vous êtes à l'heure." },
      { label: "Technique", text: "Ton vocabulaire technique manque." },
    ]);
    expect(hits).toEqual([{ label: "Technique", matches: ["ton"] }]);
  });
});
