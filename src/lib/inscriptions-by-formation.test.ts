import { describe, expect, it } from "vitest";
import {
  FORMATION_NO_LOCATION_LABEL,
  formationGroupKey,
  formationGroupTitle,
  formationLocationLabel,
  groupInscriptionsByFormation,
} from "@/lib/inscriptions-by-formation";

describe("libellé de lieu", () => {
  it("conserve un lieu renseigné", () => {
    expect(formationLocationLabel("Val d'Isère")).toBe("Val d'Isère");
    expect(formationLocationLabel("  Sainte-Foy  ")).toBe("Sainte-Foy");
  });

  it("remplace l'absence de lieu", () => {
    expect(formationLocationLabel(null)).toBe(FORMATION_NO_LOCATION_LABEL);
    expect(formationLocationLabel(undefined)).toBe(FORMATION_NO_LOCATION_LABEL);
    expect(formationLocationLabel("   ")).toBe(FORMATION_NO_LOCATION_LABEL);
  });
});

describe("clé de formation", () => {
  it("sépare deux lieux à mêmes dates et langue", () => {
    const base = {
      id: "1",
      language: "Anglais",
      start_date: "2026-12-01",
      end_date: "2026-12-05",
      modality: "Présentiel",
    };
    const a = formationGroupKey({ ...base, course_location: "Val d'Isère" });
    const b = formationGroupKey({ ...base, course_location: "Sainte-Foy" });
    expect(a).not.toBe(b);
  });

  it("traite Portugais et Portugais brésilien comme la même formation", () => {
    const base = {
      id: "1",
      start_date: "2026-11-30",
      end_date: "2026-12-11",
      course_location: "ESF La Rosière",
      modality: "Présentiel",
    };
    expect(
      formationGroupKey({ ...base, language: "Portugais" })
    ).toBe(
      formationGroupKey({ ...base, language: "Portugais brésilien" })
    );
  });

  it("isole les dossiers à dates encore à planifier", () => {
    const confirmed = formationGroupKey({
      id: "1",
      language: "Anglais",
      start_date: "2026-12-01",
      end_date: "2026-12-05",
      course_location: "Val d'Isère",
      dates_to_confirm: false,
    });
    const wish = formationGroupKey({
      id: "2",
      language: "Anglais",
      start_date: "2026-12-01",
      end_date: "2026-12-05",
      course_location: "Val d'Isère",
      dates_to_confirm: true,
    });
    expect(confirmed).not.toBe(wish);
  });
});

describe("regroupement par formation", () => {
  const rows = [
    {
      id: "b",
      language: "Anglais",
      start_date: "2026-12-08",
      end_date: "2026-12-12",
      course_location: "Val d'Isère",
      modality: "Présentiel",
      student_name: "Zoe",
    },
    {
      id: "a",
      language: "Anglais",
      start_date: "2026-12-08",
      end_date: "2026-12-12",
      course_location: "Val d'Isère",
      modality: "Présentiel",
      student_name: "Alice",
    },
    {
      id: "c",
      language: "Italien",
      start_date: "2026-12-08",
      end_date: "2026-12-12",
      course_location: "Val d'Isère",
      modality: "Présentiel",
      student_name: "Marco",
    },
    {
      id: "d",
      language: "Anglais",
      start_date: "2026-12-01",
      end_date: "2026-12-05",
      course_location: null,
      modality: "Visio",
      student_name: "Bob",
    },
  ];

  it("groupe par lieu, langue, dates et modalité", () => {
    const groups = groupInscriptionsByFormation(rows);
    expect(groups).toHaveLength(3);

    const valEng = groups.find(
      (g) => g.location === "Val d'Isère" && g.language === "Anglais"
    );
    expect(valEng?.inscriptions.map((i) => i.id)).toEqual(["a", "b"]);
  });

  it("ordonne les formations par date de début croissante", () => {
    const groups = groupInscriptionsByFormation(rows);
    expect(groups[0].startDate).toBe("2026-12-01");
    expect(groups[0].location).toBe(FORMATION_NO_LOCATION_LABEL);
    expect(groups[1].language).toBe("Anglais");
    expect(groups[2].language).toBe("Italien");
  });

  it("ordonne les stagiaires par nom dans un groupe", () => {
    const groups = groupInscriptionsByFormation(rows);
    const valEng = groups.find(
      (g) => g.location === "Val d'Isère" && g.language === "Anglais"
    );
    expect(valEng?.inscriptions.map((i) => i.student_name)).toEqual([
      "Alice",
      "Zoe",
    ]);
  });

  it("regroupe Portugais et Portugais brésilien (La Rosière)", () => {
    const groups = groupInscriptionsByFormation([
      {
        id: "julian",
        language: "Portugais brésilien",
        start_date: "2026-11-30",
        end_date: "2026-12-11",
        course_location: "ESF La Rosière",
        modality: "Présentiel",
        student_name: "Julian Sanchez",
      },
      {
        id: "christelle",
        language: "Portugais",
        start_date: "2026-11-30",
        end_date: "2026-12-11",
        course_location: "ESF La Rosière",
        modality: "Présentiel",
        student_name: "Christelle Gaidet",
      },
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].language).toBe("Portugais brésilien");
    expect(groups[0].inscriptions.map((i) => i.id)).toEqual([
      "christelle",
      "julian",
    ]);
  });
});

describe("titre de carte", () => {
  it("place le lieu avant la langue", () => {
    expect(
      formationGroupTitle({ location: "Sainte-Foy", language: "Anglais" })
    ).toBe("Sainte-Foy · Anglais");
  });
});
