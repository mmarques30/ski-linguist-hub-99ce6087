/**
 * Charge les logos C.5 depuis _shared/evaluation-pdf-assets (habillage uniquement).
 */

import {
  EVALUATION_PDF_ASSET_FILES,
  type EvaluationPdfAssets,
} from "./evaluation-pdf-assets.ts";

async function readAsset(name: string): Promise<Uint8Array> {
  return await Deno.readFile(new URL(`./evaluation-pdf-assets/${name}`, import.meta.url));
}

export async function loadEvaluationPdfAssets(): Promise<EvaluationPdfAssets> {
  const partnerLogos: Uint8Array[] = [];
  for (const name of EVALUATION_PDF_ASSET_FILES.partners) {
    partnerLogos.push(await readAsset(name));
  }
  return {
    esfLogo: await readAsset(EVALUATION_PDF_ASSET_FILES.esfLogo),
    fliHeader: await readAsset(EVALUATION_PDF_ASSET_FILES.fliHeader),
    fliCachet: await readAsset(EVALUATION_PDF_ASSET_FILES.fliCachet),
    fliCompact: await readAsset(EVALUATION_PDF_ASSET_FILES.fliCompact),
    dsfLetterhead: await readAsset(EVALUATION_PDF_ASSET_FILES.dsfLetterhead),
    partnerLogos,
  };
}
