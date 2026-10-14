/**
 * Génère le SQL d'import du lot Mollard oct. 2026 (stdout).
 * npx tsx scripts/import-mollard-oct-2026.mts > /tmp/import.sql
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

type Row = {
  key: string;
  name: string;
  email: string | null;
  phone: string | null;
  school: string | null;
  school_id: string | null;
  partner_id: string;
  sponsor_type: string;
  carte: string | null;
  profession: string | null;
  profession_autre?: string | null;
  test_at: string;
  previous_test: boolean;
  previous_result?: string | null;
  payment: string;
  scores: number[];
  cecrl: string;
  intro: string;
  comp: string;
  grammar: string;
  tech: string;
  points: string | null;
  concl: string;
  note_sur_20?: number[];
};

const rows: Row[] = JSON.parse(
  readFileSync(join(process.cwd(), "scripts/data/mollard-oct-2026-evals.json"), "utf8")
);

const INSTRUCTOR = "c4f6ec86-ffcb-41f8-a0e9-dc5eca53e40e";

function sqlStr(v: string | null | undefined): string {
  if (v == null || v === "") return "NULL";
  return `'${v.replace(/'/g, "''")}'`;
}

function buildBlocs(r: Row) {
  const intro = r.intro;
  const comp = [r.comp, r.grammar].filter(Boolean).join(" ");
  const tech = [r.tech, r.points].filter(Boolean).join(" ");
  const concl = r.concl;
  const methodo = r.note_sur_20
    ? `Barème Alpe d'Huez /20 d'origine : ${r.note_sur_20.join(", ")}.`
    : r.points && r.points.length > 180
      ? null
      : null;
  return { intro, comp, tech, concl, methodo: r.note_sur_20 ? `Barème Alpe d'Huez /20 d'origine : ${r.note_sur_20.join(", ")}.` : null };
}

const candByEmail = new Map<string, string>();
const ids = rows.map((r) => {
  const email = (r.email || "").toLowerCase();
  let cand = candByEmail.get(email);
  if (!cand) {
    cand = randomUUID();
    candByEmail.set(email, cand);
  }
  return { cand, book: randomUUID(), eval: randomUUID(), isNewCand: !email || candByEmail.get(email) === cand };
});
// Fix isNewCand: first occurrence only
const seen = new Set<string>();
for (let i = 0; i < rows.length; i++) {
  const email = (rows[i].email || "").toLowerCase();
  const first = !seen.has(email);
  if (first) seen.add(email);
  (ids[i] as any).isNewCand = first;
}

console.log("BEGIN;");
console.log("-- Lot évaluations Mollard octobre 2026 (Paula 14/10/2026)");

rows.forEach((r, i) => {
  const id = ids[i];
  const [comp, expr, struct, tech, conv, gen] = r.scores;
  const blocs = buildBlocs(r);
  const paymentType =
    r.payment === "school" || r.payment === "school_st_gervais_batch"
      ? "invoice"
      : r.payment === "card"
        ? "stripe"
        : r.payment.startsWith("bank")
          ? "bank_transfer"
          : "pending";

  const candSql = (id as any).isNewCand ? `
INSERT INTO public.test_candidates (id, name, email, phone, profession, profession_autre, ski_school_id, carte_syndicale, ski_discipline, training_cycle)
VALUES (
  '${id.cand}',
  ${sqlStr(r.name)},
  ${sqlStr(r.email)},
  ${sqlStr(r.phone)},
  ${sqlStr(r.profession)},
  ${sqlStr(r.profession_autre ?? null)},
  ${r.school_id ? `'${r.school_id}'` : "NULL"},
  ${sqlStr(r.carte)},
  'alpin',
  '1'
);
` : `-- candidate réutilisé ${id.cand}`;

  console.log(`
-- ${r.key} / ${r.name}
${candSql}

INSERT INTO public.test_bookings (
  id, candidate_id, instructor_id, language, datetime, status,
  payment_type, previous_test, previous_result, source, sponsor_type, sponsor_id
) VALUES (
  '${id.book}',
  '${id.cand}',
  '${INSTRUCTOR}',
  'anglais',
  '${r.test_at}',
  'completed',
  ${sqlStr(paymentType)},
  ${r.previous_test},
  ${sqlStr(r.previous_result ?? null)},
  'import_mollard_oct_2026',
  ${sqlStr(r.sponsor_type)},
  '${r.partner_id}'
);

INSERT INTO public.test_evaluations (
  id, booking_id, scoring_system,
  score_comprehension, score_expression, score_structure,
  score_technique, score_conversation, score_general,
  cecrl_label,
  bloc_introduction, bloc_comprehension, bloc_technique, bloc_conclusion,
  note_methodologique,
  status, verified_at
) VALUES (
  '${id.eval}',
  '${id.book}',
  'sur_5',
  ${comp}, ${expr}, ${struct}, ${tech}, ${conv}, ${gen},
  ${sqlStr(r.cecrl)},
  ${sqlStr(blocs.intro)},
  ${sqlStr(blocs.comp)},
  ${sqlStr(blocs.tech)},
  ${sqlStr(blocs.concl)},
  ${sqlStr(blocs.methodo)},
  'valide',
  now()
);
`);
});

console.log(`
INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'import_mollard_oct_2026',
  'test_evaluations',
  jsonb_build_object(
    'count', ${rows.length},
    'instructor', 'Carole Mollard',
    'keys', ${sqlStr(JSON.stringify(rows.map((r) => r.key)))}::jsonb
  )
);
`);

console.log("COMMIT;");

// Manifest for later PDF/email steps
console.log(`
-- MANIFEST_JSON
-- ${JSON.stringify(
  rows.map((r, i) => ({
    key: r.key,
    name: r.name,
    email: r.email,
    school: r.school,
    partner_id: r.partner_id,
    sponsor_type: r.sponsor_type,
    payment: r.payment,
    cecrl: r.cecrl,
    scores: r.scores,
    candidate_id: ids[i].cand,
    booking_id: ids[i].book,
    evaluation_id: ids[i].eval,
  }))
)}`);
