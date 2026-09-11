import { adminCorsHeaders, requireAdmin } from "../_shared/admin-auth.ts";
import {
  applyEmailTemplate,
  FLI_TEST_RECIPIENT,
  sendFliEmail,
} from "../_shared/fli-email.ts";

/**
 * Envoi de test des deux modèles 8-minimal vers info@fli.fr.
 * Sans RESEND_API_KEY : refuse proprement, n'appelle pas Resend.
 * Les variables du corps sont fictives (ZZTEST / example.invalid).
 */
const TEST_VARIABLES_CONFIRMATION = {
  student_name: "ZZTEST Camille",
  language: "Anglais",
  start_date: "14 septembre 2026",
  end_date: "25 septembre 2026",
  inscription_code: "ZZTEST-0001",
};

const TEST_VARIABLES_INVITE = {
  student_name: "ZZTEST Camille",
  magic_link: "https://ski-linguist-hub.lovable.app/auth?mode=student",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: adminCorsHeaders });
  }

  try {
    const authResult = await requireAdmin(req);
    if (authResult instanceof Response) return authResult;
    const { adminClient } = authResult;

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          ready: true,
          sent: false,
          error:
            "RESEND_API_KEY absente. Posez la clé dans les secrets de la fonction, puis relancez. Aucun email n'est parti.",
        }),
        { status: 409, headers: { ...adminCorsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: confirmation } = await adminClient
      .from("email_templates")
      .select("subject_fr, body_fr")
      .eq("slug", "inscription_confirmation")
      .maybeSingle();
    const { data: invite } = await adminClient
      .from("email_templates")
      .select("subject_fr, body_fr")
      .eq("slug", "student_portal_invite")
      .maybeSingle();

    if (!confirmation || !invite) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Modèles inscription_confirmation ou student_portal_invite introuvables.",
        }),
        { status: 500, headers: { ...adminCorsHeaders, "Content-Type": "application/json" } }
      );
    }

    const confirmationSubject = applyEmailTemplate(
      confirmation.subject_fr,
      TEST_VARIABLES_CONFIRMATION
    );
    const confirmationHtml = applyEmailTemplate(
      confirmation.body_fr,
      TEST_VARIABLES_CONFIRMATION
    );
    const inviteSubject = applyEmailTemplate(invite.subject_fr, TEST_VARIABLES_INVITE);
    const inviteHtml = applyEmailTemplate(invite.body_fr, TEST_VARIABLES_INVITE);

    const first = await sendFliEmail({
      resendApiKey,
      to: FLI_TEST_RECIPIENT,
      subject: `[TEST] ${confirmationSubject}`,
      html: confirmationHtml,
    });
    const second = await sendFliEmail({
      resendApiKey,
      to: FLI_TEST_RECIPIENT,
      subject: `[TEST] ${inviteSubject}`,
      html: inviteHtml,
    });

    await adminClient.from("email_log").insert([
      {
        template_slug: "inscription_confirmation",
        recipient_email: FLI_TEST_RECIPIENT,
        recipient_name: "TEST FLI",
        status: first.ok ? "sent" : "failed",
        variables_used: { test: true, ...TEST_VARIABLES_CONFIRMATION },
      },
      {
        template_slug: "student_portal_invite",
        recipient_email: FLI_TEST_RECIPIENT,
        recipient_name: "TEST FLI",
        status: second.ok ? "sent" : "failed",
        variables_used: { test: true, student_name: TEST_VARIABLES_INVITE.student_name },
      },
    ]);

    const ok = first.ok && second.ok;
    return new Response(
      JSON.stringify({
        success: ok,
        sent: ok,
        recipient: FLI_TEST_RECIPIENT,
        confirmation: first,
        invite: second,
      }),
      {
        status: ok ? 200 : 502,
        headers: { ...adminCorsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Erreur interne",
      }),
      { status: 500, headers: { ...adminCorsHeaders, "Content-Type": "application/json" } }
    );
  }
});
