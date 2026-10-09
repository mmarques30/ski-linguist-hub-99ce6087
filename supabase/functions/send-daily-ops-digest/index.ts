/**
 * Digest ops matinal → info@fli.fr (dossiers + actions).
 * Cron : 0 6 * * * (≈ 7h/8h Europe/Paris selon saison).
 * ?dry_run=true : calcule sans envoyer.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendFliEmail } from "../_shared/fli-email.ts";
import {
  buildDailyOpsDigest,
  formatDailyOpsDigestHtml,
  formatDailyOpsDigestSubject,
  type DigestInscriptionRow,
} from "../_shared/daily-ops-digest.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "info@fli.fr";
const LOOKBACK_DAYS = 45;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const dryRun = url.searchParams.get("dry_run") === "true";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!dryRun && !resendApiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "RESEND_API_KEY absente — utiliser ?dry_run=true",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - LOOKBACK_DAYS);

    const { data: inscriptions, error } = await supabase
      .from("inscriptions")
      .select(
        `
        id,
        code,
        status,
        created_at,
        start_date,
        end_date,
        course_location,
        modality,
        language,
        funding_organization,
        payment_method,
        price,
        deposit_amount,
        balance_after_deposit,
        documents_sent_at,
        students!inscriptions_student_id_fkey (
          first_name,
          last_name,
          email
        )
      `,
      )
      .gte("created_at", since.toISOString())
      .like("code", "FLI-%")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw error;

    const ids = (inscriptions || []).map((i) => i.id);
    const { data: payments, error: payErr } = await supabase
      .from("payments")
      .select("inscription_id, amount, status, payment_type, payment_method")
      .in("inscription_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    if (payErr) throw payErr;

    const payByInscription = new Map<string, typeof payments>();
    for (const p of payments || []) {
      const list = payByInscription.get(p.inscription_id) || [];
      list.push(p);
      payByInscription.set(p.inscription_id, list);
    }

    const rows: DigestInscriptionRow[] = (inscriptions || []).map((raw) => {
      const studentRaw = (raw as { students?: Record<string, unknown> | null })
        .students;
      const pays = payByInscription.get(raw.id) || [];
      let amount_received = 0;
      let deposit_received = 0;
      let amount_pending = 0;
      let cheque_pending = 0;
      for (const p of pays) {
        const amount = Number(p.amount) || 0;
        const status = (p.status || "").toLowerCase();
        if (status === "recu" || status === "valide") {
          amount_received += amount;
          if ((p.payment_type || "").toLowerCase() === "acompte" || amount === 150) {
            deposit_received += amount;
          }
        } else if (status === "en_attente") {
          amount_pending += amount;
          if ((p.payment_method || "").toLowerCase().includes("cheque")) {
            cheque_pending += amount;
          }
        }
      }
      return {
        id: raw.id,
        code: raw.code,
        status: raw.status,
        created_at: raw.created_at,
        start_date: raw.start_date,
        end_date: raw.end_date,
        course_location: raw.course_location,
        modality: raw.modality,
        language: raw.language,
        funding_organization: raw.funding_organization,
        payment_method: raw.payment_method,
        price: raw.price != null ? Number(raw.price) : null,
        deposit_amount: raw.deposit_amount != null ? Number(raw.deposit_amount) : null,
        balance_after_deposit:
          raw.balance_after_deposit != null
            ? Number(raw.balance_after_deposit)
            : null,
        documents_sent_at: raw.documents_sent_at,
        first_name: String(studentRaw?.first_name || ""),
        last_name: String(studentRaw?.last_name || ""),
        email: String(studentRaw?.email || ""),
        amount_received,
        deposit_received,
        amount_pending,
        cheque_pending,
      };
    });

    const digest = buildDailyOpsDigest(rows);
    const subject = formatDailyOpsDigestSubject(digest);
    const html = formatDailyOpsDigestHtml(digest);

    if (dryRun) {
      return new Response(
        JSON.stringify({
          success: true,
          dry_run: true,
          subject,
          actions: digest.actions,
          newLast24h: digest.newLast24h.map((r) => r.code),
          activeCount: digest.active.length,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const sent = await sendFliEmail({
      resendApiKey,
      to: ADMIN_EMAIL,
      subject,
      html,
    });

    await supabase.from("email_log").insert({
      template_slug: "daily_ops_digest",
      recipient_email: ADMIN_EMAIL,
      recipient_name: "Paula / FLI",
      status: sent.ok ? "sent" : sent.skipped ? "skipped" : "failed",
      error_message: sent.error ?? null,
      variables_used: {
        subject,
        actions_count: digest.actions.length,
        high_priority: digest.actions.filter((a) => a.priority === "haute").length,
        new_24h: digest.newLast24h.map((r) => r.code),
        active_count: digest.active.length,
      },
    });

    return new Response(
      JSON.stringify({
        success: sent.ok,
        skipped: sent.skipped,
        error: sent.error,
        subject,
        actions_count: digest.actions.length,
      }),
      {
        status: sent.ok || sent.skipped ? 200 : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("send-daily-ops-digest", message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
