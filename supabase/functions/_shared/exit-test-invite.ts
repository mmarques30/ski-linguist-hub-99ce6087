/**
 * Logique commune d'invitation au test de fin (manuel, cron, trigger SQL).
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  loadEmailTemplate,
  renderEmailTemplate,
} from "./email-model-templates.ts";
import { sendFliEmail } from "./fli-email.ts";
import { isFliPlaceholderEmail } from "./email-guards.ts";

const APP_URL = Deno.env.get("APP_URL") || "https://plateforme.fli.fr";

export function formatExitTestDateFr(iso: string | null | undefined): string {
  if (!iso) return "";
  const raw = String(iso).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return raw;
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const [y, m, d] = raw.slice(0, 10).split("-");
    return `${d}/${m}/${y}`;
  }
  return raw;
}

export function parisTodayYmd(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function exitTestFormationKind(input: {
  course_type?: string | null;
  modality?: string | null;
}): "collective" | "individuelle" {
  const course = (input.course_type || "").toLowerCase();
  if (course.includes("collect")) return "collective";
  if (course.includes("individ")) return "individuelle";
  const mod = (input.modality || "").toLowerCase();
  if (mod.includes("collect") || mod.includes("groupe")) {
    return "collective";
  }
  return "individuelle";
}

export type InviteExitTestResult = {
  success: boolean;
  sent?: boolean;
  dryRun?: boolean;
  skipped?: boolean;
  already_completed?: boolean;
  already_invited?: boolean;
  to?: string;
  subject?: string;
  exit_test_id?: string | null;
  exit_test_link?: string;
  error?: string;
  message?: string;
};

export async function inviteExitTestForInscription(
  adminClient: SupabaseClient,
  inscriptionId: string,
  options: { dryRun?: boolean; resendApiKey?: string | null } = {}
): Promise<InviteExitTestResult> {
  const dryRun = options.dryRun === true;
  const resendApiKey = options.resendApiKey ?? Deno.env.get("RESEND_API_KEY");

  const { data: row, error: rowErr } = await adminClient
    .from("inscriptions")
    .select(
      "id, student_id, language, end_date, code, exit_test_id, exit_test_invited_at, status, course_type, modality"
    )
    .eq("id", inscriptionId)
    .maybeSingle();
  if (rowErr) throw rowErr;
  if (!row) {
    return { success: false, error: "Inscription introuvable" };
  }

  if (row.exit_test_invited_at) {
    return {
      success: true,
      skipped: true,
      already_invited: true,
      message: "Invitation déjà envoyée",
      exit_test_id: row.exit_test_id,
    };
  }

  const { data: student } = await adminClient
    .from("students")
    .select("email, first_name, last_name")
    .eq("id", row.student_id)
    .maybeSingle();

  const email = (student?.email || "").trim();
  if (!email || isFliPlaceholderEmail(email)) {
    return {
      success: false,
      error: `E-mail stagiaire invalide : ${email || "(vide)"}`,
    };
  }
  const studentName =
    [student?.first_name, student?.last_name].filter(Boolean).join(" ").trim() ||
    "Stagiaire";

  let testId = row.exit_test_id as string | null;
  let inviteToken: string | null = null;

  if (testId) {
    const { data: existing, error: existingErr } = await adminClient
      .from("placement_tests")
      .select("id, invite_token, completed_at")
      .eq("id", testId)
      .maybeSingle();
    if (existingErr) throw existingErr;
    if (existing?.completed_at) {
      return {
        success: false,
        already_completed: true,
        error: "Le test de fin est déjà complété — pas de nouvel envoi.",
      };
    }
    inviteToken = existing?.invite_token ?? null;
    if (!inviteToken && existing?.id) {
      const { data: refreshed, error: refreshErr } = await adminClient
        .from("placement_tests")
        .update({ invite_token: crypto.randomUUID() })
        .eq("id", existing.id)
        .select("invite_token")
        .single();
      if (refreshErr) throw refreshErr;
      inviteToken = refreshed.invite_token;
    }
  } else if (!dryRun) {
    const { data: created, error: createErr } = await adminClient
      .from("placement_tests")
      .insert({
        student_id: row.student_id,
        inscription_id: inscriptionId,
        language: row.language || "Anglais",
        status: "pending",
      })
      .select("id, invite_token")
      .single();
    if (createErr) throw createErr;
    testId = created.id;
    inviteToken = created.invite_token;
    const { error: linkErr } = await adminClient
      .from("inscriptions")
      .update({ exit_test_id: testId })
      .eq("id", inscriptionId);
    if (linkErr) throw linkErr;
  } else {
    inviteToken = "dry-run-token";
  }

  if (!inviteToken) {
    return {
      success: false,
      error: "Impossible d'obtenir le jeton du test de fin.",
    };
  }

  const template = await loadEmailTemplate(adminClient, "exit_test_invite");
  if (!template) {
    return {
      success: false,
      error:
        "Modèle exit_test_invite inactif ou absent — valider sur /admin/emails.",
    };
  }

  const exitTestLink = `${APP_URL.replace(/\/$/, "")}/exit-test/${inviteToken}`;
  const variables = {
    student_name: studentName,
    language: row.language || "formation",
    end_date: formatExitTestDateFr(row.end_date),
    exit_test_link: exitTestLink,
  };
  const rendered = renderEmailTemplate(template, variables);

  if (dryRun) {
    return {
      success: true,
      dryRun: true,
      sent: false,
      to: email,
      subject: rendered.subject,
      exit_test_id: testId,
      exit_test_link: exitTestLink,
      message: "dry_run — aucun e-mail envoyé",
    };
  }

  const send = await sendFliEmail({
    resendApiKey,
    to: email,
    subject: rendered.subject,
    html: rendered.html,
  });

  await adminClient.from("email_log").insert({
    template_slug: "exit_test_invite",
    recipient_email: email,
    recipient_name: studentName,
    status: send.ok ? "sent" : send.skipped ? "skipped" : "failed",
    error_message: send.ok ? null : (send.error || "").slice(0, 500),
    inscription_id: inscriptionId,
    variables_used: variables,
  });

  if (!send.ok) {
    return {
      success: false,
      error: send.error || "Échec Resend",
      skipped: send.skipped,
      exit_test_link: exitTestLink,
      exit_test_id: testId,
    };
  }

  await adminClient
    .from("inscriptions")
    .update({
      exit_test_invited_at: new Date().toISOString(),
    })
    .eq("id", inscriptionId);

  return {
    success: true,
    sent: true,
    to: email,
    subject: rendered.subject,
    exit_test_id: testId,
    exit_test_link: exitTestLink,
  };
}
