/**
 * One-shot : pack fin de formation Montaine Gros-Deleglise.
 * Auth : zztest.admin@example.invalid (compte de recette).
 *
 *   ./node_modules/.bin/tsx scripts/generate-end-pack-montaine.mts
 */
import { createClient } from "@supabase/supabase-js";
import { generateEndPack, type EndPackStore } from "../src/lib/end-pack.ts";
import { CERTIFICATE_BUCKET } from "../src/lib/certificateStorage.ts";
import { describeCaughtError } from "../src/lib/supabase-error.ts";
import { MONTAINE_INSCRIPTION_ID } from "../src/lib/formateur-formation-forms.ts";
import { ZZTEST_ADMIN_LOGIN } from "../src/lib/zztest-roles-logins.ts";

const url = process.env.VITE_SUPABASE_URL!;
const anon = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
const email = ZZTEST_ADMIN_LOGIN.email;
const password = ZZTEST_ADMIN_LOGIN.password;

function throwIfError(error: unknown, fallback: string): void {
  if (!error) return;
  throw new Error(describeCaughtError(error).message || fallback);
}

async function main() {
  const supabase = createClient(url, anon);
  const { error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (authError) throw authError;

  const { data: row, error: readError } = await supabase
    .from("inscriptions_complete")
    .select(
      "id, student_id, student_name, language, start_date, end_date, duration_hours, hours_followed, course_location, modality, formateur, instructor_name, code, price, niveau_general_entree, niveau_technique_entree, niveau_general_sortie, niveau_technique_sortie, objectif_atteint, commentaire_sortie, status, end_pack_sent_at"
    )
    .eq("id", MONTAINE_INSCRIPTION_ID)
    .single();
  if (readError) throw readError;

  console.log("Inscription:", {
    name: row.student_name,
    status: row.status,
    end_date: row.end_date,
    levels: `${row.niveau_general_entree}→${row.niveau_general_sortie}`,
    price: row.price,
    end_pack_sent_at: row.end_pack_sent_at,
  });

  const store: EndPackStore = {
    async findExistingInvoice(inscriptionId) {
      const { data, error } = await supabase
        .from("invoices")
        .select("id, invoice_number")
        .eq("inscription_id", inscriptionId)
        .in("payment_type", ["integral", "saldo", "solde"]);
      throwIfError(error, "Lecture des factures impossible.");
      if (!data || data.length === 0) return null;
      return { id: data[0].id, invoice_number: data[0].invoice_number };
    },
    async getInscriptionAmounts(inscriptionId) {
      const { data, error } = await supabase
        .from("inscriptions")
        .select("price, deposit_amount, balance_after_deposit")
        .eq("id", inscriptionId)
        .maybeSingle();
      throwIfError(error, "Lecture de l'inscription impossible.");
      return data;
    },
    async insertInvoice(payload) {
      const { data, error } = await supabase
        .from("invoices")
        .insert(payload)
        .select("id, invoice_number")
        .single();
      throwIfError(error, "Création de la facture impossible.");
      if (!data) throw new Error("Création de la facture impossible.");
      return data;
    },
    async findExistingCertificate(inscriptionId) {
      const { data, error } = await supabase
        .from("certificates")
        .select("id, pdf_url")
        .eq("inscription_id", inscriptionId);
      throwIfError(error, "Lecture des certificats impossible.");
      if (!data || data.length === 0) return null;
      return { id: data[0].id, pdf_url: data[0].pdf_url };
    },
    async insertCertificate(payload) {
      const { data, error } = await supabase
        .from("certificates")
        .insert(payload as never)
        .select("id")
        .single();
      throwIfError(error, "Création du certificat impossible.");
      if (!data) throw new Error("Création du certificat impossible.");
      return { id: data.id };
    },
    async updateCertificatePdfUrl(id, path) {
      const { error } = await supabase
        .from("certificates")
        .update({ pdf_url: path })
        .eq("id", id);
      throwIfError(error, "Enregistrement du chemin PDF impossible.");
    },
    async insertDocumentSending(payload) {
      const { data, error } = await supabase
        .from("document_sendings")
        .insert(payload as never)
        .select("id")
        .single();
      throwIfError(error, "Enregistrement du certificat impossible.");
      if (!data) throw new Error("Enregistrement du certificat impossible.");
      return { id: data.id };
    },
    async uploadCertificatePdf(path, blob) {
      const { error } = await supabase.storage
        .from(CERTIFICATE_BUCKET)
        .upload(path, blob, { contentType: "application/pdf", upsert: true });
      throwIfError(error, "Dépôt du PDF du certificat impossible.");
    },
    async findExistingSurvey(inscriptionId) {
      const { data, error } = await supabase
        .from("satisfaction_surveys")
        .select("id, token")
        .eq("inscription_id", inscriptionId);
      throwIfError(error, "Lecture des enquêtes impossible.");
      if (!data || data.length === 0) return null;
      return { id: data[0].id, token: data[0].token };
    },
    async insertSurvey(payload) {
      const { data, error } = await supabase
        .from("satisfaction_surveys")
        .insert(payload)
        .select("id, token")
        .single();
      throwIfError(error, "Création de l'enquête impossible.");
      if (!data) throw new Error("Création de l'enquête impossible.");
      return { id: data.id, token: data.token };
    },
    async closeInscription(inscriptionId, fields) {
      const { error } = await supabase
        .from("inscriptions")
        .update(fields as never)
        .eq("id", inscriptionId);
      throwIfError(error, "Passage au statut Terminée impossible.");
    },
    async deleteInvoice(id) {
      const { error } = await supabase.from("invoices").delete().eq("id", id);
      throwIfError(error, "Annulation de la facture brouillon impossible.");
    },
    async deleteCertificate(id) {
      const { error } = await supabase.from("certificates").delete().eq("id", id);
      throwIfError(error, "Annulation du certificat impossible.");
    },
    async deleteDocumentSending(id) {
      const { error } = await supabase
        .from("document_sendings")
        .delete()
        .eq("id", id);
      throwIfError(error, "Annulation de l'enregistrement du certificat impossible.");
    },
    async deleteSurvey(id) {
      const { error } = await supabase
        .from("satisfaction_surveys")
        .delete()
        .eq("id", id);
      throwIfError(error, "Annulation de l'enquête impossible.");
    },
    async removeCertificatePdf(path) {
      const { error } = await supabase.storage
        .from(CERTIFICATE_BUCKET)
        .remove([path]);
      throwIfError(error, "Suppression du PDF du certificat impossible.");
    },
  };

  // Pas de prix en base → pas de facture 0 € ; certificat + enquête + clôture.
  const result = await generateEndPack(store, {
    inscriptionId: row.id,
    studentId: row.student_id!,
    studentName: row.student_name || "Montaine Gros-Deleglise",
    language: row.language || "Anglais",
    startDate: row.start_date!,
    endDate: row.end_date!,
    durationHours: row.duration_hours,
    hoursFollowed: row.hours_followed,
    courseLocation: row.course_location,
    modality: row.modality,
    formateurName: row.formateur || row.instructor_name || "Maxime Goy",
    code: row.code,
    niveauGeneralEntree: row.niveau_general_entree || "—",
    niveauTechniqueEntree: row.niveau_technique_entree || "—",
    niveauGeneralSortie: row.niveau_general_sortie || "—",
    niveauTechniqueSortie: row.niveau_technique_sortie || "—",
    objectifAtteint: (row.objectif_atteint as "oui") || "oui",
    commentaireSortie: row.commentaire_sortie || "",
    generateInvoice: false,
    generateCertificate: true,
    sendSurvey: true,
  });

  const { data: after } = await supabase
    .from("inscriptions")
    .select("status, final_status, end_pack_sent_at")
    .eq("id", MONTAINE_INSCRIPTION_ID)
    .single();

  console.log("Pack résultat:", result);
  console.log("Inscription après:", after);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
