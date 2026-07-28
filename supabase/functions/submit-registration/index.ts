import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "info@fli.fr";

const LANGUAGE_MAP: Record<string, string> = {
  english: "Anglais",
  portuguese: "Portugais",
  russian: "Russe",
  dutch: "Néerlandais",
};

const MODALITY_MAP: Record<string, string> = {
  in_person: "presentiel",
  online_individual: "en_ligne_individuel",
  online_group: "en_ligne_groupe",
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
  fundingType: string;
  modality: string;
  language: string;
  duration: string;
  location: string;
  dates: string;
  hasBeenEvaluated: boolean;
  currentLevel: string;
  testScore: number;
  correctAnswers?: number;
  timeSlot?: "matin" | "apres-midi";
  testAnswers?: Record<string, string>;
  expectations: string;
  certification: string;
}

function parseDurationHours(duration?: string): number | null {
  if (!duration) return null;
  const match = duration.match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

function applyTemplate(template: string, variables: Record<string, string>): string {
  return Object.entries(variables).reduce(
    (html, [key, value]) => html.replaceAll(`{{${key}}}`, value),
    template
  );
}

async function sendEmail(
  resendApiKey: string,
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "FLI Formation <noreply@fli.fr>",
      to: [to],
      subject,
      html,
    }),
  });

  return response.ok;
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);

    const email = registration.email.trim().toLowerCase();
    const language = LANGUAGE_MAP[registration.language] || registration.language;
    const durationHours = parseDurationHours(registration.duration);
    const correctAnswers = registration.correctAnswers ?? 0;
    const needsAdminCall = registration.testAnswers
      ? correctAnswers <= 2
      : false;
    const timeSlot = registration.testAnswers
      ? (registration.timeSlot ?? (correctAnswers <= 10 ? "matin" : "apres-midi"))
      : null;

    const { data: season } = await supabase
      .from("seasons")
      .select("id, start_date, end_date")
      .eq("is_current", true)
      .maybeSingle();

    let price: number | null = null;
    if (season?.id && registration.currentLevel && registration.modality && durationHours) {
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
    }

    const { data: inscriptionCode, error: codeError } = await supabase.rpc("generate_inscription_code");
    if (codeError) throw codeError;

    const startDate = season?.start_date || new Date().toISOString().split("T")[0];
    const endDate = season?.end_date || startDate;

    const { data: inscription, error: inscriptionError } = await supabase
      .from("inscriptions")
      .insert({
        code: inscriptionCode,
        student_id: studentId,
        language,
        start_date: startDate,
        end_date: endDate,
        duration_hours: durationHours,
        price,
        entry_level: registration.currentLevel || null,
        modality: MODALITY_MAP[registration.modality] || registration.modality,
        course_location: LOCATION_LABELS[registration.location] || registration.location || null,
        funding_organization: FUNDING_MAP[registration.fundingType] || registration.fundingType || null,
        certification_type: registration.certification || null,
        expectations: registration.expectations || null,
        schedule: registration.testAnswers ? timeSlot : null,
        entry_test_score: registration.testAnswers ? String(correctAnswers) : null,
        observations: [
          registration.dates ? `Dates souhaitées: ${registration.dates}` : null,
          registration.profession === "ski_instructor" ? "Moniteur de ski" : "Autre profession",
          registration.hasHandicap ? "Situation de handicap signalée" : null,
          needsAdminCall ? "⚠️ ALERTE: Score test ≤ 2 — contacter le stagiaire" : null,
        ]
          .filter(Boolean)
          .join("\n"),
        season_id: season?.id || null,
        status: "en_attente",
      })
      .select("id, code")
      .single();

    if (inscriptionError) throw inscriptionError;

    if (registration.testAnswers) {
      const totalQuestions = 20;
      const scorePercentage = Math.round((correctAnswers / totalQuestions) * 100);

      await supabase.from("placement_tests").insert({
        student_id: studentId,
        inscription_id: inscription.id,
        language,
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
        score_percentage: scorePercentage,
        determined_level: registration.currentLevel,
        answers: registration.testAnswers,
        status: "completed",
        completed_at: new Date().toISOString(),
      });
    }

    let emailSent = false;
    if (resendApiKey) {
      const { data: template } = await supabase
        .from("email_templates")
        .select("subject_fr, body_fr")
        .eq("slug", "inscription_confirmation")
        .maybeSingle();

      const studentName = `${registration.firstName} ${registration.lastName}`;
      const variables = {
        student_name: studentName,
        language,
        start_date: startDate,
        end_date: endDate,
        inscription_code: inscription.code || "",
      };

      if (template) {
        const subject = applyTemplate(template.subject_fr, variables);
        const html = applyTemplate(template.body_fr, variables);
        emailSent = await sendEmail(resendApiKey, email, subject, html);

        await supabase.from("email_log").insert({
          template_slug: "inscription_confirmation",
          recipient_email: email,
          recipient_name: studentName,
          status: emailSent ? "sent" : "failed",
          inscription_id: inscription.id,
          variables_used: variables,
        });
      }

      if (needsAdminCall) {
        const adminSubject = `[ALERTE FLI] Test de niveau faible — ${studentName}`;
        const adminHtml = `<p>Le stagiaire <strong>${studentName}</strong> (${email}) a obtenu ${correctAnswers}/20 au test de niveau.</p>
          <p>Code inscription: <strong>${inscription.code}</strong></p>
          <p>Merci de le contacter par téléphone.</p>`;
        await sendEmail(resendApiKey, ADMIN_EMAIL, adminSubject, adminHtml);
      }

      const { data: adminUsers } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      for (const admin of adminUsers || []) {
        await supabase.from("notifications").insert({
          user_id: admin.user_id,
          type: "inscription",
          title: needsAdminCall
            ? `⚠️ Inscription — appeler ${registration.firstName}`
            : `Nouvelle inscription — ${registration.firstName}`,
          message: `Inscription ${inscription.code} pour ${language}. Score test: ${registration.testAnswers ? `${correctAnswers}/20` : "auto-déclaré"}.`,
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
          studentId,
          timeSlot: registration.testAnswers ? timeSlot : null,
          needsAdminCall,
          emailSent,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("submit-registration error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Erreur interne",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
