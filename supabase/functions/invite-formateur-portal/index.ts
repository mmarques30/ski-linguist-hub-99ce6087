import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { adminCorsHeaders, requireAdmin } from "../_shared/admin-auth.ts";
import { applyEmailTemplate, sendFliEmail } from "../_shared/fli-email.ts";
import {
  isFliPlaceholderEmail,
  isMassSendConfirmed,
} from "../_shared/email-guards.ts";

const APP_URL = Deno.env.get("APP_URL") || "https://ski-linguist-hub.lovable.app";

async function ensureFormateurAuthUser(
  adminClient: SupabaseClient,
  instructor: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string;
    auth_user_id: string | null;
  }
): Promise<string> {
  if (instructor.auth_user_id) {
    return instructor.auth_user_id;
  }

  const fullName = `${instructor.first_name ?? ""} ${instructor.last_name}`.trim();
  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email: instructor.email,
    email_confirm: true,
    user_metadata: { full_name: fullName, instructor_id: instructor.id },
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
      (u) => u.email?.toLowerCase() === instructor.email.toLowerCase()
    );
    if (!existing) {
      throw new Error("Utilisateur existant introuvable pour cet email");
    }
    authUserId = existing.id;
  }

  if (!authUserId) {
    throw new Error("Impossible de créer ou retrouver le compte portail");
  }

  await adminClient
    .from("instructors")
    .update({ auth_user_id: authUserId })
    .eq("id", instructor.id)
    .is("auth_user_id", null);

  const { data: existingRole } = await adminClient
    .from("user_roles")
    .select("id")
    .eq("user_id", authUserId)
    .maybeSingle();

  if (!existingRole) {
    await adminClient.from("user_roles").insert({ user_id: authUserId, role: "formateur" });
  } else {
    await adminClient.from("user_roles").update({ role: "formateur" }).eq("user_id", authUserId);
  }

  await adminClient.from("profiles").update({ full_name: fullName }).eq("id", authUserId);

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

    const {
      instructorIds,
      sendEmail: shouldSendEmail = true,
      confirmedCount,
    } = await req.json();

    if (!Array.isArray(instructorIds) || instructorIds.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "instructorIds requis (tableau non vide)" }),
        { status: 400, headers: { ...adminCorsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!isMassSendConfirmed(instructorIds.length, confirmedCount)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Confirmation de masse requise : indiquez confirmedCount = ${instructorIds.length}`,
        }),
        { status: 400, headers: { ...adminCorsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const redirectTo = `${APP_URL.replace(/\/$/, "")}/formateur/tableau-de-bord`;
    const results: Array<{
      instructorId: string;
      email: string;
      success: boolean;
      error?: string;
      emailSent?: boolean;
    }> = [];

    const { data: instructors, error: instructorsError } = await adminClient
      .from("instructors")
      .select("id, email, first_name, last_name, auth_user_id")
      .in("id", instructorIds);

    if (instructorsError) throw instructorsError;

    for (const instructorId of instructorIds) {
      const instructor = instructors?.find((i) => i.id === instructorId);
      if (!instructor?.email) {
        results.push({
          instructorId,
          email: instructor?.email || "",
          success: false,
          error: "Email manquant",
        });
        continue;
      }

      if (isFliPlaceholderEmail(instructor.email)) {
        results.push({
          instructorId,
          email: instructor.email,
          success: false,
          error: "Adresse @fli.placeholder exclue de tout envoi",
        });
        continue;
      }

      try {
        await ensureFormateurAuthUser(adminClient, instructor);

        const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
          type: "magiclink",
          email: instructor.email,
          options: { redirectTo },
        });

        if (linkError || !linkData?.properties?.action_link) {
          throw new Error(linkError?.message || "Impossible de générer le lien de connexion");
        }

        const actionLink = linkData.properties.action_link;
        const formateurName = `${instructor.first_name ?? ""} ${instructor.last_name}`.trim();
        let emailSent = false;

        if (shouldSendEmail) {
          const { data: template } = await adminClient
            .from("email_templates")
            .select("subject_fr, body_fr")
            .eq("slug", "formateur_portal_invite")
            .eq("is_active", true)
            .maybeSingle();

          const variables = {
            formateur_name: formateurName,
            magic_link: actionLink,
            link_expiry_label: "1 heure",
          };
          const subject = template
            ? applyEmailTemplate(template.subject_fr, variables)
            : "Accès à votre espace formateur — France Langues International";
          const html = template
            ? applyEmailTemplate(template.body_fr, variables)
            : `<p>Bonjour ${formateurName},</p><p><a href="${actionLink}">Accéder à mon espace formateur</a></p>`;

          const sent = await sendFliEmail({
            resendApiKey,
            to: instructor.email,
            subject,
            html,
          });
          emailSent = sent.ok;

          await adminClient.from("email_log").insert({
            template_slug: "formateur_portal_invite",
            recipient_email: instructor.email,
            recipient_name: formateurName,
            status: sent.skipped ? "skipped" : emailSent ? "sent" : "failed",
            variables_used: { instructor_id: instructor.id },
          });
        }

        results.push({
          instructorId: instructor.id,
          email: instructor.email,
          success: true,
          emailSent: shouldSendEmail ? emailSent : undefined,
        });
      } catch (error) {
        results.push({
          instructorId: instructor.id,
          email: instructor.email,
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
    console.error("invite-formateur-portal error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Erreur interne",
      }),
      { status: 500, headers: { ...adminCorsHeaders, "Content-Type": "application/json" } }
    );
  }
});
