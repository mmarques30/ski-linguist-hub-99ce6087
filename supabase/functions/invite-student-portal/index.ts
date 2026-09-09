import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { adminCorsHeaders, requireAdmin } from "../_shared/admin-auth.ts";

const APP_URL = Deno.env.get("APP_URL") || "https://ski-linguist-hub.lovable.app";

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

async function ensureStudentAuthUser(
  adminClient: SupabaseClient,
  student: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    auth_user_id: string | null;
  }
): Promise<string> {
  if (student.auth_user_id) {
    return student.auth_user_id;
  }

  const fullName = `${student.first_name} ${student.last_name}`.trim();
  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email: student.email,
    email_confirm: true,
    user_metadata: { full_name: fullName, student_id: student.id },
  });

  let authUserId = created?.user?.id ?? null;

  if (createError) {
    const alreadyExists =
      createError.message.toLowerCase().includes("already") ||
      createError.message.toLowerCase().includes("registered");
    if (!alreadyExists) {
      throw new Error(createError.message);
    }

    const { data: usersPage, error: listError } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (listError) throw listError;
    const existing = usersPage.users.find(
      (u) => u.email?.toLowerCase() === student.email.toLowerCase()
    );
    if (!existing) {
      throw new Error("Utilisateur existant introuvable pour cet email");
    }
    authUserId = existing.id;
  }

  if (!authUserId) {
    throw new Error("Impossible de créer ou retrouver le compte portail");
  }

  await adminClient.from("students").update({ auth_user_id: authUserId }).eq("id", student.id);

  const { data: existingRole } = await adminClient
    .from("user_roles")
    .select("id")
    .eq("user_id", authUserId)
    .maybeSingle();

  if (!existingRole) {
    await adminClient.from("user_roles").insert({ user_id: authUserId, role: "student" });
  } else {
    await adminClient.from("user_roles").update({ role: "student" }).eq("user_id", authUserId);
  }

  await adminClient
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", authUserId);

  return authUserId;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: adminCorsHeaders });
  }

  try {
    const authResult = await requireAdmin(req);
    if (authResult instanceof Response) return authResult;
    const { adminClient } = authResult;

    const { studentIds, sendEmail: shouldSendEmail = true } = await req.json();

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "studentIds requis (tableau non vide)" }),
        { status: 400, headers: { ...adminCorsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const redirectTo = `${APP_URL.replace(/\/$/, "")}/student/dashboard`;
    const results: Array<{
      studentId: string;
      email: string;
      success: boolean;
      error?: string;
      emailSent?: boolean;
    }> = [];

    const { data: students, error: studentsError } = await adminClient
      .from("students")
      .select("id, email, first_name, last_name, auth_user_id")
      .in("id", studentIds);

    if (studentsError) throw studentsError;

    for (const studentId of studentIds) {
      const student = students?.find((s) => s.id === studentId);
      if (!student?.email) {
        results.push({
          studentId,
          email: student?.email || "",
          success: false,
          error: "Email manquant",
        });
        continue;
      }

      try {
        await ensureStudentAuthUser(adminClient, student);

        const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
          type: "magiclink",
          email: student.email,
          options: { redirectTo },
        });

        if (linkError || !linkData?.properties?.action_link) {
          throw new Error(linkError?.message || "Impossible de générer le lien de connexion");
        }

        const actionLink = linkData.properties.action_link;
        const studentName = `${student.first_name} ${student.last_name}`.trim();
        let emailSent = false;

        if (shouldSendEmail && resendApiKey) {
          const subject = "Votre espace stagiaire — France Langues International";
          const html = `<p>Bonjour ${studentName},</p>
            <p>Votre espace stagiaire FLI est prêt. Cliquez sur le lien ci-dessous pour y accéder :</p>
            <p><a href="${actionLink}">Accéder à mon espace stagiaire</a></p>
            <p>Ce lien est personnel et sécurisé. Si vous n'avez pas demandé cet accès, ignorez ce message.</p>
            <p>France Langues International</p>`;
          emailSent = await sendEmail(resendApiKey, student.email, subject, html);

          await adminClient.from("email_log").insert({
            template_slug: "student_portal_invite",
            recipient_email: student.email,
            recipient_name: studentName,
            status: emailSent ? "sent" : "failed",
            variables_used: { student_id: student.id },
          });
        }

        results.push({
          studentId: student.id,
          email: student.email,
          success: true,
          emailSent: shouldSendEmail ? emailSent : undefined,
        });
      } catch (error) {
        results.push({
          studentId: student.id,
          email: student.email,
          success: false,
          error: error instanceof Error ? error.message : "Erreur inconnue",
        });
      }
    }

    const succeeded = results.filter((r) => r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          total: results.length,
          succeeded,
          failed: results.length - succeeded,
          results,
        },
      }),
      { headers: { ...adminCorsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("invite-student-portal error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Erreur interne",
      }),
      { status: 500, headers: { ...adminCorsHeaders, "Content-Type": "application/json" } }
    );
  }
});
