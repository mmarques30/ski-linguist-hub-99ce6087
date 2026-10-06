/**
 * Modèle 2 — Dossier de formation (variantes par financement).
 *
 * Traite les rappels `scheduled_reminders` de type DOCUMENT dus.
 * Pack + texte e-mail selon `funding-flows` :
 * - FIFPL : critères + tutoriel + convention + programme
 * - AGEFICE : demande + pièces + convention + programme
 * - Autofinancement : convention + programme seulement
 * - OPCO / Entreprise : pas d'envoi auto (rappel annulé si présent)
 *
 * Cron inactif par défaut — Paula active depuis /admin/emails.
 *
 * Renvoi manuel (après changement de durée/tarif) : POST JSON
 * `{ "inscriptionId": "uuid", "force": true, "customSubject"?: "…", "customHtml"?: "…" }`.
 * `force` ignore le journal « déjà envoyé » et régénère les PDF depuis l'inscription.
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
  resolveFifplReglementDocument,
} from "../_shared/ski-monitor-welcome-documents.ts";
import { AGEFICE_DOCUMENT_FILES } from "../_shared/agefice-funding.ts";
import { ORGANIZATION_IDENTITY_KEY } from "../_shared/organization-identity.ts";
import {
  dossierEmailSlugsForFunding,
  getFundingFlow,
  FUNDING_DOSSIER_EMAIL_FALLBACK_SLUG,
} from "../_shared/funding-flows.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STATIC_BY_TYPE: Record<string, { filename: string; internalFile: string }> = {
  REGLEMENT: {
    filename: "Criteres de prise en charge Moniteurs de ski 2026.pdf",
    internalFile: "criteres-prise-en-charge-2026.pdf",
  },
  LIVRET: {
    filename: "Tutoriel FIF-PL FLI.pdf",
    internalFile: "tutoriel-fif-pl-fli.pdf",
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

const PACK_DOCUMENT_TYPES: Record<
  "fifpl" | "agefice" | "convention_programme",
  string[]
> = {
  fifpl: ["CONVENTION", "PROGRAMME", "REGLEMENT", "LIVRET"],
  agefice: ["CONVENTION", "PROGRAMME", "AGEFICE_DEMANDE", "AGEFICE_PIECES"],
  convention_programme: ["CONVENTION", "PROGRAMME"],
};

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function loadDossierTemplate(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  fundingOrganization: string | null,
) {
  for (const slug of dossierEmailSlugsForFunding(fundingOrganization)) {
    const template = await loadEmailTemplate(supabase, slug);
    if (template) return template;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const dryRun = url.searchParams.get("dry_run") === "true";
    const payload = (await req.json().catch(() => ({}))) as {
      inscriptionId?: string;
      force?: boolean;
      customSubject?: string;
      customHtml?: string;
    };
    const forceInscriptionId =
      payload.force === true && typeof payload.inscriptionId === "string"
        ? payload.inscriptionId.trim()
        : "";
    const customSubject =
      typeof payload.customSubject === "string" ? payload.customSubject.trim() : "";
    const customHtml =
      typeof payload.customHtml === "string" ? payload.customHtml.trim() : "";

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

    // Au moins un modèle dossier doit être actif (variante ou fallback).
    const anyTemplate = await loadEmailTemplate(
      supabase,
      FUNDING_DOSSIER_EMAIL_FALLBACK_SLUG,
    );

    const nowIso = new Date().toISOString();
    let reminders: Array<{
      id: string;
      related_id: string;
      scheduled_for: string;
      status: string;
    }> | null = null;
    let remError: { message: string } | null = null;

    if (forceInscriptionId) {
      reminders = [
        {
          id: `force-${forceInscriptionId}`,
          related_id: forceInscriptionId,
          scheduled_for: nowIso,
          status: "PENDING",
        },
      ];
    } else {
      const queued = await supabase
        .from("scheduled_reminders")
        .select("id, related_id, scheduled_for, status")
        .eq("type", "DOCUMENT")
        .eq("related_table", "inscriptions")
        .eq("status", "PENDING")
        .lte("scheduled_for", nowIso)
        .order("scheduled_for", { ascending: true })
        .limit(50);
      reminders = queued.data;
      remError = queued.error;
    }

    if (remError) throw remError;

    const persistReminder = async (
      reminderId: string,
      patch: Record<string, unknown>,
    ) => {
      if (String(reminderId).startsWith("force-")) return;
      await supabase.from("scheduled_reminders").update(patch).eq("id", reminderId);
    };

    const results = {
      dryRun,
      templateActive: Boolean(anyTemplate),
      due: reminders?.length || 0,
      sent: 0,
      skipped: 0,
      cancelled: 0,
      details: [] as Array<{ reminderId: string; inscriptionId: string; action: string }>,
      errors: [] as string[],
    };

    if (!anyTemplate) {
      results.skipped = results.due;
      return new Response(
        JSON.stringify({
          ...results,
          message: "Aucun modèle dossier actif — aucun envoi.",
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
            funding_details,
            observations,
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
          await persistReminder(reminder.id, { status: "CANCELLED" });
          results.cancelled++;
          results.details.push({
            reminderId: reminder.id,
            inscriptionId,
            action: "ANNULEE - inscription introuvable",
          });
          continue;
        }

        if (!isStudentPayer({ funding_organization: inscription.funding_organization })) {
          await persistReminder(reminder.id, { status: "CANCELLED" });
          results.cancelled++;
          results.details.push({
            reminderId: reminder.id,
            inscriptionId,
            action: "ANNULEE - payeur non stagiaire",
          });
          continue;
        }

        const fundingOrg =
          typeof inscription.funding_organization === "string"
            ? inscription.funding_organization
            : null;
        const flow = getFundingFlow(fundingOrg);
        const packId = flow?.packId ?? (fundingOrg ? null : "fifpl");

        if (!packId) {
          await persistReminder(reminder.id, { status: "CANCELLED" });
          results.cancelled++;
          results.details.push({
            reminderId: reminder.id,
            inscriptionId,
            action: `ANNULEE - flux ${flow?.key ?? "inconnu"} sans pack auto`,
          });
          continue;
        }

        const template = await loadDossierTemplate(supabase, fundingOrg);
        if (!template) {
          results.skipped++;
          results.details.push({
            reminderId: reminder.id,
            inscriptionId,
            action: "IGNORE - modèle e-mail dossier inactif",
          });
          continue;
        }
        if (customSubject) template.subject_fr = customSubject;
        if (customHtml) template.body_fr = customHtml;

        if (!forceInscriptionId) {
          const { data: prior } = await supabase
            .from("email_log")
            .select("id")
            .in("template_slug", [
              template.slug,
              FUNDING_DOSSIER_EMAIL_FALLBACK_SLUG,
              "inscription_documents_fifpl",
              "inscription_documents_agefice",
              "inscription_documents_self",
              "inscription_documents_opco",
            ])
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

        const code = inscription.code || "sans-code";
        const neededTypes = PACK_DOCUMENT_TYPES[packId];
        const needsStatic = neededTypes.filter((t) => STATIC_BY_TYPE[t]);
        const fifplReglement = resolveFifplReglementDocument({
          observations:
            typeof (inscription as { observations?: string | null }).observations ===
            "string"
              ? (inscription as { observations?: string | null }).observations
              : null,
          fundingDetails:
            typeof (inscription as { funding_details?: string | null }).funding_details ===
            "string"
              ? (inscription as { funding_details?: string | null }).funding_details
              : null,
        });
        const staticMetaFor = (type: string) =>
          type === "REGLEMENT"
            ? {
                filename: fifplReglement.filename,
                internalFile: fifplReglement.internalFile,
              }
            : STATIC_BY_TYPE[type];

        const [conventionBytes, programmeBytes, ...staticBytes] = await Promise.all([
          renderInscriptionDocumentPdf(conventionModel, {
            organismSignaturePng,
            letterheadPng,
          }),
          renderInscriptionDocumentPdf(programmeModel, { letterheadPng }),
          ...needsStatic.map((t) =>
            loadSkiMonitorWelcomeDocument(staticMetaFor(t).internalFile, supabase),
          ),
        ]);
        if (conventionBytes.byteLength < 20_000) {
          throw new Error(
            `convention trop petite (${conventionBytes.byteLength} o) — signature probablement absente`,
          );
        }

        const packFiles: Array<{
          type: string;
          filename: string;
          bytes: Uint8Array;
        }> = [];
        for (const type of neededTypes) {
          if (type === "CONVENTION") {
            packFiles.push({
              type,
              filename: conventionFilename(code),
              bytes: conventionBytes,
            });
          } else if (type === "PROGRAMME") {
            packFiles.push({
              type,
              filename: programmeFilename(code),
              bytes: programmeBytes,
            });
          } else {
            const meta = staticMetaFor(type);
            const idx = needsStatic.indexOf(type);
            packFiles.push({
              type,
              filename: meta.filename,
              bytes: staticBytes[idx],
            });
          }
        }
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
            action: `DRY_RUN - ${email} (${attachments.length} PJ PDF, ${packId})`,
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
          template_slug: template.slug,
          recipient_email: email,
          recipient_name: studentName || null,
          status: sent ? "sent" : "failed",
          inscription_id: inscriptionId,
          variables_used: {
            ...variables,
            funding_flow: flow?.key ?? "legacy",
            pack_id: packId,
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

          const storagePaths: Record<string, string | null> = {};
          for (const t of neededTypes) storagePaths[t] = null;

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

          await persistReminder(reminder.id, {
            status: "SENT",
            sent_at: new Date().toISOString(),
          });

          results.sent++;
          results.details.push({
            reminderId: reminder.id,
            inscriptionId,
            action: `ENVOYE - ${email} (${packId})`,
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
