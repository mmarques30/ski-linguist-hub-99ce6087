/**
 * Régénère un PDF de formation côté client quand `document_sendings.pdf_url`
 * est null (anciens envois). Staff : stocke aussi dans le bucket `documents`.
 * Stagiaire : ouvre un blob (pas d'upload — RLS storage insert = staff only).
 */
import { supabase } from "@/integrations/supabase/client";
import { DOCUMENTS_BUCKET } from "@/lib/certificateStorage";
import {
  buildConventionPdfModel,
  buildProgrammePdfModel,
  conventionFilename,
  programmeFilename,
} from "@/lib/inscription-documents-pdf";
import { renderInscriptionDocumentPdf } from "@/lib/inscription-documents-pdf-render";
import { INSCRIPTION_DOCUMENT_ASSET_FILES } from "@/lib/inscription-documents-assets";
import { ORGANIZATION_IDENTITY_KEY } from "@/lib/organization-identity";
import { getStaticFormationDocumentPublicUrl } from "@/lib/formation-document-download";

async function fetchPng(path: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

function openBlob(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function downloadFormationDocumentClient(params: {
  documentSendingId: string;
}): Promise<{ path: string | null }> {
  const { data: sending, error: sendingErr } = await supabase
    .from("document_sendings")
    .select("id, inscription_id, document_type, pdf_url")
    .eq("id", params.documentSendingId)
    .maybeSingle();
  if (sendingErr) throw sendingErr;
  if (!sending) throw new Error("Document introuvable");

  const docType = String(sending.document_type || "").toUpperCase();

  // Sécurité : les PDF déjà stockés passent par CertificatePdfButton.
  // Les statiques ont une URL publique — on ne devrait pas arriver ici.
  const staticUrl = getStaticFormationDocumentPublicUrl(docType);
  if (staticUrl) {
    window.open(staticUrl, "_blank", "noopener,noreferrer");
    return { path: null };
  }

  if (docType !== "CONVENTION" && docType !== "PROGRAMME") {
    throw new Error(`Type non générable : ${docType}`);
  }

  const { data: inscription, error: insErr } = await supabase
    .from("inscriptions")
    .select(
      `
      id,
      code,
      language,
      start_date,
      end_date,
      duration_hours,
      course_location,
      modality,
      price,
      deposit_amount,
      balance_after_deposit,
      group_size,
      funding_organization,
      payment_method,
      student_id,
      students!inscriptions_student_id_fkey (
        id,
        civility,
        first_name,
        last_name,
        street_address,
        postal_code,
        city,
        email,
        phone,
        company
      )
    `,
    )
    .eq("id", sending.inscription_id)
    .maybeSingle();
  if (insErr) throw insErr;
  if (!inscription) throw new Error("Inscription introuvable");

  const studentRaw = (inscription as { students?: Record<string, unknown> | null })
    .students;
  const student = {
    civility: (studentRaw?.civility as string | null) ?? null,
    first_name: (studentRaw?.first_name as string | null) ?? null,
    last_name: (studentRaw?.last_name as string | null) ?? null,
    street_address: (studentRaw?.street_address as string | null) ?? null,
    postal_code: (studentRaw?.postal_code as string | null) ?? null,
    city: (studentRaw?.city as string | null) ?? null,
    email: (studentRaw?.email as string | null) ?? null,
    phone: (studentRaw?.phone as string | null) ?? null,
    company: (studentRaw?.company as string | null) ?? null,
  };
  const studentId =
    (typeof studentRaw?.id === "string" && studentRaw.id) ||
    (typeof inscription.student_id === "string" ? inscription.student_id : "");

  const { data: identityRow } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", ORGANIZATION_IDENTITY_KEY)
    .maybeSingle();

  const [letterheadPng, organismSignaturePng] = await Promise.all([
    fetchPng(`/inscription-documents/${INSCRIPTION_DOCUMENT_ASSET_FILES.letterhead}`),
    fetchPng(
      `/inscription-documents/${INSCRIPTION_DOCUMENT_ASSET_FILES.organismSignature}`,
    ),
  ]);
  if (!letterheadPng?.length) {
    throw new Error("En-tête FLI introuvable");
  }

  const code = inscription.code || "sans-code";
  let bytes: Uint8Array;
  let filename: string;

  if (docType === "CONVENTION") {
    if (!organismSignaturePng?.length) {
      throw new Error("Signature organisme introuvable");
    }
    const model = buildConventionPdfModel({
      inscription,
      student,
      identity: identityRow?.value ?? null,
    });
    bytes = await renderInscriptionDocumentPdf(model, {
      organismSignaturePng,
      letterheadPng,
    });
    filename = conventionFilename(code);
  } else {
    const model = buildProgrammePdfModel({
      inscription,
      student,
      identity: identityRow?.value ?? null,
    });
    bytes = await renderInscriptionDocumentPdf(model, { letterheadPng });
    filename = programmeFilename(code);
  }

  let path: string | null = null;
  if (studentId) {
    path = `${studentId}/${sending.inscription_id}/${filename.replace(/\s+/g, "-")}`;
    const { error: upErr } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(path, bytes, { contentType: "application/pdf", upsert: true });
    if (!upErr) {
      await supabase
        .from("document_sendings")
        .update({ pdf_url: path })
        .eq("id", sending.id);
    } else {
      // Stagiaire : pas le droit d'écrire — on télécharge quand même en blob.
      path = null;
    }
  }

  openBlob(bytes, filename);
  return { path };
}
