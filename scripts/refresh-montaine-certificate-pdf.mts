import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";
import { buildCertificatePdfBlob } from "../src/lib/certificate-pdf.ts";
import { ZZTEST_ADMIN_LOGIN } from "../src/lib/zztest-roles-logins.ts";

async function main() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("missing supabase env");
  const supabase = createClient(url, key);
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: ZZTEST_ADMIN_LOGIN.email,
    password: ZZTEST_ADMIN_LOGIN.password,
  });
  if (authError) throw authError;

  const blob = buildCertificatePdfBlob({
    studentName: "Montaine Gros-Deleglise",
    language: "Anglais",
    startDate: "2026-09-16",
    endDate: "2026-10-07",
    durationHoursPlanned: null,
    hoursFollowed: null,
    locationOrModality: "en_ligne",
    formateurName: "Maxime Goy",
    niveauGeneralEntree: "B1+",
    niveauTechniqueEntree: "B1",
    niveauGeneralSortie: "B2",
    niveauTechniqueSortie: "B2",
    objectifAtteint: "oui",
    commentaire:
      "Très assidue, volontaire. Montaine s'est énormément investie dans ce cours.\nLogistique : All good\nÉcarts objectifs : All good",
    issueDate: "2026-10-09",
  });

  const path =
    "60c44225-fda7-4c4f-a54a-c9ea5103e205/bd253789-d03b-4402-8bbd-ef93366e1c58/52fac4e9-92d9-489d-bf0a-181527fb8632.pdf";
  const { error } = await supabase.storage.from("certificates").upload(path, blob, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (error) throw error;

  const buf = Buffer.from(await blob.arrayBuffer());
  writeFileSync("/opt/cursor/artifacts/montaine-certificat.pdf", buf);
  console.log("updated certificate", buf.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
