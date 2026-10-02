/**
 * Publie (stocke) un document d'inscription déjà envoyé et renvoie une URL signée.
 * Sert les téléchargements staff + portail stagiaire quand `document_sendings.pdf_url`
 * est encore null (anciens envois : PDF joint à l'e-mail uniquement).
 *
 * Body JSON : { "documentSendingId": "uuid" }
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  buildConventionPdfModel,
  buildProgrammePdfModel,
  conventionFilename,
  programmeFilename,
} from "../_shared/inscription-documents-pdf-model.ts";
import { renderInscriptionDocumentPdf } from "../_shared/inscription-documents-pdf-render.ts";
import {
  loadInscriptionLetterhead,
  loadInscriptionOrganismSignature,
} from "../_shared/inscription-documents-assets.ts";
import {
  loadSkiMonitorWelcomeDocument,
  resolveFifplReglementDocument,
  SKI_MONITOR_STATIC_PACK_DOCUMENTS,
} from "../_shared/ski-monitor-welcome-documents.ts";
import {
  AGEFICE_DOCUMENT_FILES,
} from "../_shared/agefice-funding.ts";
import { ORGANIZATION_IDENTITY_KEY } from "../_shared/organization-identity.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TTL_SECONDS = 60 * 10;
const BUCKET = "documents";

const STATIC_DOCS: Record<string, { filename: string; internalFile: string }> = {
  REGLEMENT: {
    filename: SKI_MONITOR_STATIC_PACK_DOCUMENTS.find((d) => d.documentType === "REGLEMENT")!
      .filename,
    internalFile: SKI_MONITOR_STATIC_PACK_DOCUMENTS.find(
      (d) => d.documentType === "REGLEMENT",
    )!.internalFile,
  },
  LIVRET: {
    filename: SKI_MONITOR_STATIC_PACK_DOCUMENTS.find((d) => d.documentType === "LIVRET")!
      .filename,
    internalFile: SKI_MONITOR_STATIC_PACK_DOCUMENTS.find((d) => d.documentType === "LIVRET")!
      .internalFile,
  },
  AGEFICE_DEMANDE: {
    filename: "AGEFICE-Demande-prise-en-charge-2025-2026.pdf",
    internalFile: AGEFICE_DOCUMENT_FILES.demandePriseEnCharge,
  },
  AGEFICE_PIECES: {
    filename: "AGEFICE-Pieces-justificatives-2026.pdf",
    internalFile: AGEFICE_DOCUMENT_FILES.piecesJustificatives,
  },
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function storageFilename(name: string): string {
  return name.replace(/\s+/g, "-");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json(401, { success: false, error: "Unauthorized" });
    }

    const body = await req.json().catch(() => ({}));
    const documentSendingId = String(body.documentSendingId || "").trim();
    if (!documentSendingId) {
      return json(400, { success: false, error: "documentSendingId requis" });
    }

    const caller = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.slice("Bearer ".length);
    let userId: string | null = null;
    const { data: claimsData } = await caller.auth.getClaims(token);
    if (claimsData?.claims?.sub && typeof claimsData.claims.sub === "string") {
      userId = claimsData.claims.sub;
    } else {
      const { data: userData } = await caller.auth.getUser(token);
      userId = userData?.user?.id ?? null;
    }
    if (!userId) {
      return json(401, { success: false, error: "Unauthorized" });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const roleSet = new Set((roles || []).map((r) => r.role as string));
    const isStaff = roleSet.has("admin") || roleSet.has("user");

    const { data: sending, error: sendingErr } = await admin
      .from("document_sendings")
      .select("id, inscription_id, document_type, pdf_url, sent_to")
      .eq("id", documentSendingId)
      .maybeSingle();
    if (sendingErr) throw sendingErr;
    if (!sending) {
      return json(404, { success: false, error: "Envoi introuvable" });
    }

    const { data: inscription, error: insErr } = await admin
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
        funding_details,
        observations,
        student_id,
        students!inscriptions_student_id_fkey (
          id,
          auth_user_id,
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
    if (!inscription) {
      return json(404, { success: false, error: "Inscription introuvable" });
    }

    const student = (inscription as { students?: Record<string, unknown> | null })
      .students;
    const studentId =
      (typeof student?.id === "string" && student.id) ||
      (typeof inscription.student_id === "string" ? inscription.student_id : "");
    const studentAuthId =
      typeof student?.auth_user_id === "string" ? student.auth_user_id : null;

    if (!isStaff && !(roleSet.has("student") && studentAuthId === userId)) {
      return json(403, { success: false, error: "Forbidden" });
    }
    if (!studentId) {
      return json(400, { success: false, error: "student_id manquant" });
    }

    let path =
      typeof sending.pdf_url === "string" && sending.pdf_url.trim()
        ? sending.pdf_url.trim()
        : null;

    if (path && !/^https?:\/\//i.test(path)) {
      const { data: existing } = await admin.storage.from(BUCKET).createSignedUrl(
        path,
        TTL_SECONDS,
      );
      if (existing?.signedUrl) {
        return json(200, {
          success: true,
          path,
          signedUrl: existing.signedUrl,
          published: false,
        });
      }
      // objet manquant → on régénère
      path = null;
    }

    const docType = String(sending.document_type || "").toUpperCase();
    let bytes: Uint8Array;
    let filename: string;

    if (docType === "CONVENTION" || docType === "PROGRAMME") {
      const { data: identityRow } = await admin
        .from("app_settings")
        .select("value")
        .eq("key", ORGANIZATION_IDENTITY_KEY)
        .maybeSingle();

      const studentFields = {
        civility: (student?.civility as string | null) ?? null,
        first_name: (student?.first_name as string | null) ?? null,
        last_name: (student?.last_name as string | null) ?? null,
        street_address: (student?.street_address as string | null) ?? null,
        postal_code: (student?.postal_code as string | null) ?? null,
        city: (student?.city as string | null) ?? null,
        email: (student?.email as string | null) ?? null,
        phone: (student?.phone as string | null) ?? null,
        company: (student?.company as string | null) ?? null,
      };

      const [organismSignaturePng, letterheadPng] = await Promise.all([
        loadInscriptionOrganismSignature(),
        loadInscriptionLetterhead(),
      ]);
      if (!letterheadPng?.length) {
        return json(500, { success: false, error: "en-tête FLI introuvable" });
      }

      const code = (inscription.code as string) || "sans-code";
      if (docType === "CONVENTION") {
        if (!organismSignaturePng?.length) {
          return json(500, {
            success: false,
            error: "signature organisme introuvable",
          });
        }
        const model = buildConventionPdfModel({
          inscription,
          student: studentFields,
          identity: identityRow?.value,
        });
        bytes = await renderInscriptionDocumentPdf(model, {
          organismSignaturePng,
          letterheadPng,
        });
        filename = conventionFilename(code);
      } else {
        const model = buildProgrammePdfModel({
          inscription,
          student: studentFields,
          identity: identityRow?.value,
        });
        bytes = await renderInscriptionDocumentPdf(model, { letterheadPng });
        filename = programmeFilename(code);
      }
    } else if (STATIC_DOCS[docType]) {
      const meta =
        docType === "REGLEMENT"
          ? resolveFifplReglementDocument({
              observations:
                typeof (inscription as { observations?: string | null }).observations ===
                "string"
                  ? (inscription as { observations?: string | null }).observations
                  : null,
              fundingDetails:
                typeof (inscription as { funding_details?: string | null })
                  .funding_details === "string"
                  ? (inscription as { funding_details?: string | null }).funding_details
                  : null,
            })
          : STATIC_DOCS[docType];
      bytes = await loadSkiMonitorWelcomeDocument(meta.internalFile, admin);
      filename = meta.filename;
    } else {
      return json(400, {
        success: false,
        error: `Type non téléchargeable : ${docType}`,
      });
    }

    path = `${studentId}/${sending.inscription_id}/${storageFilename(filename)}`;
    const { error: upErr } = await admin.storage.from(BUCKET).upload(path, bytes, {
      contentType: "application/pdf",
      upsert: true,
    });
    if (upErr) {
      console.error("upload publish PDF:", upErr);
      return json(500, {
        success: false,
        error: upErr.message || "échec upload",
      });
    }

    const { error: updErr } = await admin
      .from("document_sendings")
      .update({ pdf_url: path })
      .eq("id", sending.id);
    if (updErr) throw updErr;

    const { data: signed, error: signErr } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(path, TTL_SECONDS);
    if (signErr || !signed?.signedUrl) {
      return json(500, {
        success: false,
        error: signErr?.message || "signature impossible",
      });
    }

    return json(200, {
      success: true,
      path,
      signedUrl: signed.signedUrl,
      published: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("publish-inscription-documents:", message);
    return json(500, { success: false, error: message });
  }
});
