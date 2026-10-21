/**
 * Mail personnel — directeur technique ESF Saint-Lary-Soulan
 * (validé Paula 2026-10-21). BCC info@fli.fr. SEND=1 pour envoyer.
 *
 *   SEND=1 ./node_modules/.bin/tsx scripts/send-saint-lary-technique-valence.mts
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const OUT = "/opt/cursor/artifacts/saint-lary-technique-2026-10";
const BCC = "info@fli.fr";
const TO = "technique@esf-stlary.com";
const SUBJECT =
  "Suite à notre échange à Valence — formations anglais & espagnol (Saint-Lary et environs)";

const BODY_TEXT = `Bonjour,

Merci d'être passé nous voir à Valence. J'ai beaucoup apprécié notre échange, et votre intérêt pour monter des formations en anglais et en espagnol avec les stations autour de Saint-Lary-Soulan.

Je me permets de vous présenter rapidement FLI — France Langues International. Nous formons les moniteurs de ski aux langues étrangères (anglais, espagnol, portugais brésilien, néerlandais, russe…), en présentiel en station et en ligne le soir. Nous sommes certifiés Qualiopi, et les stages sont éligibles au FIFPL pour les indépendants et les micro-entrepreneurs.

Deux formules, selon ce qui vous arrange :

- En présentiel. Une semaine en station (24 h). On peut organiser un stage chez vous, ou le mutualiser avec les ESF voisines pour atteindre un groupe confortable. Le tarif suit la logistique : plus l'école accueillante met à disposition (salle, logement), plus le tarif est avantageux pour vos moniteurs.
- En ligne, le soir. Huit séances de 3 h, après la journée. Idéal quand les déplacements sont longs — ce qui est souvent le cas depuis les Pyrénées. L'espagnol en ligne commence le 27 octobre, l'anglais le 3 novembre.

Le FIFPL, en bref

Les langues étrangères sont une formation cœur de métier pour les moniteurs de ski. Le plafond FIFPL est de 300 € par jour et 900 € par an.

- Indépendant au réel : prise en charge à 100 % de ces critères. Sans autre financement FIFPL en 2026, un stage au plafond peut être couvert en totalité.
- Micro-entrepreneur : les mêmes plafonds, appliqués en pourcentage selon la cotisation CFP figurant sur l'attestation URSSAF (versement 2025 pour une formation 2026). Le FIFPL a relevé ce barème. À partir de 81 € de cotisation, la prise en charge est de 100 %.

Cotisation CFP | Prise en charge | Droits sur le plafond de 900 €
1 à 20 € | 20 % | 180 €
21 à 40 € | 60 % | 540 €
41 à 80 € | 80 % | 720 €
À partir de 81 € | 100 % | 900 €

Exemple : avec 50 € de cotisation, 720 € de droits. Dès 81 €, 900 €. Une prise en charge déjà accordée en 2026 vient en déduction. Seul l'accord du FIFPL fait foi.

Nous accompagnons chaque moniteur de A à Z sur le dossier : inscription, pièces, dépôt de la demande. Pour le paiement, un acompte suffit à l'inscription ; le solde part par chèque, que nous n'encaissons qu'après la formation. Sans chéquier, un paiement en trois fois est possible.

Pour l'anglais et l'espagnol autour de Saint-Lary, on peut regarder ensemble ce qui est le plus réaliste cette saison : un stage local, un regroupement avec les stations voisines, ou une entrée par les cours du soir en attendant un présentiel.

Les inscriptions individuelles sont déjà ouvertes : https://www.fli.fr/register
Et pour un projet d'école ou inter-écoles, je préfère en parler avec vous directement.

Dites-moi un créneau qui vous convient pour un appel rapide, ou répondez simplement à ce message avec ce qui vous intéresse en premier (anglais, espagnol, présentiel, en ligne). On trouve une solution adaptée à votre secteur.

Bien à vous,
Paula
FLI — France Langues International
25 avenue de la Gare — 73800 Montmélian
Tél. : 04 79 28 21 09
info@fli.fr`;

const BODY_HTML = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#222">
<p>Bonjour,</p>
<p>Merci d'être passé nous voir à Valence. J'ai beaucoup apprécié notre échange, et votre intérêt pour monter des formations en anglais et en espagnol avec les stations autour de Saint-Lary-Soulan.</p>
<p>Je me permets de vous présenter rapidement FLI — France Langues International. Nous formons les moniteurs de ski aux langues étrangères (anglais, espagnol, portugais brésilien, néerlandais, russe…), en présentiel en station et en ligne le soir. Nous sommes certifiés Qualiopi, et les stages sont éligibles au FIFPL pour les indépendants et les micro-entrepreneurs.</p>
<p>Deux formules, selon ce qui vous arrange&nbsp;:</p>
<ul>
<li><strong>En présentiel.</strong> Une semaine en station (24&nbsp;h). On peut organiser un stage chez vous, ou le mutualiser avec les ESF voisines pour atteindre un groupe confortable. Le tarif suit la logistique&nbsp;: plus l'école accueillante met à disposition (salle, logement), plus le tarif est avantageux pour vos moniteurs.</li>
<li><strong>En ligne, le soir.</strong> Huit séances de 3&nbsp;h, après la journée. Idéal quand les déplacements sont longs — ce qui est souvent le cas depuis les Pyrénées. L'espagnol en ligne commence le 27&nbsp;octobre, l'anglais le 3&nbsp;novembre.</li>
</ul>
<p><strong>Le FIFPL, en bref</strong></p>
<p>Les langues étrangères sont une formation cœur de métier pour les moniteurs de ski. Le plafond FIFPL est de 300&nbsp;€ par jour et 900&nbsp;€ par an.</p>
<ul>
<li><strong>Indépendant au réel</strong>&nbsp;: prise en charge à 100&nbsp;% de ces critères. Sans autre financement FIFPL en 2026, un stage au plafond peut être couvert en totalité.</li>
<li><strong>Micro-entrepreneur</strong>&nbsp;: les mêmes plafonds, appliqués en pourcentage selon la cotisation CFP figurant sur l'attestation URSSAF (versement 2025 pour une formation 2026). Le FIFPL a relevé ce barème. À partir de 81&nbsp;€ de cotisation, la prise en charge est de 100&nbsp;%.</li>
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
<p>Exemple&nbsp;: avec 50&nbsp;€ de cotisation, 720&nbsp;€ de droits. Dès 81&nbsp;€, 900&nbsp;€. Une prise en charge déjà accordée en 2026 vient en déduction. Seul l'accord du FIFPL fait foi.</p>
<p>Nous accompagnons chaque moniteur de A à Z sur le dossier&nbsp;: inscription, pièces, dépôt de la demande. Pour le paiement, un acompte suffit à l'inscription&nbsp;; le solde part par chèque, que nous n'encaissons qu'après la formation. Sans chéquier, un paiement en trois fois est possible.</p>
<p>Pour l'anglais et l'espagnol autour de Saint-Lary, on peut regarder ensemble ce qui est le plus réaliste cette saison&nbsp;: un stage local, un regroupement avec les stations voisines, ou une entrée par les cours du soir en attendant un présentiel.</p>
<p>Les inscriptions individuelles sont déjà ouvertes&nbsp;: <a href="https://www.fli.fr/register">https://www.fli.fr/register</a><br/>
Et pour un projet d'école ou inter-écoles, je préfère en parler avec vous directement.</p>
<p>Dites-moi un créneau qui vous convient pour un appel rapide, ou répondez simplement à ce message avec ce qui vous intéresse en premier (anglais, espagnol, présentiel, en ligne). On trouve une solution adaptée à votre secteur.</p>
<p>Bien à vous,<br/>
Paula<br/>
<strong>FLI — France Langues International</strong><br/>
25 avenue de la Gare — 73800 Montmélian<br/>
Tél. : 04 79 28 21 09<br/>
<a href="mailto:info@fli.fr">info@fli.fr</a></p>
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
      "User-Agent": "FLI-Formation/saint-lary-technique-valence",
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
