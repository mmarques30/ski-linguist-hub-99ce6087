/**
 * Génère le PDF d'évaluation (habillage = sponsor_type), le dépose dans
 * le bucket privé evaluation-pdfs, pose pdf_url et passe le statut à envoye.
 *
 * Aucun corps d'e-mail n'est inventé : stockage + statut seulement.
 * Paula déploie la fonction ; ne pas sonder 403/404.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  buildEvaluationPdfModel,
  evaluationPdfStoragePath,
  parseEvaluationPriceTtc,
  parseFliIdentity,
  type EvaluationPdfInput,
} from "../_shared/evaluation-pdf-model.ts";
import { renderEvaluationPdf } from "../_shared/evaluation-pdf-render.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BUCKET = "evaluation-pdfs";

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function num(value: unknown): number {
  return typeof value === "number" ? value : Number(value);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json(401, { error: "Unauthorized" });
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await callerClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return json(401, { error: "Unauthorized" });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const userId = claimsData.claims.sub as string;

    const { data: staffForCaller, error: staffErr } = await callerClient.rpc(
      "is_staff"
    );
    if (staffErr || !staffForCaller) {
      return json(403, { error: "Réservé au staff" });
    }

    const payload = await req.json().catch(() => ({}));
    const evaluationId = payload.evaluationId as string | undefined;
    if (!evaluationId) {
      return json(400, { error: "evaluationId requis" });
    }

    const { data: evaluation, error: evalErr } = await admin
      .from("test_evaluations")
      .select("*")
      .eq("id", evaluationId)
      .maybeSingle();
    if (evalErr || !evaluation) {
      return json(404, { error: "Évaluation introuvable" });
    }
    if (!["valide", "envoye"].includes(evaluation.status)) {
      return json(409, {
        error: "L'évaluation doit être validée avant génération du PDF",
      });
    }

    const { data: booking, error: bookingErr } = await admin
      .from("test_bookings")
      .select(
        "id, language, datetime, previous_test, sponsor_type, sponsor_id, candidate_id, instructor_id"
      )
      .eq("id", evaluation.booking_id)
      .maybeSingle();
    if (bookingErr || !booking) {
      return json(404, { error: "Réservation introuvable" });
    }

    const { data: candidate } = await admin
      .from("test_candidates")
      .select("name, profession, carte_syndicale, ski_school_id")
      .eq("id", booking.candidate_id)
      .maybeSingle();

    const { data: school } = candidate?.ski_school_id
      ? await admin
          .from("ski_schools")
          .select("name")
          .eq("id", candidate.ski_school_id)
          .maybeSingle()
      : { data: null };

    const { data: instructor } = booking.instructor_id
      ? await admin
          .from("instructors")
          .select("first_name, last_name")
          .eq("id", booking.instructor_id)
          .maybeSingle()
      : { data: null };

    const { data: partner } = booking.sponsor_id
      ? await admin
          .from("partners")
          .select("name")
          .eq("id", booking.sponsor_id)
          .maybeSingle()
      : { data: null };

    const { data: settings } = await admin
      .from("app_settings")
      .select("key, value")
      .in("key", ["evaluation_price_ttc", "fli_identity"]);

    const priceRow = settings?.find((s) => s.key === "evaluation_price_ttc");
    const identityRow = settings?.find((s) => s.key === "fli_identity");
    const priceTtc = parseEvaluationPriceTtc(priceRow?.value);
    const identity = parseFliIdentity(identityRow?.value);
    if (!identity) {
      return json(500, { error: "fli_identity manquant dans app_settings" });
    }

    const instructorName = instructor
      ? `${instructor.first_name ?? ""} ${instructor.last_name ?? ""}`.trim()
      : null;

    const input: EvaluationPdfInput = {
      sponsorType: booking.sponsor_type,
      evaluatedAt: booking.datetime ? new Date(booking.datetime) : new Date(),
      candidateName: candidate?.name ?? "",
      candidateProfession: candidate?.profession,
      carteSyndicale: candidate?.carte_syndicale,
      language: booking.language,
      previousTest: Boolean(booking.previous_test),
      skiSchoolName: school?.name ?? null,
      companyName:
        booking.sponsor_type === "dsf"
          ? partner?.name || school?.name || null
          : school?.name ?? null,
      instructorName,
      scores: {
        comprehension: num(evaluation.score_comprehension),
        expression: num(evaluation.score_expression),
        structure: num(evaluation.score_structure),
        technique: num(evaluation.score_technique),
        conversation: num(evaluation.score_conversation),
        general: num(evaluation.score_general),
      },
      cecrlGeneral: evaluation.cecrl_label,
      blocs: {
        introduction: evaluation.bloc_introduction ?? "",
        comprehension: evaluation.bloc_comprehension ?? "",
        technique: evaluation.bloc_technique ?? "",
        conclusion: evaluation.bloc_conclusion ?? "",
      },
      noteMethodologique: evaluation.note_methodologique,
      priceTtc,
      identity,
    };

    const model = buildEvaluationPdfModel(input);
    const bytes = await renderEvaluationPdf(model);
    const path = evaluationPdfStoragePath(evaluationId);

    const { error: uploadErr } = await admin.storage
      .from(BUCKET)
      .upload(path, bytes, {
        contentType: "application/pdf",
        upsert: true,
      });
    if (uploadErr) {
      return json(500, { error: "Dépôt du PDF impossible" });
    }

    const now = new Date().toISOString();
    const { error: updateErr } = await admin
      .from("test_evaluations")
      .update({
        pdf_url: path,
        attestation_url: path,
        attestation_sent_at: now,
        status: "envoye",
      })
      .eq("id", evaluationId);
    if (updateErr) {
      return json(500, { error: "Mise à jour du statut impossible" });
    }

    const { data: signed } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(path, 60 * 10);

    await admin.from("audit_log").insert({
      action: "c5_evaluation_pdf_generated",
      table_name: "test_evaluations",
      record_id: evaluationId,
      user_id: userId,
      new_values: {
        habillage: model.habillage,
        bucket: BUCKET,
        status: "envoye",
        show_price: model.showPrice,
        caller_is_staff: true,
      },
    });

    return json(200, {
      ok: true,
      habillage: model.habillage,
      title: model.title,
      path,
      signedUrl: signed?.signedUrl ?? null,
      status: "envoye",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur interne";
    return json(500, { error: message });
  }
});
