/**
 * BL-023 — texte des conditions générales de formation.
 *
 * Aucun article n'est inventé : ils reprennent la convention de formation
 * professionnelle de FLI (`public/registration-documents/convention-stage-langues-station-2022.dotx`,
 * articles II, IV à IX) et la règle de règlement déjà appliquée par
 * `registration-payments.ts` (frais de dossier de 150 € puis solde par chèque,
 * ou paiement intégral).
 *
 * L'identité de l'organisme vient de `app_settings.fli_identity`, saisie dans
 * `/settings` (BL-036) : elle n'est pas recopiée ici.
 */

export const CONDITIONS_GENERALES_TITLE = "Conditions générales de formation";

export const CONDITIONS_GENERALES_UPDATED_AT = "2026-09-15";

export const CONDITIONS_GENERALES_PROVENANCE =
  "Ce texte reprend les articles de la convention de formation professionnelle " +
  "de France Langues International. La convention qui vous est adressée puis " +
  "signée fait foi en cas de divergence.";

export interface ConditionsGeneralesSection {
  id: string;
  title: string;
  paragraphs: string[];
}

export const CONDITIONS_GENERALES_SECTIONS: ConditionsGeneralesSection[] = [
  {
    id: "objet",
    title: "Objet et inscription",
    paragraphs: [
      "L'action de formation entre dans la catégorie des actions d'acquisition et de perfectionnement des connaissances prévue par l'article L.6313-1 du code du travail.",
      "Votre inscription est enregistrée à réception du formulaire complété et du test de niveau, obligatoire. Elle est confirmée par un code d'inscription. Une convention de formation professionnelle vous est ensuite adressée, à vous ou à votre employeur, accompagnée du programme de la formation.",
      "À l'issue de la formation, une attestation de stage vous est délivrée.",
    ],
  },
  {
    id: "tarif",
    title: "Tarif et règlement",
    paragraphs: [
      "Le tarif de la formation est celui affiché dans le récapitulatif de votre inscription.",
      "Le règlement s'effectue selon le mode que vous choisissez à l'étape « Paiement » : soit des frais de dossier de 150 €, déduits du tarif total, puis le solde par chèque remis à l'inscription et encaissé après la clôture de votre dossier ; soit le paiement intégral, en ligne ou par virement.",
      "Organisme exonéré de TVA (formulaire 3511).",
    ],
  },
  {
    id: "retractation",
    title: "Délai de rétractation",
    paragraphs: [
      "À compter de la date de signature de la convention, vous disposez d'un délai de 10 jours pour vous rétracter. Vous en informez l'organisme de formation par lettre recommandée ; dans ce cas, aucune somme ne peut vous être exigée.",
    ],
  },
  {
    id: "seances",
    title: "Organisation, réservation et annulation des séances",
    paragraphs: [
      "Une feuille d'émargement, où figurent les dates et la durée des séances, est établie et validée par la responsable de formation. Un test de niveau est réalisé à l'entrée et à la sortie de la formation.",
      "Pour les cours en ligne réservés auprès de nos formateurs, vous disposez d'un délai d'annulation de 24 heures minimum. En cas de non-respect de ce délai, ou d'absence lors d'un cours, le cours est facturé.",
      "Pour les formations collectives en station, le groupe du matin ou de l'après-midi est attribué par l'équipe FLI environ 10 jours avant le début des cours, après analyse de l'ensemble des inscrits.",
    ],
  },
  {
    id: "interruption",
    title: "Interruption de la formation",
    paragraphs: [
      "En cas d'abandon du stage pour un autre motif qu'une force majeure reconnue, le contrat est résilié selon les modalités financières suivantes : règlement du montant total du contrat, sans remboursement des cours non suivis.",
      "En cas de cessation anticipée de la formation du fait de l'organisme de formation, ou si vous êtes empêché de suivre la formation par suite d'une force majeure dûment reconnue, le contrat de formation professionnelle est résilié. Dans ce cas, seules les prestations effectivement dispensées sont dues, au prorata temporis de leur valeur prévue au contrat.",
    ],
  },
  {
    id: "accessibilite",
    title: "Accessibilité",
    paragraphs: [
      "Nos formations en ligne sont accessibles et adaptées aux personnes à mobilité réduite.",
      "Les formations en présentiel se déroulant dans des locaux externes à notre structure, FLI ne peut pas garantir de manière systématique leur conformité avec la norme PMR.",
      "FLI ne dispose pas de contenus pédagogiques adaptés aux stagiaires en situation de handicap visuel ou auditif. Nous ferons notre possible pour vous orienter vers nos partenaires proposant des formations adaptées à vos besoins.",
    ],
  },
  {
    id: "donnees",
    title: "Données personnelles",
    paragraphs: [
      "Les informations que vous saisissez lors de l'inscription servent à instruire votre dossier, organiser la formation, établir les documents obligatoires (convention, émargement, attestation, facture) et vous en rendre compte. Elles ne sont pas cédées à des tiers.",
      "Vous pouvez demander à accéder à vos données, les faire rectifier ou les faire effacer en écrivant à l'adresse de contact indiquée ci-dessus, sous réserve des durées de conservation imposées par nos obligations comptables et de formation.",
    ],
  },
  {
    id: "litiges",
    title: "Contestations et litiges",
    paragraphs: [
      "Si une contestation ou un différend n'ont pu être réglés à l'amiable, le tribunal de Chambéry est seul compétent pour régler le litige.",
    ],
  },
];

export const REGLEMENT_INTERIEUR_ON_REQUEST =
  "Le règlement intérieur de l'organisme de formation vous est remis avec vos " +
  "documents d'inscription. Vous pouvez le demander dès maintenant à l'adresse " +
  "de contact indiquée ci-dessus.";
