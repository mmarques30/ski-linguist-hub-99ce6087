import { describe, expect, it } from "vitest";
import {
  FORMATION_NO_GROUP_LABEL,
  FORMATION_NO_LOCATION_LABEL,
  formationGroupKey,
  formationGroupNameLabel,
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

describe("libellé de groupe", () => {
  it("unifie Groupe matin et la plage 8h30–12h30 en Matin", () => {
    expect(formationGroupNameLabel("Groupe matin", "de 8h30 à 12h30")).toBe(
      "Matin"
    );
    expect(formationGroupNameLabel(null, "de 8h30 à 12h30")).toBe("Matin");
    expect(formationGroupNameLabel(null, null, "matin")).toBe("Matin");
  });

  it("unifie après-midi (libellé ou plage) en Après-midi", () => {
    expect(
      formationGroupNameLabel("Groupe après-midi", "de 13h30 à 17h30")
    ).toBe("Après-midi");
    expect(formationGroupNameLabel(null, "de 13h30 à 17h30")).toBe(
      "Après-midi"
    );
  });

  it("conserve un group_name hors créneau FLI", () => {
    expect(formationGroupNameLabel("Groupe 1", null)).toBe("Groupe 1");
    expect(formationGroupNameLabel("Individuel", null)).toBe("Individuel");
  });

  it("remplace l'absence totale", () => {
    expect(formationGroupNameLabel(null, null)).toBe(FORMATION_NO_GROUP_LABEL);
    expect(formationGroupNameLabel("  ", "  ")).toBe(FORMATION_NO_GROUP_LABEL);
  });
});

describe("fusion Val d'Isère matin", () => {
  it("ne scinde plus Groupe matin et plage 8h30–12h30", () => {
    const groups = groupInscriptionsByFormation(
      [
        {
          id: "a",
          language: "Portugais brésilien",
          start_date: "2026-11-23",
          end_date: "2026-11-27",
          course_location: "ESF Val d'Isère",
          modality: "Présentiel",
          group_name: "Groupe matin",
          schedule: "de 8h30 à 12h30",
          student_name: "Lucas",
        },
        {
          id: "b",
          language: "Portugais brésilien",
          start_date: "2026-11-23",
          end_date: "2026-11-27",
          course_location: "ESF Val d'Isère",
          modality: "Présentiel",
          group_name: null,
          schedule: "de 8h30 à 12h30",
          student_name: "Alix",
        },
        {
          id: "c",
          language: "Portugais brésilien",
          start_date: "2026-11-23",
          end_date: "2026-11-27",
          course_location: "ESF Val d'Isère",
          modality: "Présentiel",
          group_name: null,
          schedule: "de 13h30 à 17h30",
          student_name: "Barbara",
        },
      ],
      "groupe"
    );
    expect(groups).toHaveLength(2);
    expect(groups.map((g) => g.groupLabel).sort()).toEqual([
      "Après-midi",
      "Matin",
    ]);
    expect(
      groups.find((g) => g.groupLabel === "Matin")?.inscriptions.map((i) => i.id)
    ).toEqual(["b", "a"]);
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

  it("en mode groupe, sépare Groupe 1 et Groupe 2 à même formation", () => {
    const base = {
      id: "1",
      language: "Anglais",
      start_date: "2026-12-01",
      end_date: "2026-12-05",
      course_location: "Val d'Isère",
      modality: "Présentiel",
    };
    const g1 = formationGroupKey({ ...base, group_name: "Groupe 1" }, "groupe");
    const g2 = formationGroupKey({ ...base, group_name: "Groupe 2" }, "groupe");
    expect(g1).not.toBe(g2);
    expect(formationGroupKey({ ...base, group_name: "Groupe 1" })).toBe(
      formationGroupKey({ ...base, group_name: "Groupe 2" })
    );
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
      group_name: "Groupe 1",
    },
    {
      id: "a",
      language: "Anglais",
      start_date: "2026-12-08",
      end_date: "2026-12-12",
      course_location: "Val d'Isère",
      modality: "Présentiel",
      student_name: "Alice",
      group_name: "Groupe 1",
    },
    {
      id: "e",
      language: "Anglais",
      start_date: "2026-12-08",
      end_date: "2026-12-12",
      course_location: "Val d'Isère",
      modality: "Présentiel",
      student_name: "Nora",
      group_name: "Groupe 2",
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
    expect(valEng?.inscriptions.map((i) => i.id)).toEqual(["a", "e", "b"]);
    expect(valEng?.groupLabel).toBeNull();
  });

  it("en mode groupe, scinde Groupe 1 et Groupe 2", () => {
    const groups = groupInscriptionsByFormation(rows, "groupe");
    expect(groups).toHaveLength(4);

    const g1 = groups.find((g) => g.groupLabel === "Groupe 1");
    const g2 = groups.find((g) => g.groupLabel === "Groupe 2");
    expect(g1?.inscriptions.map((i) => i.id)).toEqual(["a", "b"]);
    expect(g2?.inscriptions.map((i) => i.id)).toEqual(["e"]);
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
      "Nora",
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

  it("ajoute le libellé de groupe en mode groupe", () => {
    expect(
      formationGroupTitle({
        location: "Val d'Isère",
        language: "Anglais",
        groupLabel: "Groupe 1",
      })
    ).toBe("Val d'Isère · Anglais · Groupe 1");
  });
});
