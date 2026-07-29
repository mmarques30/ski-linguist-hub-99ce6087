import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ParsedFormResponseRow,
  normalizeLanguageForMatch,
  scoreInscriptionMatch,
} from "@/lib/fli-form-responses-csv-import";

interface ImportResult {
  studentsMatched: number;
  studentsUnmatched: number;
  placementTestsCreated: number;
  inscriptionsEnriched: number;
  skippedExistingTests: number;
  errors: string[];
}

interface StudentRecord {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
}

interface InscriptionRecord {
  id: string;
  student_id: string;
  language: string;
  course_location: string | null;
  start_date: string;
  end_date: string;
  modality: string | null;
  entry_test_score: string | null;
  entry_level: string | null;
  expectations: string | null;
  entry_test_id: string | null;
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePhone(value: string | null): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  if (digits.length < 9) return null;
  return digits.slice(-9);
}

function findStudent(
  row: ParsedFormResponseRow,
  byEmail: Map<string, StudentRecord>,
  byName: Map<string, StudentRecord[]>,
  byPhone: Map<string, StudentRecord[]>
): StudentRecord | null {
  if (row.email) {
    const byMail = byEmail.get(normalizeKey(row.email));
    if (byMail) return byMail;
  }

  const nameKey = normalizeName(row.full_name);
  const nameMatches = byName.get(nameKey) || [];
  if (nameMatches.length === 1) return nameMatches[0];

  const phoneKey = normalizePhone(row.phone);
  if (phoneKey) {
    const phoneMatches = byPhone.get(phoneKey) || [];
    if (phoneMatches.length === 1) return phoneMatches[0];
    if (phoneMatches.length > 1 && nameMatches.length > 0) {
      const overlap = phoneMatches.find((s) => nameMatches.some((n) => n.id === s.id));
      if (overlap) return overlap;
    }
  }

  if (nameMatches.length > 0) return nameMatches[0];
  return null;
}

function findBestInscription(
  row: ParsedFormResponseRow,
  inscriptions: InscriptionRecord[]
): InscriptionRecord | null {
  if (inscriptions.length === 0) return null;

  const scored = inscriptions
    .map((inscription) => ({
      inscription,
      score: scoreInscriptionMatch(row, inscription),
    }))
    .filter((item) => item.score >= 35)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.inscription || inscriptions[0];
}

function buildDeterminedLevel(row: ParsedFormResponseRow): string | null {
  return row.previous_evaluation || row.self_assessed_level || null;
}

export function useFliFormResponsesImport() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (rows: ParsedFormResponseRow[]): Promise<ImportResult> => {
      const result: ImportResult = {
        studentsMatched: 0,
        studentsUnmatched: 0,
        placementTestsCreated: 0,
        inscriptionsEnriched: 0,
        skippedExistingTests: 0,
        errors: [],
      };

      const [{ data: students }, { data: inscriptions }, { data: existingTests }] = await Promise.all([
        supabase.from("students").select("id, email, first_name, last_name, phone"),
        supabase
          .from("inscriptions")
          .select("id, student_id, language, course_location, start_date, end_date, modality, entry_test_score, entry_level, expectations, entry_test_id"),
        supabase.from("placement_tests").select("id, student_id, inscription_id, language"),
      ]);

      const byEmail = new Map<string, StudentRecord>();
      const byName = new Map<string, StudentRecord[]>();
      const byPhone = new Map<string, StudentRecord[]>();

      for (const student of students || []) {
        byEmail.set(normalizeKey(student.email), student);
        const nameKey = normalizeName(`${student.first_name} ${student.last_name}`);
        const bucket = byName.get(nameKey) || [];
        bucket.push(student);
        byName.set(nameKey, bucket);
        const phoneKey = normalizePhone(student.phone);
        if (phoneKey) {
          const phoneBucket = byPhone.get(phoneKey) || [];
          phoneBucket.push(student);
          byPhone.set(phoneKey, phoneBucket);
        }
      }

      const inscriptionsByStudent = new Map<string, InscriptionRecord[]>();
      for (const inscription of inscriptions || []) {
        const bucket = inscriptionsByStudent.get(inscription.student_id) || [];
        bucket.push(inscription);
        inscriptionsByStudent.set(inscription.student_id, bucket);
      }

      const existingTestKeys = new Set(
        (existingTests || []).map(
          (test) => `${test.student_id}|${test.inscription_id || "none"}|${normalizeLanguageForMatch(test.language)}`
        )
      );

      for (const row of rows) {
        const student = findStudent(row, byEmail, byName, byPhone);
        if (!student) {
          result.studentsUnmatched += 1;
          continue;
        }
        result.studentsMatched += 1;

        const studentInscriptions = inscriptionsByStudent.get(student.id) || [];
        const languageMatches = studentInscriptions.filter(
          (inscription) =>
            normalizeLanguageForMatch(inscription.language) === normalizeLanguageForMatch(row.language)
        );
        const inscription = findBestInscription(row, languageMatches.length > 0 ? languageMatches : studentInscriptions);

        const testKey = `${student.id}|${inscription?.id || "none"}|${normalizeLanguageForMatch(row.language)}`;
        if (existingTestKeys.has(testKey)) {
          result.skippedExistingTests += 1;
          continue;
        }

        const scorePercentage =
          row.score_correct !== null && row.score_total
            ? Math.round((row.score_correct / row.score_total) * 100)
            : null;

        const { data: placementTest, error: testError } = await supabase
          .from("placement_tests")
          .insert({
            student_id: student.id,
            inscription_id: inscription?.id || null,
            language: row.language,
            status: "completed",
            completed_at: row.submitted_at || new Date().toISOString(),
            correct_answers: row.score_correct,
            total_questions: row.score_total,
            score_percentage: scorePercentage,
            determined_level: buildDeterminedLevel(row),
            answers: {
              source: "google_form_legacy_v1",
              submitted_at: row.submitted_at,
              score_display: row.score_display,
              profession: row.profession,
              funding_type: row.funding_type,
              english_intro: row.english_intro,
              course_location: row.course_location,
              payment_preference: row.payment_preference,
              handicap: row.handicap,
              responses: row.test_answers,
            },
          })
          .select("id")
          .single();

        if (testError) {
          result.errors.push(`${row.full_name}: ${testError.message}`);
          continue;
        }

        result.placementTestsCreated += 1;
        existingTestKeys.add(testKey);

        if (!inscription || !placementTest) continue;

        const updates: Partial<InscriptionRecord> = {};
        const scoreText = row.score_display || (row.score_correct !== null ? String(row.score_correct) : null);
        if (!inscription.entry_test_score && scoreText) updates.entry_test_score = scoreText;
        if (!inscription.entry_level && buildDeterminedLevel(row)) updates.entry_level = buildDeterminedLevel(row);
        if (!inscription.expectations && row.expectations) updates.expectations = row.expectations;
        if (!inscription.entry_test_id) updates.entry_test_id = placementTest.id;

        if (Object.keys(updates).length === 0) continue;

        const { error: updateError } = await supabase
          .from("inscriptions")
          .update(updates)
          .eq("id", inscription.id);

        if (updateError) {
          result.errors.push(`Inscription ${inscription.id}: ${updateError.message}`);
          continue;
        }
        result.inscriptionsEnriched += 1;
      }

      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inscriptions"] });
      qc.invalidateQueries({ queryKey: ["placement_tests"] });
    },
  });
}
