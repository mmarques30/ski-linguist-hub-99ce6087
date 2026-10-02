import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendFliEmail } from "../_shared/fli-email.ts";

const TO = "marc.testut@gmail.com";
const INS = "bb221792-3fa6-4106-ae94-8dffcbaf33d6";
const SUBJECT = "FLI-260020 — Dossier AGEFICE : documents à nous retourner";
const HTML = `<p>Bonjour Marc,</p>
<p>Nous vous confirmons la bonne réception de votre règlement de <strong>150 €</strong> de frais de dossier pour votre formation en russe du 30 novembre au 4 décembre 2026 (FLI-260020). Merci !</p>
<p>Vous avez reçu dans un e-mail séparé votre dossier de formation : convention, programme, demande de prise en charge AGEFICE et liste des pièces justificatives.</p>
<p>Merci de nous retourner ces documents <strong>remplis et signés</strong>, en particulier la <strong>demande de prise en charge AGEFICE</strong>, afin que nous puissions déposer votre demande de financement.</p>
<ul>
<li>Plafonds de prise en charge 2026 : <a href="https://communication-agefice.fr/plafonds-financiers-annee-2026/">https://communication-agefice.fr/plafonds-financiers-annee-2026/</a></li>
<li>Dépôt auprès du Point d'accueil AGEFICE : <strong>au plus tard le 15/11/2026</strong></li>
<li>Solde de <strong>800 €</strong> à régler par chèque avant le début de la formation (à l'ordre de France Langues International, 25 avenue de la Gare, 73800 Montmélian)</li>
</ul>
<p>Je reste à votre disposition pour toute question.</p>
<p>Paula Rangel Halbwachs<br/>FLI — France Langues International<br/>info@fli.fr — 04 79 28 21 09</p>`;

Deno.serve(async () => {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const r = await sendFliEmail({ resendApiKey: Deno.env.get("RESEND_API_KEY"), to: TO, subject: SUBJECT, html: HTML } as never);
  const { data } = await supabase.from("email_log").insert({
    template_slug: "agefice_pack_instructions", recipient_email: TO, recipient_name: "Marc Testut",
    status: r.ok ? "sent" : "failed", inscription_id: INS, variables_used: { subject: SUBJECT },
    error_message: r.ok ? null : JSON.stringify(r),
  }).select("id").single();
  return new Response(JSON.stringify({ result: r, email_log_id: data?.id }), { headers: { "Content-Type": "application/json" } });
});
