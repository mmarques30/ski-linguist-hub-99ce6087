/**
 * Charge les logos C.5 depuis generate-evaluation-pdf/evaluation-pdf-assets (habillage uniquement).
 */

import {
  EVALUATION_PDF_ASSET_FILES,
  type EvaluationPdfAssets,
} from "./evaluation-pdf-assets.ts";

async function readAsset(name: string, rootUrl: URL): Promise<Uint8Array> {
  return await Deno.readFile(new URL(`./evaluation-pdf-assets/${name}`, rootUrl));
}

export async function loadEvaluationPdfAssets(rootUrl: URL): Promise<EvaluationPdfAssets> {
  const partnerLogos: Uint8Array[] = [];
  for (const name of EVALUATION_PDF_ASSET_FILES.partners) {
    partnerLogos.push(await readAsset(name, rootUrl));
  }
  return {
    esfLogo: await readAsset(EVALUATION_PDF_ASSET_FILES.esfLogo, rootUrl),
    fliHeader: await readAsset(EVALUATION_PDF_ASSET_FILES.fliHeader, rootUrl),
    fliCachet: await readAsset(EVALUATION_PDF_ASSET_FILES.fliCachet, rootUrl),
    fliCompact: await readAsset(EVALUATION_PDF_ASSET_FILES.fliCompact, rootUrl),
    dsfLetterhead: await readAsset(EVALUATION_PDF_ASSET_FILES.dsfLetterhead, rootUrl),
    partnerLogos,
    fonts: {
      regular: await readAsset(EVALUATION_PDF_ASSET_FILES.fonts.regular, rootUrl),
      bold: await readAsset(EVALUATION_PDF_ASSET_FILES.fonts.bold, rootUrl),
      italic: await readAsset(EVALUATION_PDF_ASSET_FILES.fonts.italic, rootUrl),
    },
  };
}
