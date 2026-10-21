/** Coordonnées publiques FLI affichées sur la landing (dialog contact + footer). */
export const FLI_CONTACT_EMAIL = "info@fli.fr";
export const FLI_CONTACT_PHONE_DISPLAY = "04 79 28 21 09";
export const FLI_CONTACT_PHONE_TEL = "+33479282109";
export const FLI_CONTACT_ADDRESS = "25, avenue de la Gare · 73800 Montmélian";

export type ContactDialogIntent = "devis" | "question";

export const CONTACT_DIALOG_COPY: Record<
  ContactDialogIntent,
  { title: string; description: string; subject: string; body: string }
> = {
  devis: {
    title: "Demander un devis",
    description:
      "Indiquez-nous votre école ou votre structure, la langue souhaitée, le nombre de personnes et vos dates. Nous revenons vers vous avec une proposition.",
    subject: "Demande de devis — formation linguistique",
    body: [
      "Bonjour,",
      "",
      "Je souhaite un devis pour une formation linguistique.",
      "École / structure : ",
      "Langue : ",
      "Nombre de personnes : ",
      "Période souhaitée : ",
      "",
      "Merci,",
    ].join("\n"),
  },
  question: {
    title: "Nous contacter",
    description:
      "Écrivez-nous ou appelez l'équipe FLI — nous répondons rapidement, du lundi au vendredi.",
    subject: "Question — formations FLI",
    body: "Bonjour,\n\n",
  },
};

export function buildContactMailto(intent: ContactDialogIntent): string {
  const { subject, body } = CONTACT_DIALOG_COPY[intent];
  return `mailto:${FLI_CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
