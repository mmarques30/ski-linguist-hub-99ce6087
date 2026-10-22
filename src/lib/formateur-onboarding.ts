/**
 * Contenu de la page d’accueil / guide formateur·rice.
 * Texte en tutoiement (consigne Paula). Facile à ajuster sans toucher à la page.
 */

export type FormateurOnboardingSection = {
  id: string;
  title: string;
  lead?: string;
  bullets?: string[];
  paragraphs?: string[];
};

export type FormateurOnboardingAppLink = {
  page:
    | "tableau-de-bord"
    | "planning"
    | "stagiaires"
    | "bilans"
    | "presences"
    | "evaluations"
    | "documents"
    | "paiements"
    | "profil";
  label: string;
  description: string;
};

export const FORMATEUR_ONBOARDING_TITLE = "Bienvenue chez FLI";

export const FORMATEUR_ONBOARDING_INTRO =
  "Ce guide te présente France Langues International, le déroulé des formations, et ton espace formateur.";

export const FORMATEUR_ONBOARDING_SECTIONS: FormateurOnboardingSection[] = [
  {
    id: "qui-est-fli",
    title: "Qui est FLI ?",
    paragraphs: [
      "France Langues International (FLI) conçoit des formations linguistiques sur mesure pour les métiers de la montagne : moniteur·rices de ski, personnel des remontées, pisteur·euses, hôtellerie.",
      "Organisme de formation professionnelle continue, certifié Qualiopi (actions de formation), FLI accompagne les écoles de ski partenaires et les stagiaires depuis plus de 40 ans.",
    ],
    bullets: [
      "Siège : 25 avenue de la Gare, 73800 Montmélian",
      "Contact : info@fli.fr — 04 79 28 21 09",
      "Financements courants : FIF-PL, OPCO, autofinancement, forfaits école",
    ],
  },
  {
    id: "fonctionnement",
    title: "Comment ça fonctionne pour toi",
    lead: "Tu interviens en tant que formateur·rice indépendant·e pour animer les sessions confiées par FLI.",
    bullets: [
      "FLI te confie une mission (présentiel en station, visio de groupe, ou cours individuel en ligne) avec les infos stagiaire / groupe.",
      "Tu organises les créneaux avec le·la stagiaire ou le groupe (selon le format), dans le cadre des dates et de la durée prévues.",
      "À chaque séance : ouvre l'émargement numérique dans Présence et envoie le lien aux stagiaires (signature par e-mail). La fiche PDF FORMATEUR reste dispo en secours.",
      "Tu renseignes les bilans d’entrée et de sortie (niveaux CECRL) dans Bilans — un niveau par stagiaire.",
      "En présentiel de groupe : le dernier jour, dix minutes pour le questionnaire de satisfaction (Qualiopi) — les stagiaires reçoivent le lien par e-mail.",
      "Les évaluations orales SNMSF se saisissent dans Évaluations, quand tu es examinateur·rice sur une session.",
      "Contrats, vigilance, CV et paiements sont en lecture seule dans Documents, Paiements et Profil — pour une correction, écris à info@fli.fr.",
    ],
  },
  {
    id: "cours",
    title: "Les formats de cours",
    lead: "Les missions varient selon la saison et la langue. Les formats les plus fréquents :",
    bullets: [
      "Présentiel en station — souvent 24 h sur une semaine (parfois 40 h ou 2 × 20 h), en salle ESF ou organisée par FLI, groupes limités.",
      "Visio de groupe — typiquement 24 h en 8 séances de 3 h (ex. mardi / jeudi), via visioconférence.",
      "Individuel en ligne — packs d’heures (multiples de 3 h) ; tu conviens des créneaux directement avec le·la stagiaire après mise en relation.",
      "Langues courantes : anglais, espagnol, portugais brésilien, néerlandais, russe — selon ta fiche et les besoins de la saison.",
    ],
  },
  {
    id: "appli",
    title: "L’espace formateur",
    lead: "Cet espace te montre ce qui te concerne. Les données viennent du dossier FLI.",
    paragraphs: [
      "Utilise le menu pour naviguer. Sur mobile, la barre du bas reprend les mêmes rubriques.",
    ],
  },
  {
    id: "contact",
    title: "Besoin d’aide ?",
    paragraphs: [
      "Pour une question pédagogique, logistique ou administrative : info@fli.fr ou 04 79 28 21 09.",
      "Paula Rangel Halbwachs et l’équipe FLI restent ton interlocuteur pour les missions, contrats et documents.",
    ],
  },
];

export const FORMATEUR_ONBOARDING_APP_LINKS: FormateurOnboardingAppLink[] = [
  {
    page: "tableau-de-bord",
    label: "Tableau de bord",
    description: "Vue d’ensemble : missions, stagiaires, évals à saisir.",
  },
  {
    page: "planning",
    label: "Missions",
    description: "Qui, où, quand, langue, horaires, école — fiche par mission.",
  },
  {
    page: "stagiaires",
    label: "Stagiaires",
    description: "Contact, attentes, test de placement et niveaux.",
  },
  {
    page: "bilans",
    label: "Bilans",
    description: "Formulaires d’entrée et de sortie (niveaux CECRL).",
  },
  {
    page: "presences",
    label: "Présence",
    description: "Émargement numérique par séance + fiche PDF FORMATEUR.",
  },
  {
    page: "evaluations",
    label: "Évaluations",
    description: "Tests oraux SNMSF (notes, phrases, PDF).",
  },
  {
    page: "documents",
    label: "Documents",
    description: "CV, attestation de vigilance, contrats (lecture seule).",
  },
  {
    page: "paiements",
    label: "Paiements",
    description: "Rémunérations FLI (lecture seule).",
  },
  {
    page: "profil",
    label: "Profil",
    description: "Identité, fiscal, tarif — contacte info@fli.fr pour corriger.",
  },
];

export const FORMATEUR_ONBOARDING_PAGE = "onboarding" as const;
