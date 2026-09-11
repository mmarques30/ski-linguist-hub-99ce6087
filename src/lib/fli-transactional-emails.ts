/** Textes FR des deux modèles 8-minimal (aperçu back-office + tests). */

export const EMAIL_FROM_DISPLAY = "FLI — France Langues International";
export const EMAIL_FROM_ADDRESS = "noreply@fli.fr";
export const EMAIL_REPLY_TO = "info@fli.fr";

export const CONFIRMATION_SUBJECT_FR =
  "Confirmation de votre inscription — France Langues International";

export const CONFIRMATION_BODY_FR = `<p>Bonjour {{student_name}},</p>
<p>Nous vous confirmons votre inscription à la formation <strong>{{language}}</strong>, du {{start_date}} au {{end_date}}.</p>
<p>Votre code d'inscription : <strong>{{inscription_code}}</strong></p>
<p>Nous reviendrons vers vous pour la suite du parcours (horaires, formateur·rice, accès à l'espace stagiaire).</p>
<p>Si vous avez une question, répondez à ce message : il arrivera à info@fli.fr.</p>
<p style="margin-top:24px">Cordialement,</p>
<p>
  <strong>FLI — France Langues International</strong><br/>
  25 avenue de la Gare<br/>
  73800 Montmélian<br/>
  Tél. : 04 79 28 21 09<br/>
  <a href="mailto:info@fli.fr">info@fli.fr</a>
</p>`;

export const INVITE_SUBJECT_FR =
  "Accès à votre espace stagiaire — France Langues International";

export const INVITE_BODY_FR = `<p>Bonjour {{student_name}},</p>
<p>Votre espace stagiaire est prêt. Cliquez sur le lien ci-dessous pour vous y connecter. Ce lien est personnel, à usage unique, et expire après un délai court.</p>
<p><a href="{{magic_link}}">Accéder à mon espace stagiaire</a></p>
<p>Si vous n'êtes pas à l'origine de cette demande, ignorez ce message. Aucun accès ne sera ouvert sans votre action.</p>
<p>Pour toute question, répondez à ce message : il arrivera à info@fli.fr.</p>
<p style="margin-top:24px">Cordialement,</p>
<p>
  <strong>FLI — France Langues International</strong><br/>
  25 avenue de la Gare<br/>
  73800 Montmélian<br/>
  Tél. : 04 79 28 21 09<br/>
  <a href="mailto:info@fli.fr">info@fli.fr</a>
</p>`;

export const J10_SUBJECT_PT =
  "FLI — Validação dos horários (J-10) — {{total_count}} inscrição(ões)";

const TU_HORS_GUILLEMETS = /(^|[>\s«])(tu|ton|ta|tes|toi)([<\s.,;:!?»]|$)/i;

export function texteVouvoie(html: string): boolean {
  return !TU_HORS_GUILLEMETS.test(html);
}

export function textePorteCoordonneesFli(html: string): boolean {
  return (
    html.includes("25 avenue de la Gare") &&
    html.includes("73800 Montmélian") &&
    html.includes("04 79 28 21 09") &&
    html.includes("info@fli.fr")
  );
}
