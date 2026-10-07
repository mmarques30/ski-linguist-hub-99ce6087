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
import { enqueueInscriptionDocuments } from "../_shared/enqueue-inscription-documents.ts";
import {
  confirmationNextStepsHtmlForFunding,
  shouldEnqueueDocumentsAtSubmitWithoutPayment,
} from "../_shared/funding-flows.ts";
import { buildAgeficeObservation } from "../_shared/agefice-funding.ts";
import {
  buildRegistrationAdminNotifyHtml,
  buildRegistrationAdminNotifyMessage,
  buildRegistrationAdminNotifySubject,
  buildRegistrationAdminNotifyTitle,
  type RegistrationAdminSummaryInput,
} from "../_shared/registration-admin-notify.ts";
import {
  isWaitlistOffering,
  resolveOfferingPrice,
} from "../_shared/registration-offerings.ts";
import {
  renderRosiereCfpRequestEmail,
  ROSIERE_CFP_EMAIL_SLUG,
  shouldSendRosiereCfpRequest,
} from "../_shared/rosiere-cfp-request.ts";

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
  fifpl: "FIFPL",
  agefice: "AGEFICE",
  opco: "OPCO",
  company: "Entreprise",
  self: "Autofinancement",
};

function isOpcoFunding(type: string): boolean {
  return type === "opco";
}

function isFifplFunding(type: string): boolean {
  return type === "fifpl";
}

function isAgeficeFunding(type: string): boolean {
  return type === "agefice";
}

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
  vocabScore?: { correct: number; total: number };
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
  /** Optionnel — plus demandé à l'inscription (langage inclusif). */
  civility?: string | null;
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
  skiNetwork?: string;
  skiSchoolCode?: string;
  skiSchoolOther?: string;
  stationOrValley?: string;
  carteSyndicale?: string;
  carteSyndicalePending?: boolean;
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
    vocabScore?: { correct: number; total: number };
    vocabAnswers?: Array<{
      questionId: string;
      questionText: string;
      selected: string;
      correctAnswer: string;
      isCorrect: boolean;
    }>;
    presentationText?: string;
    startedAt?: string | null;
    completedAt?: string | null;
  };
  /** Auto-diagnostic (avant QCM) — feuille Excel Auto-diagnostic */
  autoDiagnostic?: {
    version: 1;
    answers: Record<string, string | string[]>;
    completedAt: string;
  };
  expectations: string;
  certification: string;
  paymentOption?: string;
  /** Tarif partenaire non définitif → inscription sans paiement. */
  pricePending?: boolean;
  /** BL-027 questionnaire OPCO */
  opcoKnowsOpco?: boolean | null;
  opcoName?: string;
  opcoNafCode?: string;
  opcoCaseNotes?: string;
  /** FIFPL — estimation des droits (critères Moniteurs de ski) ; attestation CFP facultative */
  fifplStatus?: "independant" | "micro_entrepreneur" | null;
  fifplCfpAttestationYear?: number | null;
  fifplCfpContributionEur?: number | null;
  fifplCfpAttestationPath?: string | null;
  fifplCfpAttestationFileName?: string | null;
  fifplHadOtherTrainingThisYear?: boolean | null;
  /** Montant déjà pris en charge FIFPL pour une autre formation cette année */
  fifplOtherAmountAlreadyCoveredEur?: number | null;
  fifplParseWarnings?: string[];
}

function buildOpcoFundingDetails(registration: RegistrationPayload): string | null {
  if (!isOpcoFunding(registration.fundingType)) return null;
  return JSON.stringify({
    version: 1,
    source: "register",
    opco: {
      knowsOpco: registration.opcoKnowsOpco ?? null,
      opcoName: (registration.opcoName ?? "").trim(),
      nafCode: (registration.opcoNafCode ?? "").trim(),
      caseNotes: (registration.opcoCaseNotes ?? "").trim(),
    },
  });
}

function hasFifplAnswers(registration: RegistrationPayload): boolean {
  return Boolean(
    registration.fifplStatus ||
      registration.fifplCfpAttestationPath ||
      registration.fifplCfpAttestationFileName ||
      registration.fifplHadOtherTrainingThisYear === true ||
      registration.fifplHadOtherTrainingThisYear === false
  );
}

function buildFifplFundingDetails(registration: RegistrationPayload): string | null {
  if (!isFifplFunding(registration.fundingType) && !hasFifplAnswers(registration)) {
    return null;
  }
  const status = registration.fifplStatus ?? null;
  const contribution = registration.fifplCfpContributionEur ?? null;
  const already =
    registration.fifplHadOtherTrainingThisYear === true
      ? registration.fifplOtherAmountAlreadyCoveredEur ?? 0
      : 0;
  // Estimation alignée sur src/lib/fifpl-funding.ts (copie Deno volontairement
  // allégée — le détail complet reste dans funding_details.fifpl).
  // Visio FLI = présentiel FIFPL (pas e-learning asynchrone → pas de plafond 450 €).
  const annualBase = 900;
  let percent = 100;
  let provisionalMicro = false;
  if (status === "micro_entrepreneur") {
    const c = Number(contribution) || 0;
    if (c >= 116) percent = 100;
    else if (c >= 101) percent = 90;
    else if (c >= 81) percent = 80;
    else if (c >= 41) percent = 60;
    else if (c >= 21) percent = 40;
    else if (c >= 1) percent = 20;
    else {
      // Sans cotisation : pire cas 20 % (aligné src/lib/fifpl-funding.ts)
      percent = 20;
      provisionalMicro = true;
    }
  }
  const gross = Math.round((annualBase * percent) / 100);
  const remaining = Math.max(0, gross - (Number(already) || 0));
  const coursePrice =
    registration.price != null && Number(registration.price) > 0
      ? Number(registration.price)
      : null;
  const coveredOnCourse =
    coursePrice != null ? Math.min(coursePrice, remaining) : null;
  const remainingCharge =
    coursePrice != null && coveredOnCourse != null
      ? Math.max(0, Math.round(coursePrice - coveredOnCourse))
      : null;
  const hasAttestation = Boolean(
    registration.fifplCfpAttestationPath || registration.fifplCfpAttestationFileName
  );

  return JSON.stringify({
    version: 1,
    source: "register",
    fifpl: {
      status,
      cfpAttestationYear: registration.fifplCfpAttestationYear ?? null,
      cfpContributionEur: contribution,
      cfpAttestationPath: registration.fifplCfpAttestationPath ?? null,
      cfpAttestationFileName: registration.fifplCfpAttestationFileName ?? null,
      hadOtherFifplTrainingThisYear: registration.fifplHadOtherTrainingThisYear ?? null,
      otherFifplAmountAlreadyCoveredEur:
        registration.fifplHadOtherTrainingThisYear === true
          ? registration.fifplOtherAmountAlreadyCoveredEur ?? null
          : null,
      parseWarnings: registration.fifplParseWarnings ?? [],
      estimatedRights: {
        rightsPercent: percent,
        grossRightsEur: gross,
        alreadyCoveredEur: Number(already) || 0,
        remainingRightsEur: remaining,
        annualCeilingBaseEur: annualBase,
        isProvisionalMicroEstimate: provisionalMicro,
        coveredOnCourseEur: coveredOnCourse,
        remainingChargeEur: remainingCharge,
        hasCfpAttestation: hasAttestation,
      },
    },
  });
}

function buildFundingDetails(registration: RegistrationPayload): string | null {
  return (
    buildOpcoFundingDetails(registration) || buildFifplFundingDetails(registration)
  );
}

function formatFifplObservation(registration: RegistrationPayload): string {
  const details = buildFifplFundingDetails(registration);
  if (!details) return "Financement FIFPL";
  try {
    const parsed = JSON.parse(details) as {
      fifpl?: {
        status?: string | null;
        cfpAttestationYear?: number | null;
        cfpContributionEur?: number | null;
        hadOtherFifplTrainingThisYear?: boolean | null;
        otherFifplAmountAlreadyCoveredEur?: number | null;
        cfpAttestationFileName?: string | null;
        estimatedRights?: {
          remainingRightsEur?: number;
          rightsPercent?: number;
        };
      };
    };
    const f = parsed.fifpl;
    if (!f) return "Financement FIFPL";
    const lines = ["Financement FIFPL — attestation CFP URSSAF"];
    if (f.status === "independant") lines.push("Statut : indépendant (100 %)");
    if (f.status === "micro_entrepreneur") {
      lines.push(
        `Statut : micro-entrepreneur — CFP ${f.cfpContributionEur ?? "?"} € → ${f.estimatedRights?.rightsPercent ?? "?"} %`
      );
    }
    if (f.cfpAttestationYear != null) lines.push(`Attestation année : ${f.cfpAttestationYear}`);
    if (f.cfpAttestationFileName) lines.push(`Fichier : ${f.cfpAttestationFileName}`);
    if (f.hadOtherFifplTrainingThisYear === true) {
      lines.push(
        `Autre formation FIFPL cette année : oui — déjà pris en charge ${f.otherFifplAmountAlreadyCoveredEur ?? 0} €`
      );
    } else if (f.hadOtherFifplTrainingThisYear === false) {
      lines.push("Autre formation FIFPL cette année : non");
    }
    if (f.estimatedRights?.remainingRightsEur != null) {
      lines.push(`Droits restants estimés : ${f.estimatedRights.remainingRightsEur} €`);
    }
    return lines.join("\n");
  } catch {
    return "Financement FIFPL";
  }
}

function formatOpcoObservation(registration: RegistrationPayload): string {
  const lines = [
    "Financement OPCO — dossier à analyser par FLI pour définir les modalités du contrat (aucun frais facturé pour le moment).",
  ];
  if (registration.opcoKnowsOpco === true) {
    lines.push(`OPCO connu : ${(registration.opcoName ?? "").trim() || "(non précisé)"}`);
  } else if (registration.opcoKnowsOpco === false) {
    lines.push(`OPCO inconnu — code NAF : ${(registration.opcoNafCode ?? "").trim() || "(non précisé)"}`);
  }
  const notes = (registration.opcoCaseNotes ?? "").trim();
  if (notes) lines.push(`Précisions du candidat :\n${notes}`);
  return lines.join("\n");
}

function formatAgeficeObservation(registration: RegistrationPayload): string {
  return buildAgeficeObservation({ startDate: registration.startDate ?? null });
}

function parseDurationHours(duration?: string): number | null {
  if (!duration) return null;
  const match = duration.match(/(\d+)/);
  return match ? Number(match[1]) : null;
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

    if (!registration.autoDiagnostic?.answers) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Veuillez compléter l’auto-diagnostic avant le test de niveau",
        }),
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

    const isOpco = isOpcoFunding(registration.fundingType);
    const isFifpl = isFifplFunding(registration.fundingType);
    const isAgefice = isAgeficeFunding(registration.fundingType);

    if (isOpco) {
      if (registration.opcoKnowsOpco !== true && registration.opcoKnowsOpco !== false) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Indiquez si vous connaissez l’OPCO qui prendra en charge votre dossier.",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (registration.opcoKnowsOpco === true && !(registration.opcoName ?? "").trim()) {
        return new Response(
          JSON.stringify({ success: false, error: "Précisez le nom de l’OPCO." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (registration.opcoKnowsOpco === false && !(registration.opcoNafCode ?? "").trim()) {
        return new Response(
          JSON.stringify({ success: false, error: "Indiquez le code NAF de votre activité." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (isFifpl) {
      if (
        registration.fifplStatus !== "independant" &&
        registration.fifplStatus !== "micro_entrepreneur"
      ) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Indiquez si vous êtes indépendant ou micro-entrepreneur.",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const hasAttestation = Boolean(
        registration.fifplCfpAttestationPath || registration.fifplCfpAttestationFileName
      );
      if (hasAttestation) {
        // Année critères (2026) ou N-1 (2025) — attestation encore en circulation en début de saison.
        const acceptedCfpYears = [2025, 2026];
        if (registration.fifplCfpAttestationYear == null) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Indiquez l’année de l’attestation CFP (attendu : 2025 ou 2026).",
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (!acceptedCfpYears.includes(Number(registration.fifplCfpAttestationYear))) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "L’attestation CFP doit dater de 2025 ou 2026.",
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
      if (
        registration.fifplStatus === "micro_entrepreneur" &&
        !(Number(registration.fifplCfpContributionEur) >= 1)
      ) {
        return new Response(
          JSON.stringify({
            success: false,
            error:
              "Indiquez le montant de votre cotisation CFP (micro-entrepreneur) pour estimer vos droits.",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (
        registration.fifplHadOtherTrainingThisYear !== true &&
        registration.fifplHadOtherTrainingThisYear !== false
      ) {
        return new Response(
          JSON.stringify({
            success: false,
            error:
              "Indiquez si vous avez déjà bénéficié d’une prise en charge FIFPL en 2026.",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (
        registration.fifplHadOtherTrainingThisYear === true &&
        (registration.fifplOtherAmountAlreadyCoveredEur == null ||
          !Number.isFinite(Number(registration.fifplOtherAmountAlreadyCoveredEur)) ||
          Number(registration.fifplOtherAmountAlreadyCoveredEur) < 0)
      ) {
        return new Response(
          JSON.stringify({
            success: false,
            error:
              "Indiquez le montant déjà pris en charge par le FIFPL pour cette autre formation.",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (!isCustomFormat && !isOpco && !registration.pricePending && (registration.price ?? 0) > 0) {
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
      durationHours,
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
    let pricePending = Boolean(registration.pricePending);
    let offeringFundingMode: string | null = null;
    let offeringLocationKey: string | null = registration.location || null;

    if (registration.offeringId) {
      const { data: offering } = await supabase
        .from("registration_offerings")
        .select(
          "base_price, partner_price, partner_price_alt, partner_price_pending, partner_school_codes, enrollment_status, is_active, funding_mode, location_key, location_label"
        )
        .eq("id", registration.offeringId)
        .maybeSingle();

      if (offering && isWaitlistOffering(offering)) {
        return new Response(
          JSON.stringify({
            success: false,
            error:
              "Cette formation est en attente de confirmation. Les inscriptions ne sont pas encore ouvertes.",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (offering) {
        offeringFundingMode =
          typeof offering.funding_mode === "string" ? offering.funding_mode : null;
        offeringLocationKey =
          typeof offering.location_key === "string" ? offering.location_key : offeringLocationKey;
        const skiCode =
          registration.skiSchoolCode && registration.skiSchoolCode !== "__autre__"
            ? registration.skiSchoolCode
            : null;
        const resolved = resolveOfferingPrice(offering, skiCode);
        if (resolved == null) {
          pricePending = true;
          price = null;
        } else {
          price = resolved;
          pricePending = false;
        }
      } else if (price == null) {
        price = null;
      }
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

    const skiSchoolCode =
      registration.skiSchoolCode && registration.skiSchoolCode !== "__autre__"
        ? registration.skiSchoolCode
        : null;
    const skiSchoolOther =
      registration.skiSchoolOther?.trim() ||
      (registration.skiNetwork === "Indépendant.e"
        ? registration.stationOrValley?.trim() || null
        : null);
    const studentSchoolFields = {
      company: registration.skiSchool || null,
      ski_network: registration.skiNetwork || null,
      ski_school_code: skiSchoolCode,
      ski_school_other: skiSchoolOther,
      carte_syndicale: registration.carteSyndicalePending
        ? null
        : registration.carteSyndicale?.trim() || null,
      carte_syndicale_pending: Boolean(registration.carteSyndicalePending),
    };

    if (studentId) {
      await supabase
        .from("students")
        .update({
          civility: registration.civility?.trim() || null,
          first_name: registration.firstName,
          last_name: registration.lastName,
          phone: registration.phone,
          street_address: registration.address,
          postal_code: registration.postalCode,
          city: registration.city,
          ...studentSchoolFields,
        })
        .eq("id", studentId);
    } else {
      const { data: newStudent, error: studentError } = await supabase
        .from("students")
        .insert({
          civility: registration.civility?.trim() || null,
          first_name: registration.firstName,
          last_name: registration.lastName,
          email,
          phone: registration.phone,
          street_address: registration.address,
          postal_code: registration.postalCode,
          city: registration.city,
          ...studentSchoolFields,
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
      !isCustomFormat &&
      !isOpco &&
      !pricePending &&
      price != null &&
      price > 0 &&
      registration.paymentOption &&
      isValidPaymentOption(registration.paymentOption)
        ? getInscriptionPaymentFields(price, normalizePaymentOption(registration.paymentOption))
        : null;

    const paymentFlow = paymentFields?.paymentFlow ?? "none";

    const paymentLabels: Record<string, string> = {
      [REGISTRATION_PAYMENT_OPTIONS.STRIPE_DEPOSIT_CHEQUE]:
        "150 € paiement sécurisé en ligne + solde chèque avant le début de la formation",
      [REGISTRATION_PAYMENT_OPTIONS.VIREMENT_DEPOSIT]:
        "150 € virement + solde chèque avant le début de la formation",
      [REGISTRATION_PAYMENT_OPTIONS.STRIPE_FULL]:
        "Règlement intégral en ligne",
      [REGISTRATION_PAYMENT_OPTIONS.STRIPE_KLARNA_3X]:
        "Payez en 3 fois avec Klarna",
      [REGISTRATION_PAYMENT_OPTIONS.VIREMENT_FULL]: "Paiement intégral virement",
      [REGISTRATION_PAYMENT_OPTIONS.SCHOOL_FIFPL_CHEQUE]:
        "Chèque FIF-PL à envoyer à FLI (Montmélian)",
      virement:
        "150 € virement + solde chèque avant le début de la formation",
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
        funding_details: buildFundingDetails(registration),
        certification_type: registration.certification || null,
        expectations: registration.expectations || null,
        schedule_status: "pending",
        entry_test_score: registration.testAnswers ? String(correctAnswers) : null,
        payment_method: paymentFields?.paymentMethod ?? null,
        deposit_amount: paymentFields?.depositAmount ?? null,
        balance_after_deposit: paymentFields?.balanceAfterDeposit ?? null,
        observations: [
          isCustomFormat
            ? `📋 DEVIS DEMANDÉ — Format personnalisé:\n${registration.customFormatDetails || "(non renseigné)"}`
            : null,
          pricePending
            ? "⏳ EN ATTENTE TARIF — partenaire (tarif à confirmer). Pas de paiement ni convention tant que le tarif n'est pas fixé."
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
          registration.testSummary
            ? `Test adaptatif: ${registration.testSummary.passedSlopes.join(" → ") || "aucune piste validée"} · vocab ${registration.testSummary.vocabScore?.correct ?? "?"}/${registration.testSummary.vocabScore?.total ?? 5}`
            : null,
          isOpco ? formatOpcoObservation(registration) : null,
          isFifpl || hasFifplAnswers(registration)
            ? formatFifplObservation(registration)
            : null,
          isAgefice ? formatAgeficeObservation(registration) : null,
          registration.paymentOption
            ? `Paiement: ${paymentLabels[registration.paymentOption] || registration.paymentOption}`
            : null,
          paymentFields && paymentFields.balanceAfterDeposit > 0
            ? `Frais de dossier: ${FRAIS_DOSSIER_EUR} € · Solde chèque: ${paymentFields.balanceAfterDeposit} € (avant le début de la formation)`
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
          "Chèque à envoyer avant le début de la formation",
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
            autoDiagnostic: registration.autoDiagnostic ?? null,
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
        funding_next_steps: confirmationNextStepsHtmlForFunding(
          FUNDING_MAP[registration.fundingType] || registration.fundingType,
        ),
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

      if (
        shouldSendRosiereCfpRequest({
          profession: registration.profession,
          locationKey: offeringLocationKey || registration.location,
          locationLabel: courseLocation,
          fundingMode: offeringFundingMode,
          status: registration.fifplStatus,
          cfpAttestationPath: registration.fifplCfpAttestationPath,
          cfpAttestationFileName: registration.fifplCfpAttestationFileName,
          cfpAttestationYear: registration.fifplCfpAttestationYear,
          hadOtherFifplTrainingThisYear: registration.fifplHadOtherTrainingThisYear,
          otherFifplAmountAlreadyCoveredEur:
            registration.fifplOtherAmountAlreadyCoveredEur,
        })
      ) {
        try {
          const { data: priorCfp } = await supabase
            .from("email_log")
            .select("id")
            .eq("template_slug", ROSIERE_CFP_EMAIL_SLUG)
            .eq("inscription_id", inscription.id)
            .eq("status", "sent")
            .maybeSingle();

          if (!priorCfp) {
            let subject: string;
            let html: string;
            const { data: cfpTemplate } = await supabase
              .from("email_templates")
              .select("subject_fr, body_fr")
              .eq("slug", ROSIERE_CFP_EMAIL_SLUG)
              .eq("is_active", true)
              .maybeSingle();
            const cfpVars = {
              student_name: studentName,
              inscription_code: inscription.code || "",
            };
            if (cfpTemplate?.subject_fr && cfpTemplate?.body_fr) {
              subject = applyEmailTemplate(cfpTemplate.subject_fr, cfpVars);
              html = applyEmailTemplate(cfpTemplate.body_fr, cfpVars);
            } else {
              const rendered = renderRosiereCfpRequestEmail({
                studentName,
                inscriptionCode: inscription.code || "",
              });
              subject = rendered.subject;
              html = rendered.html;
            }
            const cfpSend = await sendFliEmail({ resendApiKey, to: email, subject, html });
            await supabase.from("email_log").insert({
              template_slug: ROSIERE_CFP_EMAIL_SLUG,
              recipient_email: email,
              recipient_name: studentName,
              status: cfpSend.ok ? "sent" : cfpSend.skipped ? "skipped" : "failed",
              error_message: cfpSend.error ?? null,
              inscription_id: inscription.id,
              variables_used: cfpVars,
            });
          }
        } catch (cfpEmailError) {
          console.error("rosiere CFP request email error:", cfpEmailError);
        }
      }

      // Règle Paula : flux avec règlement → dossier après 150 € / intégral.
      // OPCO / Entreprise : pas d'enfilement auto (funding-flows).
      // Autres sans paiement (devis legacy) : enfilement seulement si le flux le permet.
      const fundingOrganization =
        FUNDING_MAP[registration.fundingType] || registration.fundingType || null;
      if (
        !paymentFields &&
        shouldEnqueueDocumentsAtSubmitWithoutPayment(fundingOrganization)
      ) {
        try {
          documentsSent = await enqueueInscriptionDocuments({
            supabase,
            inscriptionId: inscription.id,
            fundingOrganization,
          });
        } catch (docError) {
          console.error("enqueue inscription_documents error:", docError);
        }
      }

      // Une seule notif e-mail admin par inscription, avec résumé des choix.
      // Plus d'alerte « test niveau faible » (demande Paula, 24/09/2026).
      const datesLabel = inscriptionDatesSentenceFr({
        start_date: startDate,
        end_date: endDate,
        dates_to_confirm: datesToConfirm,
      });
      const adminSummary: RegistrationAdminSummaryInput = {
        firstName: registration.firstName,
        lastName: registration.lastName,
        email,
        phone: registration.phone,
        language,
        modalityLabel:
          MODALITY_LABELS[registration.modality] || registration.modality || "À confirmer",
        fundingLabel:
          FUNDING_MAP[registration.fundingType] || registration.fundingType || "—",
        level: registration.currentLevel || "—",
        slopeLabel: studentFacingSlopeLabel(registration.testSummary),
        durationHours,
        courseLocation: courseLocation || null,
        datesLabel,
        paymentLabel: registration.paymentOption
          ? paymentLabels[registration.paymentOption] || registration.paymentOption
          : isCustomFormat || isOpco
            ? "Devis / à définir"
            : null,
        inscriptionCode: inscription.code,
        isCustomFormat,
        customFormatDetails: registration.customFormatDetails || null,
        isOpco,
        opcoObservation: isOpco ? formatOpcoObservation(registration) : null,
        isFifpl,
        fifplObservation:
          isFifpl || hasFifplAnswers(registration)
            ? formatFifplObservation(registration)
            : null,
        isAgefice,
        ageficeObservation: isAgefice ? formatAgeficeObservation(registration) : null,
        hasHandicap: Boolean(registration.hasHandicap),
        isOtherProfession: registration.profession === "other",
        price,
      };

      try {
        const adminSend = await sendFliEmail({
          resendApiKey,
          to: ADMIN_EMAIL,
          subject: buildRegistrationAdminNotifySubject(adminSummary),
          html: buildRegistrationAdminNotifyHtml(adminSummary),
        });
        await supabase.from("email_log").insert({
          template_slug: "admin_new_inscription",
          recipient_email: ADMIN_EMAIL,
          recipient_name: "FLI Admin",
          status: adminSend.ok ? "sent" : adminSend.skipped ? "skipped" : "failed",
          error_message: adminSend.error ?? null,
          inscription_id: inscription.id,
          variables_used: adminSummary as unknown as Record<string, unknown>,
        });
      } catch (adminEmailError) {
        console.error("admin new-inscription email error:", adminEmailError);
      }

      const { data: adminUsers } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      const notifTitle = buildRegistrationAdminNotifyTitle(adminSummary);
      const notifMessage = buildRegistrationAdminNotifyMessage(adminSummary);

      for (const admin of adminUsers || []) {
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
