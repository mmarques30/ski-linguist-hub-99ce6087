/**
 * Complète le pack fin Montaine Gros-Deleglise :
 * - price 900 €, 18 h, FIFPL
 * - facture 900 €
 * - attestation de présence
 * - refresh certificat avec heures
 *
 *   ./node_modules/.bin/tsx scripts/complete-montaine-fifpl-pack.mts
 */
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";
import { ZZTEST_ADMIN_LOGIN } from "../src/lib/zztest-roles-logins.ts";
import { MONTAINE_INSCRIPTION_ID } from "../src/lib/formateur-formation-forms.ts";
import { buildCertificatePdfBlob } from "../src/lib/certificate-pdf.ts";
import {
  buildAttestationPresencePath,
  buildAttestationPresencePdfBlob,
} from "../src/lib/attestation-presence-pdf.ts";
import {
  CERTIFICATE_BUCKET,
  DOCUMENTS_BUCKET,
} from "../src/lib/certificateStorage.ts";
import { describeCaughtError } from "../src/lib/supabase-error.ts";

const HOURS = 18;
const PRICE = 900;

async function main() {
  const url = process.env.VITE_SUPABASE_URL!;
  const anon = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
  const supabase = createClient(url, anon);
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: ZZTEST_ADMIN_LOGIN.email,
    password: ZZTEST_ADMIN_LOGIN.password,
  });
  if (authError) throw authError;

  const { data: row, error: readError } = await supabase
    .from("inscriptions_complete")
    .select(
      "id, student_id, student_name, language, start_date, end_date, duration_hours, hours_followed, course_location, modality, formateur, instructor_name, code, price, niveau_general_entree, niveau_technique_entree, niveau_general_sortie, niveau_technique_sortie, objectif_atteint, commentaire_sortie, status"
    )
    .eq("id", MONTAINE_INSCRIPTION_ID)
    .single();
  if (readError) throw readError;

  const { error: updError } = await supabase
    .from("inscriptions")
    .update({
      price: PRICE,
      duration_hours: HOURS,
      hours_followed: HOURS,
      funding_organization: "FIFPL",
      pedagogical_cost: PRICE,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", MONTAINE_INSCRIPTION_ID);
  if (updError) throw updError;

  // Facture
  const { data: existingInvs, error: invReadErr } = await supabase
    .from("invoices")
    .select("id, invoice_number, amount_ht, status")
    .eq("inscription_id", MONTAINE_INSCRIPTION_ID);
  if (invReadErr) throw invReadErr;

  let invoiceId = existingInvs?.[0]?.id;
  let invoiceNumber = existingInvs?.[0]?.invoice_number ?? null;
  if (!invoiceId) {
    const { data: inv, error: invErr } = await supabase
      .from("invoices")
      .insert({
        inscription_id: MONTAINE_INSCRIPTION_ID,
        invoice_type: "formation",
        amount_ht: PRICE,
        payment_type: "integral",
        status: "draft",
      })
      .select("id, invoice_number")
      .single();
    if (invErr) throw invErr;
    invoiceId = inv.id;
    invoiceNumber = inv.invoice_number;
  }

  const issueDate = new Date().toISOString().split("T")[0];
  const studentName = row.student_name || "Montaine Gros-Deleglise";
  const formateurName = row.formateur || row.instructor_name || "Maxime Goy";
  const codeOrId = row.code || MONTAINE_INSCRIPTION_ID;

  // Attestation
  const { data: existingAtt } = await supabase
    .from("document_sendings")
    .select("id, pdf_url")
    .eq("inscription_id", MONTAINE_INSCRIPTION_ID)
    .eq("document_type", "ATTESTATION_PRESENCE");

  let attestationPath =
    existingAtt?.[0]?.pdf_url ||
    buildAttestationPresencePath(
      row.student_id!,
      MONTAINE_INSCRIPTION_ID,
      codeOrId
    );

  const attestationBlob = buildAttestationPresencePdfBlob({
    studentName,
    language: row.language || "Anglais",
    startDate: row.start_date!,
    endDate: row.end_date!,
    durationHoursPlanned: HOURS,
    hoursFollowed: HOURS,
    attendanceRate: 100,
    locationOrModality: row.modality || "en_ligne",
    formateurName,
    inscriptionCode: row.code,
    issueDate,
    fundingOrganization: "FIFPL",
  });

  const { error: attUpErr } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(attestationPath, attestationBlob, {
      contentType: "application/pdf",
      upsert: true,
    });
  if (attUpErr) throw new Error(describeCaughtError(attUpErr).message);

  if (!existingAtt?.length) {
    const { error: sendErr } = await supabase.from("document_sendings").insert({
      inscription_id: MONTAINE_INSCRIPTION_ID,
      document_type: "ATTESTATION_PRESENCE",
      sent_to: "portail-stagiaire",
      pdf_url: attestationPath,
    } as never);
    if (sendErr) throw sendErr;
  }

  // Refresh certificat with hours
  const { data: certs, error: certErr } = await supabase
    .from("certificates")
    .select("id, pdf_url")
    .eq("inscription_id", MONTAINE_INSCRIPTION_ID);
  if (certErr) throw certErr;
  const cert = certs?.[0];
  if (cert) {
    const certBlob = buildCertificatePdfBlob({
      studentName,
      language: row.language || "Anglais",
      startDate: row.start_date!,
      endDate: row.end_date!,
      durationHoursPlanned: HOURS,
      hoursFollowed: HOURS,
      locationOrModality: row.modality || "en_ligne",
      formateurName,
      niveauGeneralEntree: row.niveau_general_entree || "B1+",
      niveauTechniqueEntree: row.niveau_technique_entree || "B1",
      niveauGeneralSortie: row.niveau_general_sortie || "B2",
      niveauTechniqueSortie: row.niveau_technique_sortie || "B2",
      objectifAtteint: (row.objectif_atteint as "oui") || "oui",
      commentaire: row.commentaire_sortie || "",
      issueDate: issueDate,
      inscriptionCode: row.code,
    });
    const certPath =
      cert.pdf_url ||
      `${row.student_id}/${MONTAINE_INSCRIPTION_ID}/${cert.id}.pdf`;
    const { error: certUpErr } = await supabase.storage
      .from(CERTIFICATE_BUCKET)
      .upload(certPath, certBlob, { contentType: "application/pdf", upsert: true });
    if (certUpErr) throw new Error(describeCaughtError(certUpErr).message);
    await supabase
      .from("certificates")
      .update({
        hours_followed: HOURS,
        hours_planned: HOURS,
        attendance_rate: 100,
        pdf_url: certPath,
      } as never)
      .eq("id", cert.id);
    writeFileSync(
      "/opt/cursor/artifacts/montaine-certificat.pdf",
      Buffer.from(await certBlob.arrayBuffer())
    );
  }

  writeFileSync(
    "/opt/cursor/artifacts/montaine-attestation-presence.pdf",
    Buffer.from(await attestationBlob.arrayBuffer())
  );

  console.log(
    JSON.stringify(
      {
        inscriptionId: MONTAINE_INSCRIPTION_ID,
        price: PRICE,
        hours: HOURS,
        invoiceId,
        invoiceNumber,
        attestationPath,
        certificateId: cert?.id ?? null,
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
