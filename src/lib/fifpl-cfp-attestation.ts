/**
 * Extraction texte d'une attestation CFP (PDF) via pdf.js, navigateur uniquement.
 */
import { parseCfpAttestationText } from "@/lib/fifpl-funding";

export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // Worker bundlé par Vite — évite un CDN externe.
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const parts: string[] = [];
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum += 1) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const line = content.items
      .map((item) => ("str" in item ? String(item.str) : ""))
      .filter(Boolean)
      .join(" ");
    parts.push(line);
  }
  return parts.join("\n");
}

export async function analyzeCfpAttestationFile(file: File): Promise<
  ReturnType<typeof parseCfpAttestationText> & { rawTextLength: number }
> {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return {
      year: null,
      contributionEur: null,
      suggestedStatus: null,
      warnings: [
        "Seuls les PDF texte sont analysés automatiquement. Pour une image scannée, saisissez l’année et le montant CFP à la main.",
      ],
      rawTextLength: 0,
    };
  }

  try {
    const text = await extractPdfText(file);
    const parsed = parseCfpAttestationText(text);
    if (!text.trim()) {
      parsed.warnings = [
        ...parsed.warnings,
        "Le PDF ne contient pas de texte extractible (scan). Saisissez l’année et le montant manuellement.",
      ];
    }
    return { ...parsed, rawTextLength: text.length };
  } catch {
    return {
      year: null,
      contributionEur: null,
      suggestedStatus: null,
      warnings: [
        "Impossible de lire ce PDF. Vérifiez le fichier ou saisissez l’année et le montant CFP manuellement.",
      ],
      rawTextLength: 0,
    };
  }
}
