/**
 * Mail Paul Schroeder (DT ESF Val d'Isère) — texte à transmettre aux moniteurs.
 * Validé Paula 2026-10-21. BCC info@fli.fr. SEND=1 pour envoyer.
 *
 *   SEND=1 ./node_modules/.bin/tsx scripts/send-paul-schroeder-val-disere.mts
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const OUT = "/opt/cursor/artifacts/paul-schroeder-val-disere-2026-10";
const BCC = "info@fli.fr";
const TO = "paul.schroeder@wanadoo.fr";
const SUBJECT =
  "Stages FLI à Val d'Isère — texte à transmettre à tes moniteurs";

const BODY_TEXT = `Bonjour Paul,

On ne s'est pas croisés à Valence, alors je me permets de t'écrire directement. Deux stages de langues FLI se déroulent à Val d'Isère cette pré-saison :

- Portugais brésilien — 23 au 27 novembre 2026 — 800 € pour vos moniteurs ESF Val d'Isère (900 € pour les autres écoles)
- Anglais — 30 novembre au 4 décembre 2026 — 800 € pour vos moniteurs ESF Val d'Isère (900 € pour les autres écoles)

Est-ce que tu peux transmettre le texte ci-dessous à tes moniteurs ? Il est prêt à copier-coller. On accompagne chaque inscription de A à Z, y compris le dossier FIFPL.

Bien à toi,
Paula
FLI — France Langues International
info@fli.fr · 04 79 28 21 09

---

Texte à transmettre

Bonjour,

Deux stages de langues FLI — France Langues International ont lieu à Val d'Isère avant la saison :

- Portugais brésilien — 23 au 27 novembre 2026 (24 h) — 800 € pour les moniteurs de l'ESF Val d'Isère, 900 € pour les autres écoles
- Anglais — 30 novembre au 4 décembre 2026 (24 h) — 800 € pour les moniteurs de l'ESF Val d'Isère, 900 € pour les autres écoles

Salle mise à disposition par l'ESF. Une semaine pour être plus à l'aise avec vos clients étrangers dès l'ouverture.

Inscription : https://www.fli.fr/register
(Choisissez « ESF Val d'Isère » comme école : le tarif 800 € s'affiche automatiquement.)

Le FIFPL peut financer l'essentiel

Les langues sont une formation cœur de métier. Plafond : 300 € par jour, 900 € par an. FLI est certifiée Qualiopi, exonérée de TVA.

- Indépendant au réel : prise en charge à 100 % de ces critères. Sans autre financement FIFPL en 2026, un stage à 800 € peut être couvert en totalité.
- Micro-entrepreneur : selon la cotisation CFP de votre attestation URSSAF. Le FIFPL a relevé le barème. À partir de 81 € de cotisation, c'est 100 % (900 €).

Cotisation CFP | Prise en charge | Droits sur 900 €
1 à 20 € | 20 % | 180 €
21 à 40 € | 60 % | 540 €
41 à 80 € | 80 % | 720 €
À partir de 81 € | 100 % | 900 €

L'équipe FLI vous accompagne de A à Z : inscription, pièces, dépôt de la demande FIFPL. Vous n'êtes pas seul avec le dossier.

Payer sans avancer beaucoup

À l'inscription : un acompte de 150 €, puis un chèque du solde (650 € au tarif ESF Val d'Isère, 750 € au tarif 900 €). Nous n'encaissons ce chèque qu'après la formation. Vous pouvez demander un délai d'encaissement si besoin.

Je réserve ma place : https://www.fli.fr/register

Questions : info@fli.fr ou 04 79 28 21 09.

L'équipe FLI`;

const BODY_HTML = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#222">
<p>Bonjour Paul,</p>
<p>On ne s'est pas croisés à Valence, alors je me permets de t'écrire directement. Deux stages de langues FLI se déroulent à Val d'Isère cette pré-saison&nbsp;:</p>
<ul>
<li>Portugais brésilien — 23 au 27 novembre 2026 — <strong>800&nbsp;€</strong> pour vos moniteurs ESF Val d'Isère (900&nbsp;€ pour les autres écoles)</li>
<li>Anglais — 30 novembre au 4 décembre 2026 — <strong>800&nbsp;€</strong> pour vos moniteurs ESF Val d'Isère (900&nbsp;€ pour les autres écoles)</li>
</ul>
<p>Est-ce que tu peux transmettre le texte ci-dessous à tes moniteurs&nbsp;? Il est prêt à copier-coller. On accompagne chaque inscription de A à Z, y compris le dossier FIFPL.</p>
<p>Bien à toi,<br/>
Paula<br/>
FLI — France Langues International<br/>
<a href="mailto:info@fli.fr">info@fli.fr</a> · 04 79 28 21 09</p>
<hr style="border:none;border-top:1px solid #ddd;margin:24px 0"/>
<p><strong>Texte à transmettre</strong></p>
<p>Bonjour,</p>
<p>Deux stages de langues FLI — France Langues International ont lieu à Val d'Isère avant la saison&nbsp;:</p>
<ul>
<li>Portugais brésilien — 23 au 27 novembre 2026 (24&nbsp;h) — <strong>800&nbsp;€</strong> pour les moniteurs de l'ESF Val d'Isère, 900&nbsp;€ pour les autres écoles</li>
<li>Anglais — 30 novembre au 4 décembre 2026 (24&nbsp;h) — <strong>800&nbsp;€</strong> pour les moniteurs de l'ESF Val d'Isère, 900&nbsp;€ pour les autres écoles</li>
</ul>
<p>Salle mise à disposition par l'ESF. Une semaine pour être plus à l'aise avec vos clients étrangers dès l'ouverture.</p>
<p>Inscription&nbsp;: <a href="https://www.fli.fr/register">https://www.fli.fr/register</a><br/>
(Choisissez «&nbsp;ESF Val d'Isère&nbsp;» comme école&nbsp;: le tarif 800&nbsp;€ s'affiche automatiquement.)</p>
<p><strong>Le FIFPL peut financer l'essentiel</strong></p>
<p>Les langues sont une formation cœur de métier. Plafond&nbsp;: 300&nbsp;€ par jour, 900&nbsp;€ par an. FLI est certifiée Qualiopi, exonérée de TVA.</p>
<ul>
<li><strong>Indépendant au réel</strong>&nbsp;: prise en charge à 100&nbsp;% de ces critères. Sans autre financement FIFPL en 2026, un stage à 800&nbsp;€ peut être couvert en totalité.</li>
<li><strong>Micro-entrepreneur</strong>&nbsp;: selon la cotisation CFP de votre attestation URSSAF. Le FIFPL a relevé le barème. À partir de 81&nbsp;€ de cotisation, c'est 100&nbsp;% (900&nbsp;€).</li>
</ul>
<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 16px;font-size:14px;width:100%;max-width:520px">
<tr>
<th align="left" style="border-bottom:1px solid #ccc;padding:6px 8px">Cotisation CFP</th>
<th align="left" style="border-bottom:1px solid #ccc;padding:6px 8px">Prise en charge</th>
<th align="left" style="border-bottom:1px solid #ccc;padding:6px 8px">Droits sur 900&nbsp;€</th>
</tr>
<tr>
<td style="padding:6px 8px">1 à 20&nbsp;€</td>
<td style="padding:6px 8px">20&nbsp;%</td>
<td style="padding:6px 8px">180&nbsp;€</td>
</tr>
<tr>
<td style="padding:6px 8px;background:#f7f7f7">21 à 40&nbsp;€</td>
<td style="padding:6px 8px;background:#f7f7f7">60&nbsp;%</td>
<td style="padding:6px 8px;background:#f7f7f7">540&nbsp;€</td>
</tr>
<tr>
<td style="padding:6px 8px">41 à 80&nbsp;€</td>
<td style="padding:6px 8px">80&nbsp;%</td>
<td style="padding:6px 8px">720&nbsp;€</td>
</tr>
<tr>
<td style="padding:6px 8px;background:#f7f7f7"><strong>À partir de 81&nbsp;€</strong></td>
<td style="padding:6px 8px;background:#f7f7f7"><strong>100&nbsp;%</strong></td>
<td style="padding:6px 8px;background:#f7f7f7"><strong>900&nbsp;€</strong></td>
</tr>
</table>
<p>L'équipe FLI vous accompagne de A à Z&nbsp;: inscription, pièces, dépôt de la demande FIFPL. Vous n'êtes pas seul avec le dossier.</p>
<p><strong>Payer sans avancer beaucoup</strong></p>
<p>À l'inscription&nbsp;: un acompte de 150&nbsp;€, puis un chèque du solde (650&nbsp;€ au tarif ESF Val d'Isère, 750&nbsp;€ au tarif 900&nbsp;€). Nous n'encaissons ce chèque qu'après la formation. Vous pouvez demander un délai d'encaissement si besoin.</p>
<p><strong>Je réserve ma place&nbsp;:</strong> <a href="https://www.fli.fr/register">https://www.fli.fr/register</a></p>
<p>Questions&nbsp;: <a href="mailto:info@fli.fr">info@fli.fr</a> ou 04 79 28 21 09.</p>
<p>L'équipe FLI</p>
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
      "User-Agent": "FLI-Formation/paul-schroeder-val-disere",
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
