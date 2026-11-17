/**
 * PDF « CONTRAT PONCTUEL DE PRESTATION » (modèle FLI Version 2 du 8 septembre 2021).
 * - En-tête : logo FLI (`fli-entete.png`) + bandeau
 * - Pied : mentions légales FLI + n° de page (toutes les pages)
 * - Clauses : préambule + articles 1 à 8 (intégralité du modèle Drive/Word)
 */
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
} from "pdf-lib";

export const FORMATEUR_CONTRACT_SIGNATURE_ASSET =
  "formateur-contracts/fli-signature-cachet.png" as const;

/** Même fichier que les conventions stagiaire (copie canonique inscription-documents). */
export const FORMATEUR_CONTRACT_SIGNATURE_FALLBACK =
  "inscription-documents/fli-signature-cachet.png" as const;

/** En-tête FLI — même fichier que les conventions / devis. */
export const FORMATEUR_CONTRACT_LETTERHEAD_ASSET =
  "inscription-documents/fli-entete.png" as const;

/** Version du modèle Word historique. */
export const FORMATEUR_CONTRACT_MODEL_VERSION =
  "Version 2 du 8 septembre 2021" as const;

/**
 * Pied de page FLI — aligné sur les fiches de présence / conventions (Paula 2026-10-01).
 */
export const FORMATEUR_CONTRACT_FOOTER_LINES = [
  "Formation Professionnelle Continue : Langues Etrangères",
  "SARL au capital de 5000 euros. F.L.I. 25 avenue de la gare, 73800 Montmélian",
  "Siret : 484 772 041 00048- RCS Chambéry – NAF : 8559A - Organisme de formation n° 82 73 01 366 73",
] as const;

const PAGE = { width: 595.28, height: 841.89 };
const MARGIN = 50;
const HEADER_HEIGHT = 72;
const FOOTER_HEIGHT = 52;
const CONTENT_TOP = PAGE.height - HEADER_HEIGHT - 14;
const CONTENT_BOTTOM = FOOTER_HEIGHT + 12;

const NAVY = rgb(0.07, 0.18, 0.38);
const RULE = rgb(0.75, 0.78, 0.82);
const INK = rgb(0.07, 0.07, 0.07);
const MUTED = rgb(0.35, 0.35, 0.35);

export type InstructorContractModality =
  | "online_individual"
  | "station_group";

export type InstructorContractPdfInput = {
  contractNumber: string;
  /** Ex. « Madame Tatiana Samoilova-Magnier » */
  prestataireCiviliteName: string;
  /** Adresse / SIRET / contact (lignes affichées sous le nom). */
  prestataireAddressLines: string[];
  /** Nature de la formation (ex. « Formation en ligne Jay Deleglise »). */
  formationNature: string;
  /** Précision volume optionnelle (ex. note 2 groupes…). */
  volumeNote?: string | null;
  durationHours: number;
  hourlyRate: number;
  /** ISO yyyy-mm-dd */
  startDate: string;
  endDate: string;
  locationLabel: string;
  modality?: InstructorContractModality;
  /** PNG bytes du cachet + signature organisme */
  organismSignaturePng: Uint8Array;
  /** PNG papier à en-tête FLI (logo). */
  letterheadPng?: Uint8Array | null;
  /** Date d’émission affichée (défaut : aujourd’hui fr-FR) */
  issuedAtLabel?: string | null;
  /** Nom affiché côté prestataire sous la signature */
  prestataireSignName?: string | null;
};

type Fonts = { regular: PDFFont; bold: PDFFont };

export function formatContractDateFr(iso: string | null | undefined): string {
  if (!iso) return "…";
  if (/^\d{4}-\d{2}-\d{2}/.test(iso)) {
    const [y, m, day] = iso.slice(0, 10).split("-");
    return `${String(day).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
  }
  return iso;
}

export function formatEuroFr(amount: number): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "…";
  return (
    n.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " €"
  );
}

export function formatSiretFr(siret: string | null | undefined): string {
  const digits = String(siret || "").replace(/\D/g, "");
  if (digits.length !== 14) return (siret || "").trim() || "…";
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
}

export function instructorContractFilename(
  contractNumber: string,
  formateurLastNameHint?: string | null,
): string {
  const who = (formateurLastNameHint || "formateur")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `Contrat-${contractNumber}-${who}.pdf`;
}

export function buildPrestataireAddressLines(input: {
  address?: string | null;
  postalCode?: string | null;
  city?: string | null;
  siret?: string | null;
  email?: string | null;
  phone?: string | null;
  statutLabel?: string | null;
}): string[] {
  const lines: string[] = [];
  const addr = (input.address || "").trim();
  if (addr) lines.push(addr);
  const cityLine = [input.postalCode, input.city]
    .map((x) => (x || "").trim())
    .filter(Boolean)
    .join(" ");
  if (cityLine) lines.push(cityLine);
  const statut = (input.statutLabel || "").trim();
  if (statut) lines.push(statut);
  const siret = formatSiretFr(input.siret);
  if (siret && siret !== "…") lines.push(`n° de SIRET : ${siret}`);
  const contact = [input.email, input.phone]
    .map((x) => (x || "").trim())
    .filter(Boolean)
    .join(" — ");
  if (contact) lines.push(contact);
  return lines;
}

function pdfSafe(text: string): string {
  return text
    .replace(/\u2019/g, "'")
    .replace(/\u2018/g, "'")
    .replace(/\u00A0/g, " ")
    .replace(/\u2026/g, "...")
    .replace(/\u2013/g, "-")
    .replace(/\u2014/g, "-");
}

function wrapText(
  font: PDFFont,
  text: string,
  size: number,
  maxWidth: number,
): string[] {
  const normalized = pdfSafe(text).replace(/\s+/g, " ").trim();
  if (!normalized) return [];
  const words = normalized.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const trial = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(trial, size) <= maxWidth) {
      current = trial;
    } else {
      if (current) lines.push(current);
      if (font.widthOfTextAtSize(word, size) <= maxWidth) current = word;
      else {
        let chunk = "";
        for (const ch of word) {
          const next = chunk + ch;
          if (font.widthOfTextAtSize(next, size) <= maxWidth) chunk = next;
          else {
            if (chunk) lines.push(chunk);
            chunk = ch;
          }
        }
        current = chunk;
      }
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawFitted(
  page: PDFPage,
  image: PDFImage,
  box: { x: number; y: number; width: number; height: number },
) {
  const scale = Math.min(box.width / image.width, box.height / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  const x = box.x + (box.width - width) / 2;
  const y = box.y + (box.height - height) / 2;
  page.drawImage(image, { x, y, width, height });
}

function drawPageHeader(page: PDFPage, fonts: Fonts, letterhead: PDFImage | null) {
  page.drawRectangle({
    x: 0,
    y: PAGE.height - 5,
    width: PAGE.width,
    height: 5,
    color: NAVY,
  });

  const bandY = PAGE.height - HEADER_HEIGHT + 4;
  const bandH = 42;

  if (letterhead) {
    drawFitted(page, letterhead, {
      x: MARGIN,
      y: bandY + 8,
      width: PAGE.width - MARGIN * 2,
      height: bandH,
    });
  } else {
    page.drawText("France Langues International", {
      x: MARGIN,
      y: bandY + bandH / 2,
      size: 13,
      font: fonts.bold,
      color: NAVY,
    });
  }

  page.drawText(FORMATEUR_CONTRACT_MODEL_VERSION, {
    x: MARGIN,
    y: PAGE.height - HEADER_HEIGHT + 2,
    size: 7,
    font: fonts.regular,
    color: MUTED,
  });

  page.drawLine({
    start: { x: MARGIN, y: PAGE.height - HEADER_HEIGHT - 2 },
    end: { x: PAGE.width - MARGIN, y: PAGE.height - HEADER_HEIGHT - 2 },
    thickness: 0.6,
    color: RULE,
  });
}

function drawPageFooter(
  page: PDFPage,
  fonts: Fonts,
  pageIndex: number,
  pageCount: number,
) {
  page.drawLine({
    start: { x: MARGIN, y: FOOTER_HEIGHT + 6 },
    end: { x: PAGE.width - MARGIN, y: FOOTER_HEIGHT + 6 },
    thickness: 0.5,
    color: RULE,
  });

  const pageLabel = `Page ${pageIndex} / ${pageCount}`;
  const pageW = fonts.regular.widthOfTextAtSize(pageLabel, 7);
  page.drawText(pageLabel, {
    x: PAGE.width - MARGIN - pageW,
    y: FOOTER_HEIGHT - 6,
    size: 7,
    font: fonts.regular,
    color: MUTED,
  });

  let y = FOOTER_HEIGHT - 6;
  const maxW = PAGE.width - MARGIN * 2 - pageW - 12;
  for (let i = 0; i < FORMATEUR_CONTRACT_FOOTER_LINES.length; i++) {
    const line = FORMATEUR_CONTRACT_FOOTER_LINES[i];
    const font = i === 0 ? fonts.bold : fonts.regular;
    const wrapped = wrapText(font, line, 6.2, maxW);
    const text = wrapped[0] || line;
    page.drawText(text, {
      x: MARGIN,
      y,
      size: 6.2,
      font,
      color: MUTED,
    });
    y -= 9;
  }
}

class Cursor {
  y: number;
  page: PDFPage;
  constructor(
    private doc: PDFDocument,
    private fonts: Fonts,
    private letterhead: PDFImage | null,
    startY: number,
  ) {
    this.page = doc.getPages()[0];
    this.y = startY;
  }

  private ensure(space: number) {
    if (this.y - space < CONTENT_BOTTOM) {
      this.page = this.doc.addPage([PAGE.width, PAGE.height]);
      drawPageHeader(this.page, this.fonts, this.letterhead);
      this.y = CONTENT_TOP;
    }
  }

  gap(n = 8) {
    this.y -= n;
  }

  heading(text: string, size = 11) {
    this.ensure(size + 10);
    this.page.drawText(pdfSafe(text), {
      x: MARGIN,
      y: this.y,
      size,
      font: this.fonts.bold,
      color: INK,
    });
    this.y -= size + 6;
  }

  para(text: string, size = 9) {
    const maxW = PAGE.width - MARGIN * 2;
    const lines = wrapText(this.fonts.regular, text, size, maxW);
    for (const line of lines) {
      this.ensure(size + 4);
      this.page.drawText(line, {
        x: MARGIN,
        y: this.y,
        size,
        font: this.fonts.regular,
        color: INK,
      });
      this.y -= size + 3;
    }
    this.y -= 3;
  }

  boldPara(text: string, size = 9) {
    const maxW = PAGE.width - MARGIN * 2;
    const lines = wrapText(this.fonts.bold, text, size, maxW);
    for (const line of lines) {
      this.ensure(size + 4);
      this.page.drawText(line, {
        x: MARGIN,
        y: this.y,
        size,
        font: this.fonts.bold,
        color: INK,
      });
      this.y -= size + 3;
    }
    this.y -= 2;
  }

  bullet(text: string, size = 9) {
    const maxW = PAGE.width - MARGIN * 2 - 14;
    const lines = wrapText(this.fonts.regular, text, size, maxW);
    for (let i = 0; i < lines.length; i++) {
      this.ensure(size + 4);
      const prefix = i === 0 ? "- " : "  ";
      this.page.drawText(prefix + lines[i], {
        x: MARGIN + 6,
        y: this.y,
        size,
        font: this.fonts.regular,
        color: INK,
      });
      this.y -= size + 3;
    }
    this.y -= 2;
  }

  kv(label: string, value: string, size = 9) {
    this.ensure(size + 4);
    const labelText = `${label} `;
    this.page.drawText(labelText, {
      x: MARGIN,
      y: this.y,
      size,
      font: this.fonts.bold,
      color: INK,
    });
    const x = MARGIN + this.fonts.bold.widthOfTextAtSize(labelText, size);
    const maxW = PAGE.width - MARGIN - x;
    const lines = wrapText(this.fonts.regular, value, size, maxW);
    if (!lines.length) {
      this.y -= size + 3;
      return;
    }
    this.page.drawText(lines[0], {
      x,
      y: this.y,
      size,
      font: this.fonts.regular,
      color: INK,
    });
    this.y -= size + 3;
    for (const line of lines.slice(1)) {
      this.ensure(size + 4);
      this.page.drawText(line, {
        x: MARGIN,
        y: this.y,
        size,
        font: this.fonts.regular,
        color: INK,
      });
      this.y -= size + 3;
    }
    this.y -= 2;
  }
}

export async function buildInstructorContractPdf(
  input: InstructorContractPdfInput,
): Promise<Uint8Array> {
  const hours = Number(input.durationHours);
  const rate = Number(input.hourlyRate);
  const total = hours * rate;
  const issued =
    input.issuedAtLabel?.trim() ||
    new Date().toLocaleDateString("fr-FR");
  const volumeExtra = (input.volumeNote || "").trim();
  const durationLabel = volumeExtra
    ? `${hours} heures (${volumeExtra})`
    : `${hours} heures`;
  const nature = (input.formationNature || "").trim() || "Formation";
  const lieu = (input.locationLabel || "").trim() || "…";
  const signName =
    (input.prestataireSignName || "").trim() ||
    input.prestataireCiviliteName.replace(/^(Madame|Monsieur)\s+/i, "");

  const doc = await PDFDocument.create();
  const fonts: Fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
  };

  let letterhead: PDFImage | null = null;
  if (input.letterheadPng?.length) {
    try {
      letterhead = await doc.embedPng(input.letterheadPng);
    } catch {
      letterhead = null;
    }
  }

  const first = doc.addPage([PAGE.width, PAGE.height]);
  drawPageHeader(first, fonts, letterhead);
  const c = new Cursor(doc, fonts, letterhead, CONTENT_TOP);

  c.heading("CONTRAT PONCTUEL DE PRESTATION", 13);
  c.para(`N° ${input.contractNumber}`, 10);
  c.gap(4);
  c.boldPara("Entre les soussignés :");
  c.para("l'organisme de formation");
  c.para("25 avenue de la gare");
  c.para("73800 Montmélian");
  c.para("tél : 04 79 28 21 09");
  c.para("SIRET : 484 772 041 00048");
  c.para("d'une part");
  c.gap(4);
  c.para("et");
  c.boldPara(input.prestataireCiviliteName);
  for (const line of input.prestataireAddressLines) {
    c.para(line);
  }
  c.para("Ci-après dénommé : le prestataire");
  c.para("d'autre part");
  c.gap(4);
  c.para("il a été convenu ce qui suit :");

  c.heading("Préambule", 11);
  c.para(
    "France Langue International (FLI), en tant qu'organisme de formation, met en place et réalise, en faisant appel à des prestataires, des formations en langues étrangères conçues pour un public ciblé de moniteurs de ski et des formations certifiantes en langues étrangères tout public. Le prestataire accepte d'animer la session de formation proposée, en toute indépendance et à l'aide d'un contenu pédagogique de sa conception adapté au thème de la session de formation et aux objectifs de la formation.",
  );
  c.para(
    "Il a été convenu ce qui suit, en application de la sixième partie – livre III du code du travail :",
  );

  c.heading("Article 1 : Objet", 11);
  c.para(
    "La présente convention a pour objet de définir les obligations de chacune des parties dans le cadre de la réalisation des actions de formations suivantes que FLI souhaite sous-traiter, depuis la conception du support de formation jusqu'à l'animation de la formation suivante :",
  );
  c.kv("Nature de la formation :", nature);
  c.kv(
    "dates :",
    `du ${formatContractDateFr(input.startDate)} au ${formatContractDateFr(input.endDate)}`,
  );
  c.kv("durée :", durationLabel);
  c.kv("lieu :", lieu);

  c.heading("Article 2 : Obligation des parties", 11);
  c.heading("2.1 – Obligations de FLI", 10);
  c.para(
    "FLI communique au prestataire au minimum 8 jours avant chaque session les documents suivants :",
  );
  c.bullet("Liste des participants");
  c.bullet("Feuilles de présence (par demi-journée ou connexion)");
  c.bullet("Modalités particulières concernant les locaux de la formation");

  c.heading("2.2 : Obligations du Prestataire", 10);
  c.para(
    "Le formateur atteste avoir pris connaissance du règlement intérieur de FLI ainsi que de celui de l'entreprise dans les locaux de laquelle se déroule la formation, et s'engage à les respecter.",
  );
  c.para(
    "Le formateur s'engage également à respecter l'ensemble des critères du « référentiel national sur la qualité des actions de formation » impulsé par le Ministère du Travail, et mis en œuvre par FLI au titre de sa certification « Qualiopi ». (Décret n°2019-565 du 6 juin 2019 relatif au référentiel national sur la qualité des actions concourant au développement des compétences).",
  );
  c.para(
    "Le Prestataire atteste être à jour de ses obligations fiscales et sociales.",
  );

  c.heading("2.2.1 – Programme détaillé de formation", 10);
  c.para(
    "Le programme détaillé de la formation est celui conçu par le Prestataire en concertation avec FLI au regard des objectifs pédagogiques ciblés pour chaque formation. Le Prestataire dispose d'une indépendance totale dans l'élaboration du programme de formation et de son contenu.",
  );

  c.heading("2.2.2 – Supports de formation et matériel", 10);
  c.para(
    "Le Prestataire apporte son propre matériel pédagogique. Les supports de formation fournis par le Prestataire restent la propriété pleine et entière du Prestataire.",
  );
  c.para(
    "Les supports de formation fournis par FLI restent la propriété pleine et entière de FLI. Toute modification de ces supports doit être approuvée par FLI. Le Prestataire ne pourra en aucun cas les utiliser en dehors des périodes de formation ci-dessus mentionnées.",
  );

  c.heading("2.2.3 – Périodes adjacentes à la formation", 10);
  c.para(
    "Le prestataire s'engage à arriver au minimum 15 minutes avant le démarrage de la session.",
  );
  c.para(
    "Le prestataire s'engage à remettre les locaux de la formation dans un état correct à l'issue de la formation.",
  );

  c.heading("2.2.4 – Remise des documents et informations après la session", 10);
  c.para(
    "A l'issue du premier jour de formation, le Prestataire évalue le niveau du stagiaire ou du groupe de stagiaires via le document correspondant fourni par FLI, et rend compte des moyens matériels et logistiques mis à sa disposition.",
  );
  c.para(
    "A l'issue de la formation, le prestataire dispose de 8 jours pour :",
  );
  c.bullet(
    "Remettre à FLI les feuilles de présence renseignées avec sa signature apposée dessus",
  );
  c.bullet(
    "Remettre à FLI le questionnaire de satisfaction rempli par les stagiaires qui n'auraient pas pu le compléter en ligne",
  );
  c.bullet(
    "Évaluer, grâce au formulaire en ligne fourni par FLI, le niveau du/des stagiaires à leur sortie de formation, et fournir un compte rendu de formation via ce même document.",
  );
  c.para(
    "Le prestataire signale sous 8 jours à FLI toute information pertinente sur le déroulement des journées de formation, qu'elle soit positive ou négative (observation des stagiaires, problèmes logistiques, etc). En cas d'incident notoire, le prestataire rapporte immédiatement les informations nécessaires à FLI.",
  );

  c.heading("2.2.5 – Confidentialité et concurrence", 10);
  c.para(
    "Pendant et après le temps de son intervention, le prestataire s'engage à :",
  );
  c.bullet(
    "Ne divulguer aucune information dont il aurait pu avoir connaissance par le biais de FLI ou dans le cadre de son intervention, pendant et après le contrat.",
  );
  c.bullet(
    "Ne pas utiliser à des fins personnelles l'ensemble des documents et éventuels supports de formation fournis par FLI.",
  );
  c.bullet(
    "Ne pas diffuser des informations ou documents à des fins commerciales au nom de FLI sans les avoir au préalable fait valider par FLI. (ex : carte de visite, plaquette…)",
  );
  c.bullet("Observer réserve et neutralité dans le cadre de sa prestation.");
  c.para(
    "En outre, le prestataire s'engage pendant un an après son intervention à ne pas faire de concurrence directe ou indirecte à FLI sur des formations dispensées par FLI auprès de sa base de clients.",
  );

  c.heading("Article 3 : Organisation des sessions", 11);
  c.para(
    "FLI se réserve le droit d'annuler ou de reporter une action de formation, sans indemnisation du partenaire, jusqu'à 4 jours avant la formation pour insuffisance de participants ou toute autre cause ne permettant pas le déroulement de la formation dans les conditions conformes aux règles de la profession.",
  );

  c.heading("Article 4 : Durée", 11);
  c.para(`Le présent contrat est conclu pour une durée de ${hours} heures.`);

  c.heading("Article 5 : Prix et modalités de règlement", 11);
  c.para(
    `Prix de la prestation : Les honoraires versés par France Langues International au prestataire sont fixés à ${formatEuroFr(rate)} (Par Heure ) pour la présente prestation. Le prestataire établit une facture d'honoraires dès la fin de la prestation à l'ordre de France Langues International pour un montant total de ${formatEuroFr(total)}.`,
  );
  c.para("Paiement à 30 jours fin de mois, date de facture.");

  c.heading("Article 6 : Responsabilité civile", 11);
  c.para(
    "Le prestataire s'engage à bénéficier d'une assurance en responsabilité civile en vigueur à la date des sessions qu'il réalisera, couvrant les prestations qui lui sont confiées par le présent contrat cadre.",
  );

  c.heading("Article 7 : Résiliation", 11);
  c.para(
    "En cas de non-exécution par l'une des parties des obligations prévues à la présente convention, celle-ci sera résiliée de plein droit à l'initiative de l'autre partie, sans indemnisation d'aucune sorte.",
  );
  c.para(
    "Cependant la résiliation ne deviendra effective qu'à l'expiration d'un délai de 30 jours courant à compter de la réception par la partie défaillante d'une mise en demeure adressée sous pli recommandé avec demande d'avis de réception lui demandant de remplir ses obligations et restée sans effet.",
  );
  c.para(
    "Toutefois, la résiliation pourra être mise en œuvre sans mise en demeure préalable dans le cas ou l'obligation non respectée ne pourrait plus être exécutée.",
  );
  c.para(
    "Le présent contrat prend effet à la date de la signature par les deux parties.",
  );

  c.heading("Article 8 : Règlement des litiges", 11);
  c.para(
    "Toutes contestations entre les parties à propos de l'interprétation ou de l'application des clauses du présent contrat fera l'objet, au préalable, d'une procédure de conciliation obligatoire.",
  );
  c.para(
    "Chacune des parties désignera un conciliateur dans un délai de deux mois à compter de la date d'envoi de la lettre recommandée avec accusé de réception de l'une ou de l'autre des parties demandant l'application de cette disposition.",
  );
  c.para(
    "En cas de carence dans la désignation des conciliateurs, la partie la plus diligente pourra saisir le tribunal compétent.",
  );
  c.para(
    "Pour tous les litiges découlant des présentes, de leur exécution, interprétation ou suites, seul le tribunal de Chambéry sera compétent.",
  );

  c.gap(10);
  c.para(`Fait en double exemplaire à Montmélian, le ${issued}`);
  c.gap(14);

  c.ensure(120);
  const sigY = c.y;
  c.page.drawText("France Langues International", {
    x: MARGIN,
    y: sigY,
    size: 9,
    font: fonts.bold,
    color: INK,
  });
  c.page.drawText("Le Prestataire", {
    x: 320,
    y: sigY,
    size: 9,
    font: fonts.bold,
    color: INK,
  });
  c.page.drawText("Paula Rangel Halbwachs", {
    x: MARGIN,
    y: sigY - 14,
    size: 9,
    font: fonts.regular,
    color: INK,
  });
  c.page.drawText(pdfSafe(signName), {
    x: 320,
    y: sigY - 14,
    size: 9,
    font: fonts.regular,
    color: INK,
  });

  const png = await doc.embedPng(input.organismSignaturePng);
  const maxW = 160;
  const scale = maxW / png.width;
  const w = maxW;
  const h = png.height * scale;
  c.page.drawImage(png, {
    x: MARGIN,
    y: Math.max(CONTENT_BOTTOM + 4, sigY - 20 - h),
    width: w,
    height: h,
  });

  // Pied de page sur toutes les pages (après pagination connue)
  const pages = doc.getPages();
  const pageCount = pages.length;
  pages.forEach((page, idx) => {
    drawPageFooter(page, fonts, idx + 1, pageCount);
  });

  return doc.save();
}
