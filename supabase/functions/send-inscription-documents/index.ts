/**
 * Modèle 2 — Dossier de formation (inscription_documents).
 *
 * Traite les rappels `scheduled_reminders` de type DOCUMENT dus (file d'attente
 * remplie par submit-registration à +30 min, payeur stagiaire uniquement).
 * Génère convention + programme PDF personnalisés, joint :
 * - FIFPL / moniteur : critères FIF-PL + tutoriel
 * - AGEFICE : demande de prise en charge + pièces justificatives
 * envoie via Resend si le modèle email est actif.
 *
 * Cron inactif par défaut — Paula active depuis /admin/emails.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { loadEmailTemplate, renderEmailTemplate } from "../_shared/email-model-templates.ts";
import { sendFliEmail } from "../_shared/fli-email.ts";
import { isStudentPayer } from "../_shared/inscription-payer.ts";
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
  SKI_MONITOR_STATIC_PACK_DOCUMENTS,
} from "../_shared/ski-monitor-welcome-documents.ts";
import {
  AGEFICE_DOCUMENT_FILES,
  isAgeficeFundingOrganization,
} from "../_shared/agefice-funding.ts";
import { ORGANIZATION_IDENTITY_KEY } from "../_shared/organization-identity.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TEMPLATE_SLUG = "inscription_documents";
const CRITERIA_DOC = SKI_MONITOR_STATIC_PACK_DOCUMENTS.find(
  (d) => d.documentType === "REGLEMENT",
)!;
const TUTORIEL_DOC = SKI_MONITOR_STATIC_PACK_DOCUMENTS.find(
  (d) => d.documentType === "LIVRET",
)!;

const AGEFICE_DEMANDE_DOC = {
  type: "AGEFICE_DEMANDE" as const,
  filename: "AGEFICE-Demande-prise-en-charge-2025-2026.pdf",
  internalFile: AGEFICE_DOCUMENT_FILES.demandePriseEnCharge,
};
const AGEFICE_PIECES_DOC = {
  type: "AGEFICE_PIECES" as const,
  filename: "AGEFICE-Pieces-justificatives-2026.pdf",
  internalFile: AGEFICE_DOCUMENT_FILES.piecesJustificatives,
};

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const dryRun = url.searchParams.get("dry_run") === "true";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!dryRun && !resendApiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "RESEND_API_KEY absente. Utilisez ?dry_run=true pour un essai sans envoi.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const template = await loadEmailTemplate(supabase, TEMPLATE_SLUG);

    const nowIso = new Date().toISOString();
    const { data: reminders, error: remError } = await supabase
      .from("scheduled_reminders")
      .select("id, related_id, scheduled_for, status")
      .eq("type", "DOCUMENT")
      .eq("related_table", "inscriptions")
      .eq("status", "PENDING")
      .lte("scheduled_for", nowIso)
      .order("scheduled_for", { ascending: true })
      .limit(50);

    if (remError) throw remError;

    const results = {
      dryRun,
      templateActive: Boolean(template),
      due: reminders?.length || 0,
      sent: 0,
      skipped: 0,
      cancelled: 0,
      details: [] as Array<{ reminderId: string; inscriptionId: string; action: string }>,
      errors: [] as string[],
    };

    if (!template) {
      results.skipped = results.due;
      return new Response(
        JSON.stringify({
          ...results,
          message: "Modèle inscription_documents inactif — aucun envoi.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: identityRow } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", ORGANIZATION_IDENTITY_KEY)
      .maybeSingle();

    for (const reminder of reminders || []) {
      const inscriptionId = reminder.related_id as string;
      try {
        const { data: inscription, error: insError } = await supabase
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
            documents_sent_at,
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
          `
          )
          .eq("id", inscriptionId)
          .maybeSingle();

        if (insError) throw insError;
        if (!inscription) {
          await supabase
            .from("scheduled_reminders")
            .update({ status: "CANCELLED" })
            .eq("id", reminder.id);
          results.cancelled++;
          results.details.push({
            reminderId: reminder.id,
            inscriptionId,
            action: "ANNULEE - inscription introuvable",
          });
          continue;
        }

        if (!isStudentPayer({ funding_organization: inscription.funding_organization })) {
          await supabase
            .from("scheduled_reminders")
            .update({ status: "CANCELLED" })
            .eq("id", reminder.id);
          results.cancelled++;
          results.details.push({
            reminderId: reminder.id,
            inscriptionId,
            action: "ANNULEE - payeur non stagiaire",
          });
          continue;
        }

        const { data: prior } = await supabase
          .from("email_log")
          .select("id")
          .eq("template_slug", TEMPLATE_SLUG)
          .eq("inscription_id", inscriptionId)
          .eq("status", "sent")
          .limit(1)
          .maybeSingle();

        if (prior) {
          await supabase
            .from("scheduled_reminders")
            .update({ status: "SENT", sent_at: nowIso })
            .eq("id", reminder.id);
          results.skipped++;
          results.details.push({
            reminderId: reminder.id,
            inscriptionId,
            action: "IGNORE - déjà envoyé",
          });
          continue;
        }

        const student = (inscription as { students?: Record<string, unknown> }).students || {};
        const email = typeof student.email === "string" ? student.email.trim() : "";
        const studentName = [student.first_name, student.last_name]
          .filter((p) => typeof p === "string" && p.trim())
          .join(" ")
          .trim();

        if (!email) {
          results.skipped++;
          results.details.push({
            reminderId: reminder.id,
            inscriptionId,
            action: "IGNORE - email stagiaire manquant",
          });
          continue;
        }

        const variables = {
          student_name: studentName || "stagiaire",
          language: inscription.language || "formation",
          inscription_code: inscription.code || "",
        };

        const conventionModel = buildConventionPdfModel({
          inscription,
          student: student as {
            civility?: string | null;
            first_name?: string | null;
            last_name?: string | null;
            street_address?: string | null;
            postal_code?: string | null;
            city?: string | null;
            email?: string | null;
            phone?: string | null;
            company?: string | null;
          },
          identity: identityRow?.value,
        });
        const programmeModel = buildProgrammePdfModel({
          inscription,
          student: student as {
            civility?: string | null;
            first_name?: string | null;
            last_name?: string | null;
            street_address?: string | null;
            postal_code?: string | null;
            city?: string | null;
            email?: string | null;
            phone?: string | null;
            company?: string | null;
          },
          identity: identityRow?.value,
        });

        const [organismSignaturePng, letterheadPng] = await Promise.all([
          loadInscriptionOrganismSignature(),
          loadInscriptionLetterhead(),
        ]);
        if (!organismSignaturePng?.length) {
          throw new Error("signature organisme introuvable (PNG vide)");
        }
        if (!letterheadPng?.length) {
          throw new Error("en-tête FLI introuvable (PNG vide)");
        }

        const isAgefice = isAgeficeFundingOrganization(
          inscription.funding_organization as string | null,
        );

        const [conventionBytes, programmeBytes, staticA, staticB] =
          await Promise.all([
            renderInscriptionDocumentPdf(conventionModel, {
              organismSignaturePng,
              letterheadPng,
            }),
            renderInscriptionDocumentPdf(programmeModel, { letterheadPng }),
            loadSkiMonitorWelcomeDocument(
              isAgefice ? AGEFICE_DEMANDE_DOC.internalFile : CRITERIA_DOC.internalFile,
              supabase,
            ),
            loadSkiMonitorWelcomeDocument(
              isAgefice ? AGEFICE_PIECES_DOC.internalFile : TUTORIEL_DOC.internalFile,
              supabase,
            ),
          ]);
        if (conventionBytes.byteLength < 20_000) {
          throw new Error(
            `convention trop petite (${conventionBytes.byteLength} o) — signature probablement absente`,
          );
        }

        const code = inscription.code || "sans-code";
        // PDF personnalisés uniquement — jamais de .dotx Word sans données stagiaire.
        const packFiles: Array<{
          type:
            | "CONVENTION"
            | "PROGRAMME"
            | "REGLEMENT"
            | "LIVRET"
            | "AGEFICE_DEMANDE"
            | "AGEFICE_PIECES";
          filename: string;
          bytes: Uint8Array;
        }> = [
          { type: "CONVENTION", filename: conventionFilename(code), bytes: conventionBytes },
          { type: "PROGRAMME", filename: programmeFilename(code), bytes: programmeBytes },
          isAgefice
            ? {
                type: AGEFICE_DEMANDE_DOC.type,
                filename: AGEFICE_DEMANDE_DOC.filename,
                bytes: staticA,
              }
            : { type: "REGLEMENT", filename: CRITERIA_DOC.filename, bytes: staticA },
          isAgefice
            ? {
                type: AGEFICE_PIECES_DOC.type,
                filename: AGEFICE_PIECES_DOC.filename,
                bytes: staticB,
              }
            : { type: "LIVRET", filename: TUTORIEL_DOC.filename, bytes: staticB },
        ];
        for (const file of packFiles) {
          if (file.filename.toLowerCase().endsWith(".dotx")) {
            throw new Error(`refus PJ Word : ${file.filename}`);
          }
        }

        const attachments = packFiles.map((f) => ({
          filename: f.filename,
          content: bytesToBase64(f.bytes),
        }));

        if (dryRun) {
          results.sent++;
          results.details.push({
            reminderId: reminder.id,
            inscriptionId,
            action: `DRY_RUN - ${email} (${attachments.length} PJ PDF)`,
          });
          continue;
        }

        const rendered = renderEmailTemplate(template, variables);
        const sent = (
          await sendFliEmail({
            resendApiKey,
            to: email,
            subject: rendered.subject,
            html: rendered.html,
            attachments,
          })
        ).ok;

        await supabase.from("email_log").insert({
          template_slug: TEMPLATE_SLUG,
          recipient_email: email,
          recipient_name: studentName || null,
          status: sent ? "sent" : "failed",
          inscription_id: inscriptionId,
          variables_used: {
            ...variables,
            attachments: attachments.map((a) => a.filename),
          },
          error_message: sent ? null : "envoi Resend échoué",
        });

        if (sent) {
          const studentId =
            (typeof student.id === "string" && student.id) ||
            (typeof (inscription as { student_id?: string }).student_id === "string"
              ? (inscription as { student_id?: string }).student_id
              : "") ||
            "";

          const storagePaths: Record<string, string | null> = {
            CONVENTION: null,
            PROGRAMME: null,
            REGLEMENT: null,
            LIVRET: null,
            AGEFICE_DEMANDE: null,
            AGEFICE_PIECES: null,
          };

          if (studentId) {
            const basePath = `${studentId}/${inscriptionId}`;
            for (const file of packFiles) {
              const path = `${basePath}/${file.filename.replace(/\s+/g, "-")}`;
              const { error: upErr } = await supabase.storage
                .from("documents")
                .upload(path, file.bytes, {
                  contentType: "application/pdf",
                  upsert: true,
                });
              if (upErr) {
                console.warn("upload pack PDF:", file.filename, upErr);
              } else {
                storagePaths[file.type] = path;
              }
            }
          } else {
            console.warn("send-inscription-documents: student_id manquant — PDF non stockés");
          }

          // Remplace d'éventuelles lignes sans PDF / anciennes URLs .dotx / ancien pack FIFPL
          await supabase
            .from("document_sendings")
            .delete()
            .eq("inscription_id", inscriptionId)
            .in("document_type", [
              "CONVENTION",
              "PROGRAMME",
              "REGLEMENT",
              "LIVRET",
              "AGEFICE_DEMANDE",
              "AGEFICE_PIECES",
            ]);

          await supabase.from("document_sendings").insert(
            packFiles.map((f) => ({
              inscription_id: inscriptionId,
              document_type: f.type,
              sent_to: email,
              pdf_url: storagePaths[f.type],
            })),
          );

          await supabase
            .from("inscriptions")
            .update({ documents_sent_at: new Date().toISOString() })
            .eq("id", inscriptionId);

          await supabase
            .from("scheduled_reminders")
            .update({ status: "SENT", sent_at: new Date().toISOString() })
            .eq("id", reminder.id);

          results.sent++;
          results.details.push({
            reminderId: reminder.id,
            inscriptionId,
            action: `ENVOYE - ${email}`,
          });
        } else {
          results.errors.push(`${inscriptionId}: envoi échoué`);
          results.details.push({
            reminderId: reminder.id,
            inscriptionId,
            action: "ECHEC envoi",
          });
        }
      } catch (itemError) {
        const message = itemError instanceof Error ? itemError.message : String(itemError);
        results.errors.push(`${inscriptionId}: ${message}`);
        results.details.push({
          reminderId: reminder.id,
          inscriptionId,
          action: `ERREUR - ${message}`,
        });
      }
    }

    return new Response(JSON.stringify({ success: true, ...results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("send-inscription-documents:", message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
