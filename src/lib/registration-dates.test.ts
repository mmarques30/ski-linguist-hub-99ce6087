import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  addDaysIso,
  DATES_A_PLANIFIER_LABEL,
  formatDateFr,
  inscriptionDateRangeLabel,
  inscriptionDatesSentenceFr,
  inscriptionStartDateLabel,
  isIsoDate,
  offeringHasFixedDates,
  REQUESTED_START_DATE_MESSAGES,
  requestedStartDateNotice,
  requestedStartDateProblem,
  resolveInscriptionDates,
  todayIso,
} from "./registration-dates";

/**
 * BL-029 — une offre « dates flexibles » n'hérite plus des dates de la saison.
 * Le stagiaire indique un début souhaité ; l'interface affiche « À planifier ».
 */

function source(relatif: string): string {
  return readFileSync(join(process.cwd(), relatif), "utf8");
}

const SAISON_COURANTE = { start_date: "2026-12-01", end_date: "2027-03-31" };

describe("dates d'inscription /register", () => {
  it("reconnaît une session datée du catalogue", () => {
    expect(
      offeringHasFixedDates({ start_date: "2026-12-07", end_date: "2026-12-11" })
    ).toBe(true);
    expect(
      offeringHasFixedDates({ start_date: null, end_date: null })
    ).toBe(false);
    expect(offeringHasFixedDates(undefined)).toBe(false);
  });

  it("garde les dates fermes d'une session du catalogue", () => {
    expect(
      resolveInscriptionDates({
        startDate: "2026-12-07",
        endDate: "2026-12-11",
        requestedStartDate: "2026-10-01",
      })
    ).toEqual({
      start_date: "2026-12-07",
      end_date: "2026-12-11",
      dates_to_confirm: false,
    });
  });

  it("retient la date souhaitée sans jamais tomber sur la saison", () => {
    const resolved = resolveInscriptionDates({
      startDate: undefined,
      endDate: undefined,
      requestedStartDate: "2026-10-20",
    });
    expect(resolved).toEqual({
      start_date: "2026-10-20",
      end_date: "2026-10-20",
      dates_to_confirm: true,
    });
    expect(resolved?.start_date).not.toBe(SAISON_COURANTE.start_date);
    expect(resolved?.end_date).not.toBe(SAISON_COURANTE.end_date);
  });

  it("refuse plutôt que d'inventer une date", () => {
    expect(
      resolveInscriptionDates({
        startDate: undefined,
        endDate: undefined,
        requestedStartDate: undefined,
      })
    ).toBeNull();
    expect(
      resolveInscriptionDates({
        startDate: "pas-une-date",
        requestedStartDate: "31/12/2026",
      })
    ).toBeNull();
  });

  it("contrôle la date souhaitée : obligatoire, ISO, pas dans le passé", () => {
    expect(requestedStartDateProblem(undefined, "2026-09-15")).toBe("manquante");
    expect(requestedStartDateProblem("15/09/2026", "2026-09-15")).toBe("invalide");
    expect(requestedStartDateProblem("2026-09-14", "2026-09-15")).toBe("passee");
    expect(requestedStartDateProblem("2026-09-15", "2026-09-15")).toBeNull();
    expect(REQUESTED_START_DATE_MESSAGES.manquante).toMatch(/souhaitez commencer/);
  });

  it("prévient sans bloquer quand le début est dans moins de dix jours", () => {
    expect(requestedStartDateNotice("2026-09-20", "2026-09-15")).toMatch(/moins de 10 jours/);
    expect(requestedStartDateNotice("2026-09-25", "2026-09-15")).toBeNull();
    expect(addDaysIso("2026-09-15", 10)).toBe("2026-09-25");
    expect(isIsoDate("2026-09-15")).toBe(true);
    expect(isIsoDate("2026-09-31")).toBe(false);
  });

  it("affiche « À planifier » sur la liste, la fiche et le J-10", () => {
    const aPlanifier = {
      start_date: "2026-10-20",
      end_date: "2026-10-20",
      dates_to_confirm: true,
    };
    expect(inscriptionStartDateLabel(aPlanifier)).toBe(DATES_A_PLANIFIER_LABEL);
    expect(inscriptionDateRangeLabel(aPlanifier)).toBe(
      "À planifier — début souhaité le 20/10/2026"
    );
    expect(inscriptionDatesSentenceFr(aPlanifier)).toBe(
      "dates à planifier avec l'équipe FLI (début souhaité : 20/10/2026)"
    );

    const ferme = {
      start_date: "2026-12-07",
      end_date: "2026-12-11",
      dates_to_confirm: false,
    };
    expect(inscriptionStartDateLabel(ferme)).toBe("07/12/2026");
    expect(inscriptionDateRangeLabel(ferme)).toBe("du 07/12/2026 au 11/12/2026");
    expect(formatDateFr("2026-12-07")).toBe("07/12/2026");
  });

  it("n'hérite plus de la saison dans submit-registration", () => {
    const edge = source("supabase/functions/submit-registration/index.ts");
    expect(edge).toContain("resolveInscriptionDates");
    expect(edge).toContain("dates_to_confirm");
    expect(edge).not.toMatch(/season\?\.start_date/);
    expect(edge).not.toMatch(/season\?\.end_date/);
    expect(edge).not.toMatch(
      /const startDate\s*=\s*\n?\s*registration\.startDate \|\| season/
    );
  });

  it("demande la date souhaitée à l'étape 1 quand l'offre n'est pas datée", () => {
    const etape = source("src/components/registration/CourseSelectionStep.tsx");
    expect(etape).toContain("needsRequestedStartDate");
    expect(etape).toContain('id="requested-start-date"');
    expect(etape).toContain("offeringHasFixedDates");
  });

  it("montre « À planifier » sur la liste, la fiche et le J-10", () => {
    expect(source("src/pages/Inscriptions.tsx")).toContain("DATES_A_PLANIFIER_LABEL");
    expect(source("src/pages/inscriptions/InscriptionDetails.tsx")).toContain(
      "dates_to_confirm"
    );
    expect(source("src/pages/inscriptions/ScheduleValidation.tsx")).toContain(
      "dates_to_confirm"
    );
    expect(source("src/hooks/usePendingSchedules.ts")).toContain("dates_to_confirm");
  });

  it("garde la copie Deno d'accord avec le module front", () => {
    const front = source("src/lib/registration-dates.ts");
    const deno = source("supabase/functions/_shared/registration-dates.ts");
    const extraire = (texte: string, nom: string) => {
      const debut = texte.indexOf(`export function ${nom}`);
      expect(debut).toBeGreaterThan(-1);
      const fin = texte.indexOf("\nexport ", debut + 1);
      return texte.slice(debut, fin === -1 ? undefined : fin);
    };
    expect(extraire(deno, "resolveInscriptionDates")).toBe(
      extraire(front, "resolveInscriptionDates")
    );
    expect(extraire(deno, "inscriptionDatesSentenceFr")).toBe(
      extraire(front, "inscriptionDatesSentenceFr")
    );
  });

  it("produit la date du jour au format ISO court", () => {
    expect(todayIso(new Date("2026-09-15T22:30:00+02:00"))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
