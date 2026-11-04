import { describe, expect, it } from "vitest";
import type { RegistrationOffering } from "@/lib/registration-offerings";
import {
  alumniPlaceMatches,
  buildAlumniRelanceDraft,
  buildCommercialCampaignDigest,
  buildCommercialTestEnvelope,
  buildDirectorRelanceDraft,
  COMMERCIAL_TEST_TO,
  isSainteFoyOffering,
  computeStageFillRows,
  countsTowardStageFill,
  groupRowsForDirectorOutreach,
  inscriptionMatchesOffering,
  isAlumniOutreachExcluded,
  isCommercialOutreachPersonExcluded,
  isDirectorOutreachExcluded,
  isSamoensEnglishOffering,
  minEnrollmentForOffering,
  normalizePlaceLabel,
  pickDirectorEmail,
  recipientsToCsv,
  selectAlumniForStage,
  selectDirectorsForOfferings,
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
          language: "Néerlandais",
          status: "facturee",
          start_date: "2025-11-01",
          end_date: "2025-11-05",
          course_location: "Saint-Jean-de-Maurienne",
        },
        {
          student_id: "s2",
          language: "Anglais",
          status: "facturee",
          start_date: "2025-11-01",
          end_date: "2025-11-05",
          course_location: "Saint-Jean-de-Maurienne",
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

  it("Sainte-Foy reprend les anciens d'Aime", () => {
    const sainteFoy = offering({
      session_code: "S01",
      location_label: "Sainte-Foy-Tarentaise",
      location_key: "sainte-foy-tarentaise",
      language_label: "Portugais brésilien",
      language_key: "portuguese",
      start_date: "2026-11-23",
      end_date: "2026-11-27",
      partner_school_codes: [],
    });
    expect(isSainteFoyOffering(sainteFoy)).toBe(true);
    expect(alumniPlaceMatches(sainteFoy, "Aime La Plagne")).toBe(true);
    expect(alumniPlaceMatches(sainteFoy, "ESF Aime La Plagne")).toBe(true);
    expect(alumniPlaceMatches(sainteFoy, "Aime")).toBe(true);
    expect(alumniPlaceMatches(sainteFoy, "Val d'Isère")).toBe(false);

    const alumni = selectAlumniForStage(
      sainteFoy,
      [
        { id: "aime", first_name: "Ana", last_name: "Aime", email: "aime@ex.fr" },
        { id: "val", first_name: "Val", last_name: "Isere", email: "val@ex.fr" },
      ],
      [
        {
          student_id: "aime",
          language: "Portugais brésilien",
          status: "facturee",
          start_date: "2025-01-01",
          end_date: "2025-01-05",
          course_location: "Aime La Plagne",
        },
        {
          student_id: "val",
          language: "Portugais brésilien",
          status: "facturee",
          start_date: "2025-01-01",
          end_date: "2025-01-05",
          course_location: "Val d'Isère",
        },
      ]
    );
    expect(alumni.map((a) => a.studentId)).toEqual(["aime"]);
  });

  it("cible les anciens par lieu, pas par langue", () => {
    const alumni = selectAlumniForStage(
      offering({
        session_code: "S07",
        location_label: "ESF Oz en Oisans",
        location_key: "oz-en-oisans",
        language_label: "Anglais",
        start_date: "2026-12-01",
        end_date: "2026-12-05",
        partner_school_codes: [],
      }),
      [
        { id: "oz-nl", first_name: "Oz", last_name: "Nl", email: "oz-nl@ex.fr" },
        { id: "val-en", first_name: "Val", last_name: "En", email: "val-en@ex.fr" },
      ],
      [
        {
          student_id: "oz-nl",
          language: "Néerlandais",
          status: "facturee",
          start_date: "2025-01-01",
          end_date: "2025-01-05",
          course_location: "Oz en Oisans",
        },
        {
          student_id: "val-en",
          language: "Anglais",
          status: "facturee",
          start_date: "2025-01-01",
          end_date: "2025-01-05",
          course_location: "Val d'Isère",
        },
      ]
    );
    expect(alumni.map((a) => a.studentId)).toEqual(["oz-nl"]);
  });

  it("exclut Méribel / Samoëns PT ; Samoëns EN = anciens du lieu", () => {
    const meribel = offering({
      session_code: "S06",
      location_label: "ESF Méribel",
      language_label: "Anglais",
      location_key: "meribel",
    });
    const samoensPt = offering({
      session_code: "S21",
      location_label: "ESF Samoëns",
      language_label: "Portugais brésilien",
      language_key: "portuguese",
      location_key: "samoens",
    });
    const samoensEn = offering({
      session_code: "S13",
      location_label: "ESF Samoëns",
      language_label: "Anglais",
      language_key: "english",
      location_key: "samoens",
      start_date: "2026-12-07",
      end_date: "2026-12-11",
    });
    expect(isDirectorOutreachExcluded(meribel)).toBe(true);
    expect(isAlumniOutreachExcluded(meribel)).toBe(true);
    expect(isDirectorOutreachExcluded(samoensPt)).toBe(true);
    expect(isAlumniOutreachExcluded(samoensPt)).toBe(true);
    expect(isDirectorOutreachExcluded(samoensEn)).toBe(false);
    expect(isAlumniOutreachExcluded(samoensEn)).toBe(false);
    expect(isSamoensEnglishOffering(samoensEn)).toBe(true);

    expect(
      selectAlumniForStage(
        meribel,
        [{ id: "s1", first_name: "A", last_name: "B", email: "a@b.fr" }],
        [
          {
            student_id: "s1",
            language: "Anglais",
            status: "facturee",
            start_date: "2025-01-01",
            end_date: "2025-01-05",
          },
        ]
      )
    ).toEqual([]);

    const broad = selectAlumniForStage(
      samoensEn,
      [
        { id: "s1", first_name: "Alice", last_name: "En", email: "en@b.fr" },
        { id: "s2", first_name: "Bruno", last_name: "Pt", email: "pt@b.fr" },
        { id: "s3", first_name: "Claire", last_name: "Oz", email: "oz@b.fr" },
      ],
      [
        {
          student_id: "s1",
          language: "Anglais",
          status: "facturee",
          start_date: "2025-01-01",
          end_date: "2025-01-05",
          course_location: "ESF Samoëns",
        },
        {
          student_id: "s2",
          language: "Portugais brésilien",
          status: "facturee",
          start_date: "2025-01-01",
          end_date: "2025-01-05",
          course_location: "Samoëns",
        },
        {
          student_id: "s3",
          language: "Anglais",
          status: "facturee",
          start_date: "2025-01-01",
          end_date: "2025-01-05",
          course_location: "Oz en Oisans",
        },
      ]
    );
    expect(broad.map((a) => a.studentId).sort()).toEqual(["s1", "s2"]);
  });

  it("regroupe Oz anglais + néerlandais et ignore Méribel", () => {
    const ozEn = offering({
      id: "oz-en",
      session_code: "S07",
      location_key: "oz-en-oisans",
      location_label: "ESF Oz en Oisans",
      language_label: "Anglais",
      language_key: "english",
      partner_school_codes: ["esf-oz"],
    });
    const ozNl = offering({
      id: "oz-nl",
      session_code: "S08",
      location_key: "oz-en-oisans",
      location_label: "ESF Oz en Oisans",
      language_label: "Néerlandais",
      language_key: "dutch",
      partner_school_codes: ["esf-oz"],
    });
    const meribel = offering({
      id: "mer",
      session_code: "S06",
      location_key: "meribel",
      location_label: "ESF Méribel",
      language_label: "Anglais",
    });
    const groups = groupRowsForDirectorOutreach([
      {
        offering: ozEn,
        enrolledCount: 1,
        minRequired: 6,
        missing: 5,
        underMin: true,
        inscriptionIds: [],
      },
      {
        offering: ozNl,
        enrolledCount: 2,
        minRequired: 6,
        missing: 4,
        underMin: true,
        inscriptionIds: [],
      },
      {
        offering: meribel,
        enrolledCount: 0,
        minRequired: 6,
        missing: 6,
        underMin: true,
        inscriptionIds: [],
      },
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].stationKey).toBe("oz-en-oisans");
    expect(groups[0].rows.map((r) => r.offering.language_label)).toEqual([
      "Anglais",
      "Néerlandais",
    ]);

    const draft = buildDirectorRelanceDraft({
      offerings: [ozEn, ozNl],
      directeurName: "Jean",
    });
    expect(draft.subject).toContain("Oz en Oisans");
    expect(draft.subject).toContain("Anglais");
    expect(draft.subject).toContain("Néerlandais");
    expect(draft.bodyText).toContain("stages suivants à ESF Oz en Oisans");
    expect(draft.bodyText).toContain("— Anglais");
    expect(draft.bodyText).toContain("— Néerlandais");

    const dirs = selectDirectorsForOfferings(
      [ozEn, ozNl],
      [
        {
          code: "esf-oz",
          nom_affiche: "ESF Oz en Oisans",
          station: "Oz en Oisans",
          directeur: "Jean",
          courriel_direction: "dir@oz.fr",
        },
        {
          code: "esf-meribel",
          nom_affiche: "ESF Méribel",
          station: "Méribel",
          directeur: "X",
          courriel_direction: "dir@meribel.fr",
        },
      ]
    );
    expect(dirs.map((d) => d.code)).toEqual(["esf-oz"]);
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
      offerings: [off],
      directeurName: "Marie Curie",
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
    expect(alum.bodyText).toContain("nous serions ravis de vous retrouver");
    expect(alum.bodyText).toContain("pourrait vous convenir");
    expect(alum.bodyText).toContain("bouche-à-oreille");
    expect(alum.bodyText).toContain("en parler autour de vous");
    expect(alum.bodyText).toContain("nous vous répondons avec plaisir");
    expect(alum.bodyText.trim().endsWith("L'équipe FLI")).toBe(true);
    expect(alum.bodyText.toLowerCase()).not.toMatch(
      /effectif|minimum|manque encore|encore des places|compléter|sous.?rempli/
    );
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

  it("exclut Valérie Tuillière des relances", () => {
    expect(isCommercialOutreachPersonExcluded("Valerie Tuilliere")).toBe(true);
    expect(isCommercialOutreachPersonExcluded("Valérie Tuillière")).toBe(true);
    expect(isCommercialOutreachPersonExcluded("Valerie Tulliere")).toBe(true);
    expect(
      selectDirectorsForStage(
        offering({
          session_code: "S07",
          location_label: "ESF Oz en Oisans",
          language_label: "Anglais",
          partner_school_codes: ["esf-oz"],
        }),
        [
          {
            code: "esf-oz",
            nom_affiche: "ESF Oz en Oisans",
            station: "Oz en Oisans",
            directeur: "Valerie Tuilliere",
            courriel_direction: "valerie@oz.fr",
          },
        ]
      )
    ).toEqual([]);
  });

  it("prépare un seul mail test à info@fli.fr sans envoi masse", () => {
    const envelope = buildCommercialTestEnvelope({
      audience: "directeur",
      draftSubject: "Sujet client",
      draftBody: "Corps client\nL'équipe FLI",
      recipients: [
        { email: "dir@oz.fr", name: "Jean", detail: "ESF Oz" },
        { email: "dir2@oz.fr", name: "Marie", detail: "ESF Oz" },
      ],
      contextLabel: "ESF Oz en Oisans",
    });
    expect(envelope.subject).toContain("[FLI][TEST]");
    expect(envelope.subject).toContain("2 destinataires");
    expect(envelope.bodyText).toContain(COMMERCIAL_TEST_TO);
    expect(envelope.bodyText).toContain("dir@oz.fr");
    expect(envelope.bodyText).toContain("Sujet client");
    expect(envelope.bodyText).toContain("Corps client");
  });

  it("prépare un digest unique après campagne (sans BCC unitaire)", () => {
    const digest = buildCommercialCampaignDigest({
      audience: "directeur",
      draftSubject: "Sujet client",
      sent: [
        { email: "dir@oz.fr", name: "Jean", ok: true },
        { email: "dir2@oz.fr", name: "Marie", ok: false },
      ],
      contextLabel: "ESF Oz en Oisans",
    });
    expect(digest.subject).toContain("[FLI] Relance directeurs");
    expect(digest.subject).toContain("1 envoyé");
    expect(digest.subject).toContain("1 échec");
    expect(digest.bodyText).toContain("dir@oz.fr");
    expect(digest.bodyText).toContain("dir2@oz.fr");
    expect(digest.bodyText).toContain("Sujet client");
  });
});
