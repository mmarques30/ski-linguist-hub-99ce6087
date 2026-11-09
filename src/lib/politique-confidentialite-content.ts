/**
 * Politique de confidentialité publique (landing + parcours inscription).
 * Texte opérationnel FR — à faire valider juridiquement si besoin.
 */

export const POLITIQUE_CONFIDENTIALITE_TITLE =
  "Politique de confidentialité et cookies";

export const POLITIQUE_CONFIDENTIALITE_UPDATED_AT = "2026-11-09";

export const POLITIQUE_CONFIDENTIALITE_INTRO =
  "France Langues International (FLI) traite des données personnelles dans le cadre de ses formations linguistiques et de son site www.fli.fr. Cette page décrit les traitements, les bases légales, les durées et vos droits (RGPD).";

export interface PolitiqueSection {
  id: string;
  title: string;
  paragraphs: string[];
}

export const POLITIQUE_CONFIDENTIALITE_SECTIONS: PolitiqueSection[] = [
  {
    id: "responsable",
    title: "Responsable du traitement",
    paragraphs: [
      "Le responsable du traitement est France Langues International, 25 avenue de la Gare, 73800 Montmélian — SIRET 484 772 041 00048 — contact : info@fli.fr — téléphone : 04 79 28 21 09.",
      "Pour toute question relative à la protection des données ou pour exercer vos droits, écrivez à info@fli.fr en précisant l'objet « Données personnelles ».",
    ],
  },
  {
    id: "finalites",
    title: "Finalités des traitements",
    paragraphs: [
      "Gestion des inscriptions et du parcours pédagogique (test de niveau, planning, émargement, documents de formation, questionnaires de satisfaction).",
      "Gestion administrative et financière (devis, facturation, financements FIFPL / OPCO / autres).",
      "Réponses aux demandes de contact et de devis via le site.",
      "Mesure d'audience du site (Google Analytics 4), uniquement si vous acceptez les cookies analytiques.",
      "Sécurité du site et prévention des abus (journaux techniques, Cloudflare).",
    ],
  },
  {
    id: "bases-legales",
    title: "Bases légales",
    paragraphs: [
      "Exécution d'un contrat ou de mesures précontractuelles pour les inscriptions et la formation.",
      "Obligation légale pour la conservation de certaines pièces de formation professionnelle et de facturation.",
      "Intérêt légitime pour la sécurité du site et le suivi opérationnel interne (hors cookies non essentiels).",
      "Consentement pour les cookies analytiques (Google Analytics) et tout traceur non strictement nécessaire.",
    ],
  },
  {
    id: "cookies",
    title: "Cookies et traceurs",
    paragraphs: [
      "Cookies strictement nécessaires : session technique, préférences de thème, choix de consentement cookies. Ils ne nécessitent pas de consentement.",
      "Cookies analytiques (Google Analytics 4) : statistiques de fréquentation (pages vues, provenance). Ils ne sont déposés qu'après votre acceptation via le bandeau cookies. L'adresse IP est anonymisée côté configuration. Vous pouvez refuser sans conséquence sur l'accès au site.",
      "Cloudflare peut déposer un cookie de sécurité technique (__cf_bm) pour protéger le site contre les robots malveillants.",
      "Vidéo YouTube (mode youtube-nocookie) : un lecteur peut être chargé si vous lancez la vidéo institutionnelle ; des cookies tiers peuvent alors apparaître selon les réglages de Google.",
      "Vous pouvez modifier votre choix à tout moment via le lien « Gérer les cookies » en bas de page.",
    ],
  },
  {
    id: "durees",
    title: "Durées de conservation",
    paragraphs: [
      "Dossiers stagiaires et pièces de formation : durée liée aux obligations légales de l'organisme de formation, puis archivage ou suppression.",
      "Données de facturation : délais légaux comptables.",
      "Demandes de contact : le temps nécessaire au traitement, puis suppression.",
      "Choix cookies : stocké localement dans votre navigateur jusqu'à modification ou effacement des données du site.",
      "Mesures d'audience Google Analytics : selon la durée configurée dans le compte GA4 de FLI (rétention limitée).",
    ],
  },
  {
    id: "destinataires",
    title: "Destinataires et sous-traitants",
    paragraphs: [
      "Personnel habilité de FLI.",
      "Prestataires techniques : hébergement / base de données (Supabase), paiements (Stripe) lorsque vous payez en ligne, e-mails transactionnels, protection Cloudflare, et Google (Analytics, YouTube) uniquement dans les cas décrits ci-dessus.",
      "Organismes financeurs ou partenaires lorsque cela est nécessaire à votre prise en charge (FIFPL, OPCO, entreprise, etc.).",
      "Aucun transfert n'est effectué à des fins de revente de fichiers.",
    ],
  },
  {
    id: "droits",
    title: "Vos droits",
    paragraphs: [
      "Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, d'opposition, et de portabilité lorsque applicable.",
      "Vous pouvez retirer votre consentement aux cookies analytiques à tout moment sans affecter la licéité du traitement fondé sur le consentement avant ce retrait.",
      "Vous pouvez introduire une réclamation auprès de la CNIL (www.cnil.fr).",
      "Pour exercer vos droits : info@fli.fr — France Langues International, 25 avenue de la Gare, 73800 Montmélian.",
    ],
  },
];
