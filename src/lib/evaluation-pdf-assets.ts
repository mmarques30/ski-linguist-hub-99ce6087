/**
 * Logos d'habillage C.5 (aucune donnée de test).
 * Node : public/evaluation-pdf. Deno : _shared/evaluation-pdf-assets.
 */

export type EvaluationPdfAssets = {
  esfLogo?: Uint8Array;
  fliHeader?: Uint8Array;
  fliCachet?: Uint8Array;
  fliCompact?: Uint8Array;
  dsfLetterhead?: Uint8Array;
  partnerLogos?: Uint8Array[];
};

export const EVALUATION_PDF_ASSET_FILES = {
  esfLogo: "esf-logo.jpg",
  fliHeader: "fli-entete-prosneige.png",
  fliCachet: "fli-cachet.png",
  fliCompact: "fli-logo-compact.png",
  dsfLetterhead: "dsf-papier-entete-A4.png",
  /** Ordre aligné sur ESF_REGIONAL_SECTIONS (.dotx). */
  partners: [
    "orga-alpes-inter-langues.jpg", // Bourg Saint Maurice
    "orga-cret-hautes-alpes.png", // Briançon
    "orga-cci-lorraine.jpg", // Épinal
    "orga-cite-des-langues.jpg", // Chambéry
    "fli-logo-compact.png", // Francin / FLI
    "orga-greta-midi-pyrenees.jpg", // Tarbes
    "orga-words-to-the-world.png", // Megève / Albertville / Chamonix
  ],
} as const;
