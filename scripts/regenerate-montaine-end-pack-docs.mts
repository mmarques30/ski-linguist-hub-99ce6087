/**
 * Régénère attestation (carimbo + signature Paula) + facture officielle
 * + certificat pour Montaine Gros-Deleglise — sans envoyer l'e-mail
 * (Paula envoie depuis l'appli).
 *
 *   ./node_modules/.bin/tsx scripts/regenerate-montaine-end-pack-docs.mts
 */
import { writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { ZZTEST_ADMIN_LOGIN } from "../src/lib/zztest-roles-logins.ts";
import { MONTAINE_INSCRIPTION_ID } from "../src/lib/formateur-formation-forms.ts";
import { generateEndPack, type EndPackStore } from "../src/lib/end-pack.ts";
import {
  CERTIFICATE_BUCKET,
  DOCUMENTS_BUCKET,
} from "../src/lib/certificateStorage.ts";
import { paymentMethodLabel } from "../src/lib/payment-methods.ts";

function throwIfError(error: unknown, fallback: string): void {
  if (!error) return;
  const msg =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String((error as { message: unknown }).message)
        : fallback;
  throw new Error(msg || fallback);
}

async function main() {
  const url = process.env.VITE_SUPABASE_URL!;
  const anon = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
  const supabase = createClient(url, anon);
  const { error: authError } = await supabase.auth.signInWithPassword(
    ZZTEST_ADMIN_LOGIN
  );
  if (authError) throw authError;

  const { data: row, error: rowErr } = await supabase
    .from("inscriptions_complete")
    .select(
      "id, student_id, student_name, language, start_date, end_date, duration_hours, hours_followed, course_location, modality, formateur, instructor_name, code, price, deposit_amount, balance_after_deposit, deposit_date, niveau_general_entree, niveau_technique_entree, niveau_general_sortie, niveau_technique_sortie, objectif_atteint, commentaire_sortie, status, student_city"
    )
    .eq("id", MONTAINE_INSCRIPTION_ID)
    .single();
  if (rowErr) throw rowErr;

  const { data: student } = await supabase
    .from("students")
    .select("street_address, postal_code, city, company, email")
    .eq("id", row.student_id!)
    .single();

  const { data: payments } = await supabase
    .from("payments")
    .select("amount, payment_method, payment_date, status")
    .eq("inscription_id", MONTAINE_INSCRIPTION_ID);

  const methods = [
    ...new Set(
      (payments || [])
        .map((p) => paymentMethodLabel(p.payment_method || ""))
        .filter(Boolean)
    ),
  ];

  const store: EndPackStore = {
    async findExistingInvoice(inscriptionId) {
      const { data, error } = await supabase
        .from("invoices")
        .select(
          "id, invoice_number, amount_ht, invoice_date, payment_date, status"
        )
        .eq("inscription_id", inscriptionId)
        .in("payment_type", ["integral", "saldo", "solde"]);
      throwIfError(error, "invoices");
      return data?.[0] ?? null;
    },
    async getInscriptionAmounts(inscriptionId) {
      const { data, error } = await supabase
        .from("inscriptions")
        .select("price, deposit_amount, balance_after_deposit, deposit_date")
        .eq("id", inscriptionId)
        .maybeSingle();
      throwIfError(error, "amounts");
      return data;
    },
    async insertInvoice(row) {
      const { data, error } = await supabase
        .from("invoices")
        .insert(row)
        .select("id, invoice_number")
        .single();
      throwIfError(error, "insert invoice");
      return data!;
    },
    async markInvoicePaid(id, fields) {
      const { error } = await supabase
        .from("invoices")
        .update({
          status: "paid",
          payment_date: fields.payment_date,
        } as never)
        .eq("id", id);
      throwIfError(error, "mark paid");
    },
    async findExistingCertificate(inscriptionId) {
      const { data, error } = await supabase
        .from("certificates")
        .select("id, pdf_url")
        .eq("inscription_id", inscriptionId);
      throwIfError(error, "certs");
      return data?.[0] ?? null;
    },
    async insertCertificate(row) {
      const { data, error } = await supabase
        .from("certificates")
        .insert(row as never)
        .select("id")
        .single();
      throwIfError(error, "insert cert");
      return { id: data!.id };
    },
    async updateCertificatePdfUrl(id, path) {
      const { error } = await supabase
        .from("certificates")
        .update({ pdf_url: path })
        .eq("id", id);
      throwIfError(error, "cert url");
    },
    async insertDocumentSending(row) {
      const { data, error } = await supabase
        .from("document_sendings")
        .insert(row as never)
        .select("id")
        .single();
      throwIfError(error, "sending");
      return { id: data!.id };
    },
    async updateDocumentSendingPdfUrl(id, path) {
      const { error } = await supabase
        .from("document_sendings")
        .update({ pdf_url: path } as never)
        .eq("id", id);
      throwIfError(error, "update sending");
    },
    async uploadCertificatePdf(path, blob) {
      const { error } = await supabase.storage
        .from(CERTIFICATE_BUCKET)
        .upload(path, blob, { contentType: "application/pdf", upsert: true });
      throwIfError(error, "upload cert");
    },
    async findExistingAttestation(inscriptionId) {
      const { data, error } = await supabase
        .from("document_sendings")
        .select("id, pdf_url")
        .eq("inscription_id", inscriptionId)
        .eq("document_type", "ATTESTATION_PRESENCE");
      throwIfError(error, "att");
      return data?.[0] ?? null;
    },
    async findExistingInvoiceSending(inscriptionId) {
      const { data, error } = await supabase
        .from("document_sendings")
        .select("id, pdf_url")
        .eq("inscription_id", inscriptionId)
        .eq("document_type", "FACTURE");
      throwIfError(error, "inv sending");
      return data?.[0] ?? null;
    },
    async uploadAttestationPdf(path, blob) {
      const { error } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .upload(path, blob, { contentType: "application/pdf", upsert: true });
      throwIfError(error, "upload att");
    },
    async uploadInvoicePdf(path, blob) {
      const { error } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .upload(path, blob, { contentType: "application/pdf", upsert: true });
      throwIfError(error, "upload inv");
    },
    async removeAttestationPdf(path) {
      await supabase.storage.from(DOCUMENTS_BUCKET).remove([path]);
    },
    async findExistingSurvey(inscriptionId) {
      const { data, error } = await supabase
        .from("satisfaction_surveys")
        .select("id, token")
        .eq("inscription_id", inscriptionId);
      throwIfError(error, "survey");
      return data?.[0] ?? null;
    },
    async insertSurvey(row) {
      const { data, error } = await supabase
        .from("satisfaction_surveys")
        .insert(row)
        .select("id, token")
        .single();
      throwIfError(error, "insert survey");
      return data!;
    },
    async closeInscription(inscriptionId, fields) {
      const { error } = await supabase
        .from("inscriptions")
        .update(fields as never)
        .eq("id", inscriptionId);
      throwIfError(error, "close");
    },
    async deleteInvoice(id) {
      await supabase.from("invoices").delete().eq("id", id);
    },
    async deleteCertificate(id) {
      await supabase.from("certificates").delete().eq("id", id);
    },
    async deleteDocumentSending(id) {
      await supabase.from("document_sendings").delete().eq("id", id);
    },
    async deleteSurvey(id) {
      await supabase.from("satisfaction_surveys").delete().eq("id", id);
    },
    async removeCertificatePdf(path) {
      await supabase.storage.from(CERTIFICATE_BUCKET).remove([path]);
    },
  };

  const price = Number(row.price) || 900;
  const result = await generateEndPack(store, {
    inscriptionId: MONTAINE_INSCRIPTION_ID,
    studentId: row.student_id!,
    studentName: row.student_name || "Montaine Gros-Deleglise",
    language: row.language || "Anglais",
    startDate: row.start_date!,
    endDate: row.end_date!,
    durationHours: row.duration_hours ?? 18,
    hoursFollowed: row.hours_followed ?? 18,
    courseLocation: row.course_location ?? null,
    modality: row.modality ?? "en_ligne",
    formateurName: row.formateur || row.instructor_name || null,
    code: row.code ?? null,
    niveauGeneralEntree: row.niveau_general_entree || "—",
    niveauTechniqueEntree: row.niveau_technique_entree || "—",
    niveauGeneralSortie: row.niveau_general_sortie || "B1",
    niveauTechniqueSortie: row.niveau_technique_sortie || "B1",
    objectifAtteint: (row.objectif_atteint as "oui") || "oui",
    commentaireSortie: row.commentaire_sortie || "Objectif atteint.",
    attendanceRate: 100,
    generateInvoice: true,
    generateCertificate: true,
    generateAttestation: true,
    sendSurvey: true,
    forceRegenerate: true,
    fundingOrganization: "FIFPL",
    pedagogicalAmount: price,
    courseType: null,
    invoicePdfContext: {
      clientName: row.student_name || "Montaine Gros-Deleglise",
      clientAddress: student?.street_address ?? "5 Chemin de la Roselière",
      clientPostalCode: student?.postal_code ?? "73100",
      clientCity: student?.city || row.student_city || "Aix-les-Bains",
      courseDescription: `Formation ${row.language || "Anglais"}`,
      courseLocation: "En ligne",
      amountHt: price,
      amountTtc: price,
      acompteAmount: 150,
      status: "paid",
      paymentMethodLabel:
        methods.length > 0
          ? methods.join(" + ")
          : "Carte bancaire en ligne + Virement",
    },
  });

  writeFileSync(
    "/opt/cursor/artifacts/montaine-regenerate-result.json",
    JSON.stringify(result, null, 2)
  );
  console.log(JSON.stringify({ ok: true, result }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
