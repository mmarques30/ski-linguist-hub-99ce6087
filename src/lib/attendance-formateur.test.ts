import { describe, expect, it } from "vitest";
import type { FormateurInscriptionRow } from "@/lib/formateur-portal";
import {
  buildEnsembleGroupKey,
  buildHalfDayGroupKey,
  inscriptionActiveOnDate,
  isFridayIsoDate,
  listHalfDayOpenOptions,
} from "./attendance-formateur";

function row(
  partial: Partial<FormateurInscriptionRow> & { id: string }
): FormateurInscriptionRow {
  return {
    id: partial.id,
    code: partial.code ?? null,
    language: partial.language ?? "english",
    start_date: partial.start_date ?? "2026-01-12",
    end_date: partial.end_date ?? "2026-01-16",
    status: partial.status ?? "confirmee",
    student_id: partial.student_id ?? `stu-${partial.id}`,
    student_name: partial.student_name ?? "Stagiaire",
    student_email: null,
    student_phone: null,
    course_location: partial.course_location ?? "Les Arcs",
    course_address: null,
    modality: partial.modality ?? "presentiel",
    rhythm: null,
    schedule: partial.schedule ?? null,
    group_name: partial.group_name ?? null,
    ski_school_name: null,
  };
}

describe("isFridayIsoDate", () => {
  it("détecte le vendredi", () => {
    // 16 janv. 2026 = vendredi
    expect(isFridayIsoDate("2026-01-16")).toBe(true);
    expect(isFridayIsoDate("2026-01-12")).toBe(false); // lundi
  });
});

describe("inscriptionActiveOnDate", () => {
  it("inclut les bornes", () => {
    const r = row({ id: "1", start_date: "2026-01-12", end_date: "2026-01-16" });
    expect(inscriptionActiveOnDate(r, "2026-01-12")).toBe(true);
    expect(inscriptionActiveOnDate(r, "2026-01-16")).toBe(true);
    expect(inscriptionActiveOnDate(r, "2026-01-11")).toBe(false);
  });
});

describe("listHalfDayOpenOptions", () => {
  const matinA = row({
    id: "a",
    student_name: "Ada",
    schedule: "de 8h30 à 12h30",
  });
  const matinB = row({
    id: "b",
    student_name: "Béatrice",
    schedule: "matin",
  });
  const apresC = row({
    id: "c",
    student_name: "Carla",
    schedule: "de 13h30 à 17h30",
  });
  const apresD = row({
    id: "d",
    student_name: "Diane",
    schedule: "après-midi",
  });

  it("propose matin et après-midi en semaine", () => {
    const opts = listHalfDayOpenOptions(
      [matinA, matinB, apresC, apresD],
      "2026-01-13" // mardi
    );
    expect(opts.map((o) => o.kind)).toEqual(["half-day", "half-day"]);
    const matin = opts.find((o) => o.dayPart === "matin");
    const apres = opts.find((o) => o.dayPart === "apres-midi");
    expect(matin?.members).toHaveLength(2);
    expect(apres?.members).toHaveLength(2);
    expect(opts.some((o) => o.kind === "ensemble")).toBe(false);
  });

  it("le vendredi ajoute tous ensemble (matin + après-midi)", () => {
    const opts = listHalfDayOpenOptions(
      [matinA, matinB, apresC, apresD],
      "2026-01-16" // vendredi
    );
    const ensemble = opts.filter((o) => o.kind === "ensemble");
    expect(ensemble).toHaveLength(2);
    expect(ensemble.every((o) => o.members.length === 4)).toBe(true);
    expect(new Set(ensemble.map((o) => o.groupKey)).size).toBe(1);
    expect(ensemble.map((o) => o.dayPart).sort()).toEqual([
      "apres-midi",
      "matin",
    ]);
  });

  it("clés half / ensemble distinctes", () => {
    const base = {
      language: "english",
      location: "les arcs",
      startDate: "2026-01-12",
      endDate: "2026-01-16",
    };
    expect(buildHalfDayGroupKey(base, "matin")).not.toBe(
      buildEnsembleGroupKey(base)
    );
  });
});
