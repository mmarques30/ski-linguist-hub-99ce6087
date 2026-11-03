import { describe, expect, it } from "vitest";
import type { RegistrationOffering } from "@/lib/registration-offerings";
import {
  buildAlumniRelanceDraft,
  buildDirectorRelanceDraft,
  computeStageFillRows,
  countsTowardStageFill,
  inscriptionMatchesOffering,
  minEnrollmentForOffering,
  normalizePlaceLabel,
  pickDirectorEmail,
  recipientsToCsv,
  selectAlumniForStage,
  selectDirectorsForStage,
} from "@/lib/commercial-stage-fill";

function offering(
  partial: Partial<RegistrationOffering> &
    Pick<RegistrationOffering, "session_code" | "location_label" | "language_label">
): RegistrationOffering {
  return {
    id: partial.id ?? "off-1",
    season_id: null,
    session_code: partial.session_code,
    location_key: partial.location_key ?? "val-disere",
    location_label: partial.location_label,
    language_key: partial.language_key ?? "english",
    language_label: partial.language_label,
    modality_key: partial.modality_key ?? "in_person",
    modality_label: partial.modality_label ?? "Présentiel",
    duration_hours: 24,
    start_date: partial.start_date ?? "2026-11-30",
    end_date: partial.end_date ?? "2026-12-04",
    date_label: partial.date_label ?? "30 nov.–4 déc. 2026",
    format_label: partial.format_label ?? "Présentiel 24 h",
    base_price: 900,
    partner_price: 900,
    partner_school_codes: partial.partner_school_codes ?? ["esf-671"],
    enrollment_status: "open",
    sort_order: 1,
  };
}

describe("commercial-stage-fill", () => {
  it("fixe les minimums présentiel / visio", () => {
    expect(minEnrollmentForOffering({ session_code: "S02", modality_key: "in_person" })).toBe(6);
    expect(minEnrollmentForOffering({ session_code: "S23", modality_key: "online_group" })).toBe(4);
    expect(minEnrollmentForOffering({ session_code: null, modality_key: "online_individual" })).toBeNull();
  });

  it("rapproche lieu ESF et libellé catalogue", () => {
    expect(normalizePlaceLabel("ESF Val d'Isère")).toBe("val d isere");
    expect(
      inscriptionMatchesOffering(
        offering({
          session_code: "S05",
          location_label: "ESF Val d'Isère",
          language_label: "Anglais",
          start_date: "2026-11-30",
          end_date: "2026-12-04",
        }),
        {
          id: "i1",
          language: "Anglais",
          start_date: "2026-11-30",
          end_date: "2026-12-04",
          course_location: "Val d'Isère",
          status: "en_attente",
        }
      )
    ).toBe(true);
  });

  it("signale les stages sous le minimum", () => {
    const rows = computeStageFillRows(
      [
        offering({
          session_code: "S07",
          location_label: "ESF Oz en Oisans",
          language_label: "Anglais",
          partner_school_codes: ["esf-xxx"],
        }),
      ],
      [
        {
          id: "a",
          language: "Anglais",
          start_date: "2026-11-30",
          end_date: "2026-12-04",
          course_location: "ESF Oz en Oisans",
          status: "confirmee",
        },
        {
          id: "b",
          language: "Anglais",
          start_date: "2026-11-30",
          end_date: "2026-12-04",
          course_location: "ESF Oz en Oisans",
          status: "annulee",
        },
      ]
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].enrolledCount).toBe(1);
    expect(rows[0].minRequired).toBe(6);
    expect(rows[0].missing).toBe(5);
    expect(rows[0].underMin).toBe(true);
    expect(countsTowardStageFill("annulee")).toBe(false);
  });

  it("sélectionne les directeurs partenaires ou de la station", () => {
    const dirs = selectDirectorsForStage(
      offering({
        session_code: "S12",
        location_label: "ESF Châtel",
        language_label: "Anglais",
        partner_school_codes: ["esf-260", "esf-347"],
      }),
      [
        {
          code: "esf-260",
          nom_affiche: "ESF Châtel",
          station: "Châtel",
          directeur: "Jean Dupont",
          courriel_direction: "directeur@esf-chatel.com",
        },
        {
          code: "esf-347",
          nom_affiche: "ESF Les Gets",
          station: "Les Gets",
          directeur: "Arthur",
          courriel_ecole: "info@esf-lesgets.com",
        },
        {
          code: "esf-999",
          nom_affiche: "ESF Ailleurs",
          station: "Ailleurs",
          directeur: "X",
          courriel_direction: "x@example.com",
        },
      ]
    );
    expect(dirs.map((d) => d.code).sort()).toEqual(["esf-260", "esf-347"]);
    expect(pickDirectorEmail({ courriel_direction: null, courriel_ecole: "a@b.fr" })?.emailSource).toBe(
      "ecole"
    );
  });

  it("sélectionne les anciens hors déjà inscrits sur le stage", () => {
    const alumni = selectAlumniForStage(
      offering({
        session_code: "S02",
        location_label: "Saint-Jean-de-Maurienne",
        language_label: "Anglais",
        start_date: "2026-11-23",
        end_date: "2026-11-27",
        partner_school_codes: [],
      }),
      [
        { id: "s1", first_name: "Alice", last_name: "Martin", email: "alice@example.com" },
        { id: "s2", first_name: "Bob", last_name: "Durand", email: "bob@example.com" },
        { id: "s3", first_name: "Carole", last_name: "X", email: "import@fli.placeholder.local" },
      ],
      [
        {
          student_id: "s1",
          language: "Anglais",
          status: "facturee",
          start_date: "2025-11-01",
          end_date: "2025-11-05",
        },
        {
          student_id: "s2",
          language: "Anglais",
          status: "facturee",
          start_date: "2025-11-01",
          end_date: "2025-11-05",
        },
        {
          student_id: "s2",
          language: "Anglais",
          status: "en_attente",
          start_date: "2026-11-23",
          end_date: "2026-11-27",
          course_location: "Saint-Jean-de-Maurienne",
        },
      ]
    );
    expect(alumni.map((a) => a.studentId)).toEqual(["s1"]);
  });

  it("utilise toujours le nous et signe L'équipe FLI (directeur + ancien)", () => {
    const off = offering({
      session_code: "S11",
      location_label: "Brides-les-Bains",
      language_label: "Russe",
      language_key: "russian",
      partner_school_codes: [],
    });
    const dir = buildDirectorRelanceDraft({
      offering: off,
      directeurName: "Marie Curie",
      enrolledCount: 2,
      minRequired: 6,
    });
    expect(dir.subject).toContain("Russe");
    expect(dir.bodyText).toContain("Bonjour Marie,");
    expect(dir.bodyText).toContain("il nous manque encore des stagiaires");
    expect(dir.bodyText).toContain("www.fli.fr/register");
    expect(dir.bodyText).toContain("de nous répondre");
    expect(dir.bodyText).toContain("nous nous occupons du reste");
    expect(dir.bodyText.trim().endsWith("L'équipe FLI")).toBe(true);
    expect(dir.bodyText).not.toMatch(/\bje\b/i);
    expect(dir.bodyText).not.toContain("Paula");
    expect(dir.bodyText).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);

    const alum = buildAlumniRelanceDraft({ offering: off, firstName: "Léa" });
    expect(alum.subject.toLowerCase()).toContain("saison");
    expect(alum.bodyText).toContain("Bonjour Léa,");
    expect(alum.bodyText).toContain("lang=russian");
    expect(alum.bodyText).toContain("mieux préparer votre saison de ski");
    expect(alum.bodyText).toContain("Nous pensions à vous");
    expect(alum.bodyText).toContain("bouche-à-oreille");
    expect(alum.bodyText).toContain("en parler autour de vous");
    expect(alum.bodyText).toContain("nous vous répondons avec plaisir");
    expect(alum.bodyText.trim().endsWith("L'équipe FLI")).toBe(true);
    expect(alum.bodyText.toLowerCase()).not.toMatch(/effectif|minimum|manque encore/);
    expect(alum.bodyText).not.toMatch(/\bje\b/i);
    expect(alum.bodyText).not.toContain("Paula");
  });

  it("exporte un CSV destinataires", () => {
    const csv = recipientsToCsv([
      { email: "a@b.fr", name: "A B", detail: "ESF" },
    ]);
    expect(csv.split("\n")[0]).toBe("email;nom;detail");
    expect(csv).toContain('"a@b.fr"');
  });
});
