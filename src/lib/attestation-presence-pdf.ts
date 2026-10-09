/**
 * Attestation de présence et de règlement FIF-PL — modèle officiel
 * (`public/registration-documents/fifpl-attestation-presence-reglement.pdf`).
 *
 * Règles FLI (Paula, 2026-10-09) :
 * - formations en ligne ≠ e-learning → toujours Partie 1 (présentiel) ;
 * - individuelle : demi-journées = heures totales / 3 ;
 * - collective : jours / demi-journées fournis selon la convention (pas d'auto-calcul).
 */
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const FIFPL_ATTESTATION_TEMPLATE_PUBLIC_PATH =
  "registration-documents/fifpl-attestation-presence-reglement.pdf";

/** Cachet FLI (case « Cachet obligatoire » du modèle). */
export const FIFPL_ATTESTATION_CACHET_PUBLIC_PATH =
  "evaluation-pdf/fli-cachet.png";

export type FormationKindFifpl = "individuelle" | "collective";

export interface AttestationPresenceData {
  studentName: string;
  language: string;
  startDate: string;
  endDate: string;
  durationHoursPlanned: number | null;
  hoursFollowed: number | null;
  attendanceRate: number | null;
  locationOrModality: string | null;
  formateurName: string | null;
  inscriptionCode?: string | null;
  issueDate: string;
  /** Ex. FIFPL — mentionné dans le corps si présent. */
  fundingOrganization?: string | null;
  /** Montant pédagogique HT / TTC (organisme exonéré TVA → souvent identiques). */
  amountHt?: number | null;
  amountTtc?: number | null;
  /** individuelle (défaut) ou collective. */
  formationKind?: FormationKindFifpl | null;
  /** Collective uniquement : valeurs convention (ignorées si individuelle). */
  joursEntiersConvention?: number | null;
  demiJourneesConvention?: number | null;
  /** Intitulé exact ; sinon dérivé de la langue + type. */
  formationTitle?: string | null;
  /** Bytes du modèle officiel (tests / scripts Node). */
  templateBytes?: Uint8Array | null;
  /** PNG cachet (tests / scripts) ; sinon chargé depuis public/. */
  cachetPngBytes?: Uint8Array | null;
}

/** Coordonnées calées sur le PDF blank A4 (origine bas-gauche, pt). */
const PAGE_H = 841.89;

const FLI_DEFAULTS = {
  responsible: "Paula Rangel Halbwachs",
  functionLabel: "Directrice",
  organization: "France Langues International",
  activityDigits: "82730136673",
  city: "Montmélian",
  signatory: "Paula RANGEL HALBWACHS",
} as const;

export function attestationPresenceFilename(codeOrId: string): string {
  const safe = String(codeOrId || "inscription")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `Attestation-presence-${safe}.pdf`;
}

export function buildAttestationPresencePath(
  studentId: string,
  inscriptionId: string,
  codeOrId: string
): string {
  return `${studentId}/${inscriptionId}/${attestationPresenceFilename(codeOrId)}`;
}

export function formatFifplAttestationDate(
  isoOrFr: string | null | undefined
): string {
  if (!isoOrFr) return "";
  const raw = String(isoOrFr).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return raw;
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const [y, m, d] = raw.slice(0, 10).split("-");
    return `${d}/${m}/${y}`;
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  const dd = String(parsed.getDate()).padStart(2, "0");
  const mm = String(parsed.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${parsed.getFullYear()}`;
}

/** Individuelle : heures / 3, arrondi au plus proche entier. */
export function demiJourneesFromHoursIndividuelle(hours: number): number {
  return Math.round(hours / 3);
}

export function inferFormationKindFifpl(input: {
  modality?: string | null;
  courseType?: string | null;
  formationKind?: FormationKindFifpl | null;
}): FormationKindFifpl {
  if (input.formationKind === "individuelle" || input.formationKind === "collective") {
    return input.formationKind;
  }
  const course = (input.courseType || "").toLowerCase();
  if (course.includes("collect")) return "collective";
  if (course.includes("individ")) return "individuelle";
  const mod = (input.modality || "").toLowerCase();
  if (mod.includes("collect") || mod.includes("groupe")) {
    return "collective";
  }
  return "individuelle";
}

export function fifplFormationTitle(
  language: string,
  kind: FormationKindFifpl
): string {
  const lang = (language || "").trim() || "…";
  if (kind === "collective") return `Formation collective en ${lang}`;
  return `Formation individualisée en ${lang}`;
}

export function resolvePartie1Duration(input: {
  formationKind: FormationKindFifpl;
  totalHours: number | null;
  joursEntiersConvention?: number | null;
  demiJourneesConvention?: number | null;
}): { joursEntiers: string; demiJournees: string; totalHours: string } {
  const hours = input.totalHours;
  const hoursStr = hours != null && Number.isFinite(hours) ? String(hours) : "";
  if (input.formationKind === "individuelle") {
    return {
      joursEntiers: "",
      demiJournees:
        hours != null && Number.isFinite(hours)
          ? String(demiJourneesFromHoursIndividuelle(hours))
          : "",
      totalHours: hoursStr,
    };
  }
  return {
    joursEntiers:
      input.joursEntiersConvention != null
        ? String(input.joursEntiersConvention)
        : "",
    demiJournees:
      input.demiJourneesConvention != null
        ? String(input.demiJourneesConvention)
        : "",
    totalHours: hoursStr,
  };
}

function pdfSafe(text: string): string {
  return text
    .replace(/\u2192/g, "->")
    .replace(/\u2019/g, "'")
    .replace(/\u2018/g, "'")
    .replace(/\u00A0/g, " ")
    .replace(/\u00B7/g, "·");
}

/** Baseline juste au-dessus d'une ligne / bas de case (y top-left → pdf-lib). */
function baselineFromTop(topY: number, size: number): number {
  return PAGE_H - topY - size * 0.85;
}

function formatAmount(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "";
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(".", ",");
}

async function loadPublicAssetBytes(
  publicRelativePath: string,
  override?: Uint8Array | null
): Promise<Uint8Array | null> {
  if (override && override.byteLength > 0) return override;

  if (typeof globalThis.fetch === "function") {
    try {
      const res = await fetch(`/${publicRelativePath}`);
      if (res.ok) return new Uint8Array(await res.arrayBuffer());
    } catch {
      /* Node / hors Vite : fallback fs */
    }
  }

  try {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    return new Uint8Array(
      readFileSync(join(process.cwd(), "public", publicRelativePath))
    );
  } catch {
    return null;
  }
}

export async function loadFifplAttestationTemplateBytes(
  override?: Uint8Array | null
): Promise<Uint8Array> {
  const bytes = await loadPublicAssetBytes(
    FIFPL_ATTESTATION_TEMPLATE_PUBLIC_PATH,
    override
  );
  if (!bytes?.byteLength) {
    throw new Error(
      `Modèle FIF-PL introuvable : public/${FIFPL_ATTESTATION_TEMPLATE_PUBLIC_PATH}`
    );
  }
  return bytes;
}

/**
 * Remplit le modèle officiel FIF-PL (Partie 1 uniquement).
 * Retourne un Blob PDF prêt pour Storage.
 */
export async function buildAttestationPresencePdfBlob(
  data: AttestationPresenceData
): Promise<Blob> {
  const bytes = await buildAttestationPresencePdfBytes(data);
  return new Blob([bytes], { type: "application/pdf" });
}

export async function buildAttestationPresencePdfBytes(
  data: AttestationPresenceData
): Promise<Uint8Array> {
  const template = await loadFifplAttestationTemplateBytes(data.templateBytes);
  const doc = await PDFDocument.load(template);
  const page = doc.getPages()[0];
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const black = rgb(0, 0, 0);
  const size = 10;
  const sizeSmall = 9;

  const draw = (
    text: string,
    x: number,
    topY: number,
    opts?: { size?: number; bold?: boolean; maxWidth?: number }
  ) => {
    const s = opts?.size ?? size;
    const f = opts?.bold ? fontBold : font;
    const safe = pdfSafe(text);
    if (!safe) return;
    let drawn = safe;
    if (opts?.maxWidth != null) {
      while (drawn.length > 1 && f.widthOfTextAtSize(drawn, s) > opts.maxWidth) {
        drawn = drawn.slice(0, -1);
      }
    }
    page.drawText(drawn, {
      x,
      y: baselineFromTop(topY, s),
      size: s,
      font: f,
      color: black,
    });
  };

  const drawCenteredInBox = (
    text: string,
    box: { x0: number; x1: number; topY: number },
    opts?: { size?: number; bold?: boolean }
  ) => {
    const s = opts?.size ?? size;
    const f = opts?.bold ? fontBold : font;
    const safe = pdfSafe(text);
    if (!safe) return;
    const w = f.widthOfTextAtSize(safe, s);
    const x = box.x0 + Math.max(2, (box.x1 - box.x0 - w) / 2);
    page.drawText(safe, {
      x,
      y: baselineFromTop(box.topY + 1.5, s),
      size: s,
      font: f,
      color: black,
    });
  };

  const kind = inferFormationKindFifpl({
    formationKind: data.formationKind,
    modality: data.locationOrModality,
  });
  const hours =
    data.hoursFollowed ?? data.durationHoursPlanned ?? null;
  const partie1 = resolvePartie1Duration({
    formationKind: kind,
    totalHours: hours,
    joursEntiersConvention: data.joursEntiersConvention,
    demiJourneesConvention: data.demiJourneesConvention,
  });
  const title =
    (data.formationTitle || "").trim() ||
    fifplFormationTitle(data.language, kind);
  const amountHt = formatAmount(data.amountHt ?? data.amountTtc ?? null);
  const amountTtc = formatAmount(data.amountTtc ?? data.amountHt ?? null);
  const start = formatFifplAttestationDate(data.startDate);
  const end = formatFifplAttestationDate(data.endDate);
  const issue = formatFifplAttestationDate(data.issueDate);

  // En-tête organisme
  draw(FLI_DEFAULTS.responsible, 92, 200.5, { size: sizeSmall });
  draw(FLI_DEFAULTS.functionLabel, 345, 200.5, { size: sizeSmall });
  draw(FLI_DEFAULTS.organization, 150, 227.5, { size });

  // N° déclaration (11 cases)
  const ndaXs = [
    315.6, 337.5, 359.3, 381.3, 403.3, 425.4, 447.4, 469.6, 491.6, 513.4, 535.4,
  ];
  const digits = FLI_DEFAULTS.activityDigits.replace(/\D/g, "").slice(0, 11);
  for (let i = 0; i < digits.length; i += 1) {
    const dig = digits[i];
    const w = font.widthOfTextAtSize(dig, sizeSmall);
    page.drawText(dig, {
      x: ndaXs[i] - w / 2,
      y: baselineFromTop(255.5, sizeSmall),
      size: sizeSmall,
      font,
      color: black,
    });
  }

  // Stagiaire + intitulé + dates
  draw(data.studentName.trim(), 180, 288.5, { size, maxWidth: 340 });
  draw(title, 48, 318, { size, maxWidth: 480 });
  draw(start, 290, 347.5, { size: sizeSmall });
  draw(end, 445, 347.5, { size: sizeSmall });

  // Partie 1 (présentiel) — jamais Partie 2 e-learning
  if (partie1.joursEntiers) {
    drawCenteredInBox(partie1.joursEntiers, {
      x0: 127.6,
      x1: 255.0,
      topY: 396.7,
    });
  }
  if (partie1.demiJournees) {
    drawCenteredInBox(partie1.demiJournees, {
      x0: 269.1,
      x1: 396.5,
      topY: 396.7,
    });
  }
  if (partie1.totalHours) {
    drawCenteredInBox(partie1.totalHours, {
      x0: 410.7,
      x1: 538.1,
      topY: 396.7,
    });
  }

  // Montants
  if (amountHt) {
    drawCenteredInBox(amountHt, { x0: 170.6, x1: 258.5, topY: 598.4 });
  }
  if (amountTtc) {
    drawCenteredInBox(amountTtc, { x0: 294.8, x1: 382.7, topY: 597.9 });
  }

  // Fait à / le + signataire
  draw(FLI_DEFAULTS.city, 72, 670.5, { size });
  draw(issue, 58, 691, { size: sizeSmall });
  draw(FLI_DEFAULTS.signatory, 402, 708, { size: sizeSmall, bold: true });

  // Cachet obligatoire (case pointillée)
  const cachetBytes = await loadPublicAssetBytes(
    FIFPL_ATTESTATION_CACHET_PUBLIC_PATH,
    data.cachetPngBytes
  );
  if (cachetBytes?.byteLength) {
    try {
      const cachet = await doc.embedPng(cachetBytes);
      const box = { x: 228, y: PAGE_H - 760, w: 130, h: 72 };
      const scale = Math.min(box.w / cachet.width, box.h / cachet.height);
      const w = cachet.width * scale;
      const h = cachet.height * scale;
      page.drawImage(cachet, {
        x: box.x + (box.w - w) / 2,
        y: box.y + (box.h - h) / 2,
        width: w,
        height: h,
      });
    } catch {
      /* cachet optionnel — ne bloque pas l'attestation */
    }
  }

  return doc.save();
}
