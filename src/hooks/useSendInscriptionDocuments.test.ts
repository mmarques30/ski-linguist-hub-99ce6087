import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("useSendInscriptionDocuments — bouton admin", () => {
  const hook = readFileSync(
    join(process.cwd(), "src/hooks/useSendInscriptionDocuments.ts"),
    "utf8",
  );
  const card = readFileSync(
    join(process.cwd(), "src/components/inscriptions/InscriptionDocumentsCard.tsx"),
    "utf8",
  );

  it("appelle l'edge send-inscription-documents en force", () => {
    expect(hook).toContain('invokeAdminEdgeFunction');
    expect(hook).toContain('"send-inscription-documents"');
    expect(hook).toContain("force: input.force !== false");
    expect(hook).toContain("inscriptionId");
  });

  it("surface due=0 et details.action dans le toast d'échec", () => {
    expect(hook).toContain("due === 0");
    expect(hook).toContain("details?.[0]?.action");
    expect(hook).toContain("force non déployé");
  });

  it("expose Envoyer / Renvoyer le dossier sur la fiche Documents", () => {
    expect(card).toContain("useSendInscriptionDocuments");
    expect(card).toContain("Envoyer le dossier");
    expect(card).toContain("Renvoyer le dossier");
    expect(card).toContain("Confirmer l’envoi");
  });
});
