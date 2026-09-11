import { describe, expect, it } from "vitest";
import {
  applySpellingProposal,
  findSpellingProposals,
} from "./evaluation-spellcheck";

describe("propositions d'orthographe", () => {
  it("propose une correction et ne réécrit pas le reste", () => {
    const text = "Merci d'apprecier le niveau. Vous vous présentez clairement.";
    const proposals = findSpellingProposals([
      { field: "bloc_introduction", label: "Introduction", text },
    ]);
    expect(proposals).toHaveLength(1);
    expect(proposals[0].from).toBe("apprecier");
    expect(proposals[0].to).toBe("apprécier");
    const next = applySpellingProposal(text, proposals[0]);
    expect(next).toContain("apprécier");
    expect(next).toContain("présentez");
    expect(next).not.toContain("apprecier");
  });

  it("traite deux fautes une à une", () => {
    const text = "Il faut etre tres clair.";
    const first = findSpellingProposals([
      { field: "bloc_conclusion", label: "Conclusion", text },
    ]);
    expect(first.map((p) => p.from).sort()).toEqual(["etre", "tres"]);
    const afterFirst = applySpellingProposal(text, first[0]);
    const second = findSpellingProposals([
      { field: "bloc_conclusion", label: "Conclusion", text: afterFirst },
    ]);
    expect(second).toHaveLength(1);
  });

  it("ne signale pas un texte déjà vouvoyé et accentué", () => {
    const proposals = findSpellingProposals([
      {
        field: "bloc_introduction",
        label: "Introduction",
        text: "Vous vous présentez clairement et vous situez votre activité.",
      },
    ]);
    expect(proposals).toEqual([]);
  });
});
