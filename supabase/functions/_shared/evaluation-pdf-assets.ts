/**
 * Logos d'habillage C.5 (aucune donnée de test).
 * Node : public/evaluation-pdf.
 * Deno : supabase/functions/generate-evaluation-pdf/evaluation-pdf-assets.
 */

export type EvaluationPdfAssets = {
  esfLogo?: Uint8Array;
  fliHeader?: Uint8Array;
  fliCachet?: Uint8Array;
  fliCompact?: Uint8Array;
  dsfLetterhead?: Uint8Array;
  partnerLogos?: Uint8Array[];
  /** Liberation Sans (métriques Arial) pour l'habillage ESF .dotx. */
  fonts?: {
    regular?: Uint8Array;
    bold?: Uint8Array;
    italic?: Uint8Array;
  };
};

export const EVALUATION_PDF_ASSET_FILES = {
  esfLogo: "esf-logo.jpg",
  fliHeader: "fli-entete-prosneige.png",
  fliCachet: "fli-cachet.png",
  fliCompact: "fli-logo-compact.png",
  dsfLetterhead: "dsf-papier-entete-A4.png",
  fonts: {
    regular: "fonts/LiberationSans-Regular.ttf",
    bold: "fonts/LiberationSans-Bold.ttf",
    italic: "fonts/LiberationSans-Italic.ttf",
  },
  /** Ordre aligné sur ESF_REGIONAL_SECTIONS (.dotx, flux 2 colonnes). */
  partners: [
    "orga-alpes-inter-langues.jpg", // Bourg Saint Maurice (col. gauche)
    "orga-cret-hautes-alpes.png", // Briançon
    "orga-cci-lorraine.jpg", // Épinal
    "orga-cite-des-langues.jpg", // Chambéry
    "fli-logo-compact.png", // Francin (col. droite)
    "orga-greta-midi-pyrenees.jpg", // Tarbes
    "orga-words-to-the-world.png", // Megève / Albertville / Chamonix
  ],
} as const;
