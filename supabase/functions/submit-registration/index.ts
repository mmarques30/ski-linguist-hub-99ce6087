import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  FRAIS_DOSSIER_EUR,
  getInscriptionPaymentFields,
  isValidPaymentOption,
  normalizePaymentOption,
  REGISTRATION_PAYMENT_OPTIONS,
} from "../_shared/registration-payments.ts";
import { applyEmailTemplate, sendFliEmail } from "../_shared/fli-email.ts";
import { describeCaughtError } from "../_shared/supabase-error.ts";
import {
  inscriptionDatesSentenceFr,
  REQUESTED_START_DATE_REQUIRED_MESSAGE,
  resolveInscriptionDates,
} from "../_shared/registration-dates.ts";
import { isStudentPayer } from "../_shared/inscription-payer.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "info@fli.fr";

async function deleteNewStudent(
  supabase: ReturnType<typeof createClient>,
  studentId: string | undefined,
  createdStudent: boolean
) {
  if (!createdStudent || !studentId) return;
  const { error } = await supabase.from("students").delete().eq("id", studentId);
  if (error) {
    console.error("submit-registration orphan student cleanup:", error);
  }
}

const LANGUAGE_MAP: Record<string, string> = {
  english: "Anglais",
  portuguese: "Portugais",
  russian: "Russe",
  dutch: "Néerlandais",
  german: "Allemand",
  spanish: "Espagnol",
  italian: "Italien",
  chinese: "Chinois",
  french: "Français",
};

const MODALITY_MAP: Record<string, string> = {
  in_person: "presentiel",
  online_individual: "en_ligne_individuel",
  online_group: "en_ligne_groupe",
};

// Format du cours : sans lui, l'écran « Constitution des groupes » et les
// rappels J-10 excluent les inscriptions venues du formulaire en ligne.
const COURSE_TYPE_MAP: Record<string, string> = {
  in_person: "Collectif",
  online_group: "Collectif",
  online_individual: "Individuel",
};

const FUNDING_MAP: Record<string, string> = {
  opco: "OPCO / FIFPL",
  company: "Entreprise",
  self: "Autofinancement",
};

const LOCATION_LABELS: Record<string, string> = {
  valdisere: "Val d'Isère",
  courchevel: "Courchevel",
  meribel: "Méribel",
  lesarcs: "Les Arcs",
  chamonix: "Chamonix",
};

const MODALITY_LABELS: Record<string, string> = {
  in_person: "Présentiel",
  online_individual: "En ligne — cours individuel",
  online_group: "En ligne — petit groupe",
};

// Côté stagiaire on annonce la piste, jamais le code CECRL (règle du point 4).
const SLOPE_LABELS: Record<string, string> = {
  verte: "Piste verte",
  bleue: "Piste bleue",
  rouge: "Piste rouge",
  noire: "Piste noire",
  vocab_ski: "Vocabulaire du ski",
};

// BL-026 : sans piste validée, le stagiaire commence sur la piste verte.
function studentFacingSlopeLabel(summary?: {
  passedSlopes: string[];
  highestSlopeReached: string;
  endedAtVocab: boolean;
}): string {
  if (!summary) return "À déterminer";
  const order = ["verte", "bleue", "rouge", "noire"];
  const passed = (summary.passedSlopes || []).filter((s) => order.includes(s));
  if (passed.length > 0) {
    const best = passed.reduce((a, b) => (order.indexOf(b) > order.indexOf(a) ? b : a));
    return SLOPE_LABELS[best];
  }
  return SLOPE_LABELS.verte;
}

interface RegistrationPayload {
  civility: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
  hasHandicap: boolean;
  profession: "ski_instructor" | "other";
  skiSchool: string;
  offeringId?: string;
  fundingType: string;
  modality: string;
  language: string;
  duration: string;
  location: string;
  locationLabel?: string;
  dates: string;
  dateKey?: string;
  dateLabel?: string;
  startDate?: string;
  endDate?: string;
  /** BL-029 : date souhaitée quand l'offre n'a pas de session datée. */
  requestedStartDate?: string;
  price?: number;
  isCustomFormat?: boolean;
  customFormatDetails?: string;
  hasBeenEvaluated: boolean;
  currentLevel: string;
  testScore: number;
  correctAnswers?: number;
  needsAdminCall?: boolean;
  testAnswers?: Record<string, string>;
  testSummary?: {
    slopeResults: Array<{ slope: string; correct: number; total: number; passed: boolean }>;
    passedSlopes: string[];
    highestSlopeReached: string;
    endedAtVocab: boolean;
  };
  expectations: string;
  certification: string;
  paymentOption?: string;
}

function parseDurationHours(duration?: string): number | null {
  if (!duration) return null;
  const match = duration.match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

/** File d'attente modèle 2 : dossier FIF-PL à +30 min (payeur stagiaire). */
async function enqueueInscriptionDocuments(params: {
  supabase: ReturnType<typeof createClient>;
  inscriptionId: string;
  fundingOrganization: string | null;
}): Promise<boolean> {
  if (!isStudentPayer({ funding_organization: params.fundingOrganization })) {
    return false;
  }
  const scheduledFor = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const { error } = await params.supabase.from("scheduled_reminders").insert({
    type: "DOCUMENT",
    related_id: params.inscriptionId,
    related_table: "inscriptions",
    scheduled_for: scheduledFor,
    status: "PENDING",
  });
  if (error) {
    console.error("enqueue inscription_documents:", error);
    return false;
  }
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { registration } = (await req.json()) as { registration: RegistrationPayload };

    if (!registration?.email || !registration?.firstName || !registration?.lastName) {
      return new Response(
        JSON.stringify({ success: false, error: "Données d'inscription incomplètes" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!registration.testAnswers || !registration.currentLevel) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Le test de niveau adaptatif est obligatoire pour finaliser l'inscription",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);

    const email = registration.email.trim().toLowerCase();
    const language = LANGUAGE_MAP[registration.language] || registration.language;
    const durationHours = registration.isCustomFormat ? null : parseDurationHours(registration.duration);
    const isCustomFormat = registration.isCustomFormat || registration.duration === "custom";
    const correctAnswers = registration.correctAnswers ?? 0;
    const needsAdminCall = registration.needsAdminCall ?? false;

    if (!isCustomFormat && (registration.price ?? 0) > 0) {
      if (!registration.paymentOption || !isValidPaymentOption(registration.paymentOption)) {
        return new Response(
          JSON.stringify({ success: false, error: "Veuillez choisir un mode de paiement" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // BL-029 : plus aucun repli sur les dates de la saison. Une offre « dates
    // flexibles » retient la date de début souhaitée par le stagiaire et reste
    // marquée « à planifier » jusqu'à ce que FLI fixe le calendrier. Le contrôle
    // vient avant la création du stagiaire et du code d'inscription, pour ne
    // rien laisser derrière soi en cas de refus.
    const dates = resolveInscriptionDates({
      startDate: registration.startDate,
      endDate: registration.endDate,
      requestedStartDate: registration.requestedStartDate,
    });

    if (!dates) {
      return new Response(
        JSON.stringify({ success: false, error: REQUESTED_START_DATE_REQUIRED_MESSAGE }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { start_date: startDate, end_date: endDate, dates_to_confirm: datesToConfirm } = dates;

    // La saison ne sert plus qu'au rattachement comptable et aux règles de prix.
    const { data: season } = await supabase
      .from("seasons")
      .select("id")
      .eq("is_current", true)
      .maybeSingle();

    let price: number | null = registration.price ?? null;

    if (price == null && registration.offeringId) {
      const { data: offering } = await supabase
        .from("registration_offerings")
        .select("base_price")
        .eq("id", registration.offeringId)
        .maybeSingle();
      price = offering?.base_price ?? null;
    }

    if (price == null && season?.id && registration.currentLevel && registration.modality && durationHours) {
      const { data: pricing } = await supabase
        .from("pricing_rules")
        .select("base_price")
        .eq("season_id", season.id)
        .eq("language", language)
        .eq("level", registration.currentLevel)
        .eq("modality", MODALITY_MAP[registration.modality] || registration.modality)
        .eq("duration_hours", durationHours)
        .maybeSingle();

      price = pricing?.base_price ?? null;
    }

    const { data: existingStudent } = await supabase
      .from("students")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    let studentId = existingStudent?.id;
    let createdStudent = false;

    if (studentId) {
      await supabase
        .from("students")
        .update({
          civility: registration.civility,
          first_name: registration.firstName,
          last_name: registration.lastName,
          phone: registration.phone,
          street_address: registration.address,
          postal_code: registration.postalCode,
          city: registration.city,
          company: registration.skiSchool || null,
        })
        .eq("id", studentId);
    } else {
      const { data: newStudent, error: studentError } = await supabase
        .from("students")
        .insert({
          civility: registration.civility,
          first_name: registration.firstName,
          last_name: registration.lastName,
          email,
          phone: registration.phone,
          street_address: registration.address,
          postal_code: registration.postalCode,
          city: registration.city,
          company: registration.skiSchool || null,
        })
        .select("id")
        .single();

      if (studentError) throw studentError;
      studentId = newStudent.id;
      createdStudent = true;
    }

    const { data: inscriptionCode, error: codeError } = await supabase.rpc("generate_inscription_code");
    if (codeError) {
      await deleteNewStudent(supabase, studentId, createdStudent);
      throw codeError;
    }

    const courseLocation =
      registration.locationLabel ||
      LOCATION_LABELS[registration.location] ||
      registration.location ||
      null;

    const paymentFields =
      !isCustomFormat && price != null && price > 0 && registration.paymentOption &&
      isValidPaymentOption(registration.paymentOption)
        ? getInscriptionPaymentFields(price, normalizePaymentOption(registration.paymentOption))
        : null;

    const paymentFlow = paymentFields?.paymentFlow ?? "none";

    const paymentLabels: Record<string, string> = {
      [REGISTRATION_PAYMENT_OPTIONS.STRIPE_DEPOSIT_CHEQUE]:
        "150 € Stripe + solde chèque à l'inscription (encaissement après clôture dossier)",
      [REGISTRATION_PAYMENT_OPTIONS.VIREMENT_DEPOSIT]:
        "150 € virement + solde chèque à l'inscription (encaissement après clôture dossier)",
      [REGISTRATION_PAYMENT_OPTIONS.STRIPE_FULL]: "Paiement intégral Stripe",
      [REGISTRATION_PAYMENT_OPTIONS.VIREMENT_FULL]: "Paiement intégral virement",
      virement:
        "150 € virement + solde chèque à l'inscription (encaissement après clôture dossier)",
    };

    const { data: inscription, error: inscriptionError } = await supabase
      .from("inscriptions")
      .insert({
        code: inscriptionCode,
        student_id: studentId,
        language,
        start_date: startDate,
        end_date: endDate,
        dates_to_confirm: datesToConfirm,
        duration_hours: durationHours,
        price,
        entry_level: registration.currentLevel || null,
        modality: MODALITY_MAP[registration.modality] || registration.modality,
        course_type: COURSE_TYPE_MAP[registration.modality] || null,
        course_location: courseLocation,
        funding_organization: FUNDING_MAP[registration.fundingType] || registration.fundingType || null,
        certification_type: registration.certification || null,
        expectations: registration.expectations || null,
        schedule_status: "pending",
        entry_test_score: registration.testAnswers ? String(correctAnswers) : null,
        payment_method: paymentFields?.paymentMethod ?? null,
        balance_after_deposit: paymentFields?.balanceAfterDeposit ?? null,
        observations: [
          isCustomFormat
            ? `📋 DEVIS DEMANDÉ — Format personnalisé:\n${registration.customFormatDetails || "(non renseigné)"}`
            : null,
          registration.dateLabel || registration.dates
            ? `Dates: ${registration.dateLabel || registration.dates}`
            : null,
          datesToConfirm
            ? `⏳ Dates à planifier — début souhaité par le stagiaire : ${startDate}`
            : null,
          registration.offeringId ? `Offre catalogue: ${registration.offeringId}` : null,
          registration.profession === "ski_instructor" ? "Moniteur de ski" : "Autre profession",
          registration.hasHandicap ? "Situation de handicap signalée" : null,
          needsAdminCall ? "⚠️ ALERTE: Niveau très faible — contacter le stagiaire" : null,
          registration.testSummary
            ? `Test adaptatif: ${registration.testSummary.passedSlopes.join(" → ") || "vocab ski"}`
            : null,
          registration.paymentOption
            ? `Paiement: ${paymentLabels[registration.paymentOption] || registration.paymentOption}`
            : null,
          paymentFields && paymentFields.balanceAfterDeposit > 0
            ? `Frais de dossier: ${FRAIS_DOSSIER_EUR} € · Solde chèque: ${paymentFields.balanceAfterDeposit} € (à envoyer à l'inscription, encaissement après clôture dossier)`
            : paymentFields?.paymentType === "total" && paymentFields.paymentFlow === "virement"
              ? `Paiement intégral par virement: ${price} €`
              : null,
        ]
          .filter(Boolean)
          .join("\n"),
        season_id: season?.id || null,
        status: "en_attente",
      })
      .select("id, code, access_token")
      .single();

    if (inscriptionError) {
      await deleteNewStudent(supabase, studentId, createdStudent);
      throw inscriptionError;
    }

    if (paymentFields?.paymentFlow === "virement" && paymentFields.virementAmount > 0) {
      const isFullTransfer =
        registration.paymentOption === REGISTRATION_PAYMENT_OPTIONS.VIREMENT_FULL;
      await supabase.from("payments").insert({
        inscription_id: inscription.id,
        amount: paymentFields.virementAmount,
        payment_type: isFullTransfer ? "total" : "acompte",
        payment_method: "virement",
        status: "en_attente",
        payment_date: new Date().toISOString().split("T")[0],
        reference: inscription.code,
        payer_type: "stagiaire",
        payer_name: `${registration.firstName} ${registration.lastName}`,
        notes: isFullTransfer
          ? "Paiement intégral — en attente de virement"
          : "Frais de dossier — en attente de virement",
      });
    }

    if (paymentFields && paymentFields.balanceAfterDeposit > 0) {
      await supabase.from("payments").insert({
        inscription_id: inscription.id,
        amount: paymentFields.balanceAfterDeposit,
        payment_type: "partial",
        payment_method: "cheque",
        status: "en_attente",
        payment_date: new Date().toISOString().split("T")[0],
        reference: inscription.code,
        payer_type: "stagiaire",
        payer_name: `${registration.firstName} ${registration.lastName}`,
        notes:
          "Chèque à envoyer à l'inscription — encaissement après clôture du dossier",
        cheque_deposited: false,
      });
    }

    if (registration.testAnswers) {
      const totalQuestions = registration.testSummary
        ? registration.testSummary.slopeResults.reduce((sum, r) => sum + r.total, 0)
        : correctAnswers;
      const scorePercentage = totalQuestions > 0
        ? Math.round((correctAnswers / totalQuestions) * 100)
        : 0;

      const { data: placementTest, error: placementError } = await supabase
        .from("placement_tests")
        .insert({
          student_id: studentId,
          inscription_id: inscription.id,
          language,
          total_questions: totalQuestions,
          correct_answers: correctAnswers,
          score_percentage: scorePercentage,
          determined_level: registration.currentLevel,
          answers: {
            responses: registration.testAnswers,
            summary: registration.testSummary ?? null,
          },
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (placementError) throw placementError;

      if (placementTest?.id) {
        await supabase
          .from("inscriptions")
          .update({ entry_test_id: placementTest.id })
          .eq("id", inscription.id);
      }
    }

    let emailSent = false;
    let documentsSent = false;
    if (resendApiKey) {
      const isGroup =
        registration.modality === "in_person" ||
        registration.modality === "presentiel" ||
        registration.modality === "online_group" ||
        registration.modality === "en_ligne_groupe";
      const confirmationSlug = isGroup
        ? "inscription_confirmation_group"
        : "inscription_confirmation_individual";

      // Nouveau slug d'abord ; repli sur l'ancien tant qu'il n'est pas publié.
      let { data: template } = await supabase
        .from("email_templates")
        .select("slug, subject_fr, body_fr")
        .eq("slug", confirmationSlug)
        .eq("is_active", true)
        .maybeSingle();
      if (!template) {
        const fallback = await supabase
          .from("email_templates")
          .select("slug, subject_fr, body_fr")
          .eq("slug", "inscription_confirmation")
          .eq("is_active", true)
          .maybeSingle();
        template = fallback.data;
      }

      const studentName = `${registration.firstName} ${registration.lastName}`;
      const appUrl = (Deno.env.get("APP_URL") || "https://ski-linguist-hub.lovable.app").replace(
        /\/$/,
        ""
      );
      const suiviUrl = inscription.access_token
        ? `${appUrl}/suivi/${inscription.access_token}`
        : "";
      const variables = {
        student_name: studentName,
        language,
        start_date: startDate,
        end_date: endDate,
        // BL-029 : une période à planifier ne s'écrit pas « du X au X ».
        dates_label: inscriptionDatesSentenceFr({
          start_date: startDate,
          end_date: endDate,
          dates_to_confirm: datesToConfirm,
        }),
        inscription_code: inscription.code || "",
        course_location: courseLocation || "À confirmer",
        modality_label:
          MODALITY_LABELS[registration.modality] || registration.modality || "À confirmer",
        slope_label: studentFacingSlopeLabel(registration.testSummary),
        payment_label: registration.paymentOption
          ? paymentLabels[registration.paymentOption] || registration.paymentOption
          : "Devis à établir",
        suivi_url: suiviUrl,
      };

      if (template) {
        try {
          const subject = applyEmailTemplate(template.subject_fr, variables);
          const html = applyEmailTemplate(template.body_fr, variables);
          emailSent = (await sendFliEmail({ resendApiKey, to: email, subject, html })).ok;

          await supabase.from("email_log").insert({
            template_slug: template.slug,
            recipient_email: email,
            recipient_name: studentName,
            status: emailSent ? "sent" : "failed",
            inscription_id: inscription.id,
            variables_used: variables,
          });
        } catch (renderError) {
          const message =
            renderError instanceof Error ? renderError.message : String(renderError);
          await supabase.from("email_log").insert({
            template_slug: template.slug,
            recipient_email: email,
            recipient_name: studentName,
            status: "failed",
            error_message: message,
            inscription_id: inscription.id,
            variables_used: variables,
          });
        }
      }

      const fundingOrganization =
        FUNDING_MAP[registration.fundingType] || registration.fundingType || null;
      try {
        documentsSent = await enqueueInscriptionDocuments({
          supabase,
          inscriptionId: inscription.id,
          fundingOrganization,
        });
      } catch (docError) {
        console.error("enqueue inscription_documents error:", docError);
      }

      if (needsAdminCall) {
        const adminSubject = `[ALERTE FLI] Test de niveau faible — ${studentName}`;
        const adminHtml = `<p>Le stagiaire <strong>${studentName}</strong> (${email}) nécessite un contact téléphonique suite au test de niveau.</p>
          <p>Code inscription: <strong>${inscription.code}</strong></p>
          <p>Merci de le contacter par téléphone.</p>`;
        await sendFliEmail({ resendApiKey, to: ADMIN_EMAIL, subject: adminSubject, html: adminHtml });
      }

      if (isCustomFormat) {
        const adminSubject = `[DEVIS FLI] Format personnalisé — ${studentName}`;
        const adminHtml = `<p><strong>${studentName}</strong> (${email}) demande un devis pour un format personnalisé.</p>
          <p>Code inscription: <strong>${inscription.code}</strong></p>
          <p>Langue: ${language} · Lieu: ${courseLocation || "—"}</p>
          <p><strong>Projet décrit:</strong></p>
          <p>${(registration.customFormatDetails || "").replace(/\n/g, "<br>")}</p>`;
        await sendFliEmail({ resendApiKey, to: ADMIN_EMAIL, subject: adminSubject, html: adminHtml });
      }

      const { data: adminUsers } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      for (const admin of adminUsers || []) {
        const notifTitle = isCustomFormat
          ? `📋 Devis à préparer — ${registration.firstName}`
          : needsAdminCall
            ? `⚠️ Inscription — appeler ${registration.firstName}`
            : `Nouvelle inscription — ${registration.firstName}`;
        const notifMessage = isCustomFormat
          ? `Inscription ${inscription.code} — format personnalisé (${language}). Envoyer une proposition.`
          : `Inscription ${inscription.code} pour ${language}. Niveau: ${registration.currentLevel}. Horaire: en attente de validation.`;

        await supabase.from("notifications").insert({
          user_id: admin.user_id,
          type: "inscription",
          title: notifTitle,
          message: notifMessage,
          link: `/inscriptions/${inscription.id}`,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          inscriptionId: inscription.id,
          inscriptionCode: inscription.code,
          accessToken: inscription.access_token ?? null,
          studentId,
          needsAdminCall,
          emailSent,
          paymentFlow,
          documentsSent,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const described = describeCaughtError(error);
    console.error("submit-registration error:", {
      message: described.message,
      code: described.code,
      error,
    });
    return new Response(
      JSON.stringify({
        success: false,
        error: described.message,
        code: described.code,
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
