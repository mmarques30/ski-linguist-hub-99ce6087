/**
 * Mail Seb (Sébastien Baud, ESF Samoëns) — stage portugais 3 groupes + forfait.
 * Validé Paula 2026-10-21. BCC info@fli.fr. SEND=1 pour envoyer.
 *
 *   SEND=1 ./node_modules/.bin/tsx scripts/send-seb-samoens-portugais-3-groupes.mts
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const OUT = "/opt/cursor/artifacts/seb-samoens-portugais-2026-10";
const BCC = "info@fli.fr";
const TO = "direction@esfsamoens.com";
const SUBJECT =
  "Portugais Samoëns — 3 groupes avec Tulio + proposition 4 200 €";

const BODY_TEXT = `Bonjour Seb,

J'ai pu voir avec Tulio : oui, on pourra faire 3 groupes pour le stage de portugais à Samoëns (14–18 décembre) :

- 1 groupe de 3 h le matin — 8 h–11 h
- 1 groupe de 2 h — 11 h 15–13 h 15
- 1 groupe de 3 h — 14 h 30–17 h 30

Idéalement en haut. On cherche une solution de transport, mais ça se trouve que les moniteurs devront monter et descendre Tulio : il n'aura pas de voiture pour la semaine. Je le dépose à Samoëns le dimanche et je viens le chercher le samedi.

Pour 22 stagiaires, j'ai tout le matériel à imprimer.

Je te propose donc une petite rallonge par rapport à ce qu'on avait accordé : 4 200 €, soit 200 € / moniteur, + le dossier de Nicole chez le FIFPL (900 €).
Ça nous fait une semaine à 5 100 €, et une facture pour vous de 4 200 €.

Dis-moi si ça te va, et on verrouille les salles / le logement avec cuisine + forfait de ski comme prévu.

Bien à toi,
Paula
FLI — France Langues International
info@fli.fr · 04 79 28 21 09`;

const BODY_HTML = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#222">
<p>Bonjour Seb,</p>
<p>J'ai pu voir avec Tulio&nbsp;: oui, on pourra faire <strong>3 groupes</strong> pour le stage de portugais à Samoëns (14–18 décembre)&nbsp;:</p>
<ul>
<li>1 groupe de 3&nbsp;h le matin — <strong>8&nbsp;h–11&nbsp;h</strong></li>
<li>1 groupe de 2&nbsp;h — <strong>11&nbsp;h&nbsp;15–13&nbsp;h&nbsp;15</strong></li>
<li>1 groupe de 3&nbsp;h — <strong>14&nbsp;h&nbsp;30–17&nbsp;h&nbsp;30</strong></li>
</ul>
<p>Idéalement en haut. On cherche une solution de transport, mais ça se trouve que les moniteurs devront monter et descendre Tulio&nbsp;: il n'aura pas de voiture pour la semaine. Je le dépose à Samoëns le dimanche et je viens le chercher le samedi.</p>
<p>Pour <strong>22 stagiaires</strong>, j'ai tout le matériel à imprimer.</p>
<p>Je te propose donc une petite rallonge par rapport à ce qu'on avait accordé&nbsp;: <strong>4&nbsp;200&nbsp;€</strong>, soit <strong>200&nbsp;€ / moniteur</strong>, <strong>+ le dossier de Nicole chez le FIFPL (900&nbsp;€)</strong>.<br/>
Ça nous fait une semaine à <strong>5&nbsp;100&nbsp;€</strong>, et une facture pour vous de <strong>4&nbsp;200&nbsp;€</strong>.</p>
<p>Dis-moi si ça te va, et on verrouille les salles / le logement avec cuisine + forfait de ski comme prévu.</p>
<p>Bien à toi,<br/>
Paula<br/>
FLI — France Langues International<br/>
<a href="mailto:info@fli.fr">info@fli.fr</a> · 04 79 28 21 09</p>
</div>`;

async function main() {
  const doSend = process.env.SEND === "1";
  const apiKey = process.env.RESEND_API_KEY;
  await mkdir(OUT, { recursive: true });

  const draft = {
    to: TO,
    bcc: BCC,
    subject: SUBJECT,
    body_text: BODY_TEXT,
    dry_run: !doSend,
    prepared_at: new Date().toISOString(),
  };
  await writeFile(join(OUT, "send-draft.json"), JSON.stringify(draft, null, 2));
  await writeFile(join(OUT, "body.txt"), BODY_TEXT);
  await writeFile(join(OUT, "body.html"), BODY_HTML);

  if (!doSend) {
    console.log("DRY_RUN — aucun envoi. Relancer avec SEND=1");
    return;
  }
  if (!apiKey) throw new Error("RESEND_API_KEY absente");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "FLI-Formation/seb-samoens-portugais-3-groupes",
    },
    body: JSON.stringify({
      from: "FLI — France Langues International <noreply@fli.fr>",
      to: [TO],
      bcc: [BCC],
      reply_to: ["info@fli.fr"],
      subject: SUBJECT,
      text: BODY_TEXT,
      html: BODY_HTML,
    }),
  });

  const text = await response.text();
  await writeFile(join(OUT, "resend-response.json"), text);
  if (!response.ok) {
    throw new Error(`Resend ${response.status}: ${text}`);
  }

  let resendId: string | null = null;
  try {
    resendId = JSON.parse(text)?.id ?? null;
  } catch {
    /* ignore */
  }

  const sent = {
    ...draft,
    dry_run: false,
    sent_at: new Date().toISOString(),
    resend_id: resendId,
    resend_status: response.status,
  };
  await writeFile(join(OUT, "send-result.json"), JSON.stringify(sent, null, 2));
  console.log(JSON.stringify(sent, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
