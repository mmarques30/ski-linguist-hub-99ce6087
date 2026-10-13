import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { stripCertificateMentionsFromCompletionEmail } from "./training-completion-email";

describe("stripCertificateMentionsFromCompletionEmail", () => {
  it("retire le certificat du sujet et de la liste HTML", () => {
    const result = stripCertificateMentionsFromCompletionEmail({
      subject:
        "Fin de votre formation Anglais : certificat, attestation et facture",
      html: `<ul><li style="margin:0 0 6px">Certificat de fin de formation</li><li style="margin:0 0 6px">Attestation de présence</li><li>Facture acquittée 26-27.1</li></ul>`,
    });
    expect(result.subject.toLowerCase()).not.toContain("certificat");
    expect(result.subject).toContain("attestation");
    expect(result.html).not.toMatch(/Certificat de fin de formation/i);
    expect(result.html).toContain("Attestation de présence");
  });

  it("garde la copie Deno d'accord avec le module front", () => {
    const front = readFileSync(
      join(process.cwd(), "src/lib/training-completion-email.ts"),
      "utf8"
    );
    const deno = readFileSync(
      join(
        process.cwd(),
        "supabase/functions/_shared/training-completion-email.ts"
      ),
      "utf8"
    );
    const extraire = (texte: string) => {
      const debut = texte.indexOf(
        "export function stripCertificateMentionsFromCompletionEmail"
      );
      expect(debut).toBeGreaterThan(-1);
      return texte.slice(debut);
    };
    expect(extraire(deno)).toBe(extraire(front));
  });

  it("l'edge envoie sans certificat obligatoire", () => {
    const edge = readFileSync(
      join(
        process.cwd(),
        "supabase/functions/send-training-completion-pack/index.ts"
      ),
      "utf8"
    );
    expect(edge).toContain("stripCertificateMentionsFromCompletionEmail");
    expect(edge).toContain("certificate_included");
    expect(edge).not.toMatch(
      /Certificat PDF manquant — générez d'abord le pack/
    );
  });
});
