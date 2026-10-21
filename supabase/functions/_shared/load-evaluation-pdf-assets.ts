/**
 * Charge les logos C.5 (habillage uniquement).
 * Les fichiers sont dans le dossier de generate-evaluation-pdf, pas dans
 * _shared : Lovable envoie tout _shared avec chaque fonction, et la limite
 * d'envoi est d'environ 4,5 Mo.
 */

import {
  EVALUATION_PDF_ASSET_FILES,
  type EvaluationPdfAssets,
} from "./evaluation-pdf-assets.ts";

async function readAsset(assetRoot: URL, name: string): Promise<Uint8Array> {
  return await Deno.readFile(new URL(`evaluation-pdf-assets/${name}`, assetRoot));
}

export async function loadEvaluationPdfAssets(assetRoot: URL): Promise<EvaluationPdfAssets> {
  const partnerLogos: Uint8Array[] = [];
  for (const name of EVALUATION_PDF_ASSET_FILES.partners) {
    partnerLogos.push(await readAsset(assetRoot, name));
  }
  return {
    esfLogo: await readAsset(assetRoot, EVALUATION_PDF_ASSET_FILES.esfLogo),
    fliHeader: await readAsset(assetRoot, EVALUATION_PDF_ASSET_FILES.fliHeader),
    fliCachet: await readAsset(assetRoot, EVALUATION_PDF_ASSET_FILES.fliCachet),
    fliCompact: await readAsset(assetRoot, EVALUATION_PDF_ASSET_FILES.fliCompact),
    dsfLetterhead: await readAsset(assetRoot, EVALUATION_PDF_ASSET_FILES.dsfLetterhead),
    partnerLogos,
    fonts: {
      regular: await readAsset(assetRoot, EVALUATION_PDF_ASSET_FILES.fonts.regular),
      bold: await readAsset(assetRoot, EVALUATION_PDF_ASSET_FILES.fonts.bold),
      italic: await readAsset(assetRoot, EVALUATION_PDF_ASSET_FILES.fonts.italic),
    },
  };
}
