import { describe, expect, it } from "vitest";
import {
  detectSchoolKind,
  extractStation,
  suggestSchoolPartnerMatches,
} from "./ski-school-partner-match";

describe("ski-school-partner-match", () => {
  it("detects ESF vs non-ESF schools", () => {
    expect(detectSchoolKind("ESF Courchevel 1550")).toBe("esf");
    expect(detectSchoolKind("Val Cenis")).toBe("ecole_ski");
    expect(detectSchoolKind("Auris en Oisans")).toBe("ecole_ski");
  });

  it("extracts station from school name", () => {
    expect(extractStation("ESF LA Rosière")).toBe("la rosiere");
    expect(extractStation("Val Cenis")).toBe("val cenis");
  });

  it("suggests partner by station", () => {
    const preview = suggestSchoolPartnerMatches(
      {
        id: "1",
        name: "ESF Samoens",
        director_name: "Sébastien Baud",
      },
      [
        {
          id: "p1",
          name: "ESF Samoëns",
          type: "esf",
          station: "SAMOENS",
          contact_name: "Sébastien Baud",
        },
        {
          id: "p2",
          name: "Magasin ski",
          type: "magasin",
          station: "SAMOENS",
        },
      ]
    );

    expect(preview.best_match?.partner.id).toBe("p1");
    expect(preview.school_kind).toBe("esf");
  });
});
