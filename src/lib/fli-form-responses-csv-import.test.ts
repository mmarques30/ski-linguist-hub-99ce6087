import { describe, expect, it } from "vitest";
import { deduplicateFormResponses, parseFliFormResponsesCsv } from "./fli-form-responses-csv-import";

const SAMPLE = `Horodateur,Score,Nom,Adresse mail,Langue souhaitée,Lieu et date de formation,My brother ............. 20 years old
09/09/2021 14:22:58,10 / 90,Alice Test,alice@example.com,Anglais,Courchevel - du 29 novembre au 3 décembre,is
09/09/2021 15:22:58,12 / 90,Alice Test,alice@example.com,Anglais,Courchevel - du 29 novembre au 3 décembre,he
10/09/2021 14:22:58,8 / 90,Bob Test,bob@example.com,Portugais brésilien,Samoëns - du 22 au 26 novembre,tem`;

describe("parseFliFormResponsesCsv", () => {
  it("deduplicates repeated submissions for same person and course", () => {
    const preview = parseFliFormResponsesCsv(SAMPLE);
    expect(preview.totalRows).toBe(3);
    expect(preview.deduplicatedRows).toBe(2);
    expect(preview.rows.find((r) => r.email === "alice@example.com")?.score_correct).toBe(12);
  });

  it("extracts test answers from question columns", () => {
    const preview = parseFliFormResponsesCsv(SAMPLE);
    const alice = preview.rows.find((r) => r.email === "alice@example.com");
    expect(alice?.test_answers["My brother ............. 20 years old"]).toBe("he");
  });
});

describe("deduplicateFormResponses", () => {
  it("keeps the highest quality row", () => {
    const rows = deduplicateFormResponses([
      {
        submitted_at: "2021-09-09T14:22:58",
        score_correct: 5,
        score_total: 90,
        score_display: "5 / 90",
        full_name: "Test User",
        first_name: "Test",
        last_name: "User",
        civility: null,
        email: "test@example.com",
        phone: null,
        street_address: null,
        postal_code: null,
        city: null,
        profession: null,
        funding_type: null,
        self_assessed_level: null,
        previous_evaluation: null,
        english_intro: null,
        certification_type: null,
        ski_school_name: null,
        modality: null,
        language: "Anglais",
        course_location: "Courchevel",
        expectations: null,
        payment_preference: null,
        handicap: null,
        test_answers: { q1: "a" },
        match_keys: {
          email: "test@example.com",
          name: "test user",
          phone: null,
          location_key: "courchevel",
          language_key: "anglais",
        },
      },
      {
        submitted_at: "2021-09-10T14:22:58",
        score_correct: 20,
        score_total: 90,
        score_display: "20 / 90",
        full_name: "Test User",
        first_name: "Test",
        last_name: "User",
        civility: null,
        email: "test@example.com",
        phone: null,
        street_address: null,
        postal_code: null,
        city: null,
        profession: null,
        funding_type: null,
        self_assessed_level: null,
        previous_evaluation: null,
        english_intro: null,
        certification_type: null,
        ski_school_name: null,
        modality: null,
        language: "Anglais",
        course_location: "Courchevel",
        expectations: null,
        payment_preference: null,
        handicap: null,
        test_answers: { q1: "a", q2: "b" },
        match_keys: {
          email: "test@example.com",
          name: "test user",
          phone: null,
          location_key: "courchevel",
          language_key: "anglais",
        },
      },
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0].score_correct).toBe(20);
  });
});
