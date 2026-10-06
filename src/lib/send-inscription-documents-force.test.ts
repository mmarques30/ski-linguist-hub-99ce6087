import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("send-inscription-documents — renvoi forcé", () => {
  const edge = readFileSync(
    join(process.cwd(), "supabase/functions/send-inscription-documents/index.ts"),
    "utf8",
  );

  it("accepte un POST force + inscriptionId sans passer par le journal déjà envoyé", () => {
    expect(edge).toContain("payload.force === true");
    expect(edge).toContain("if (!forceInscriptionId)");
    expect(edge).toContain("IGNORE - déjà envoyé");
  });

  it("permet un sujet et un HTML personnalisés pour le renvoi", () => {
    expect(edge).toContain("customSubject");
    expect(edge).toContain("customHtml");
    expect(edge).toContain("template.subject_fr = customSubject");
    expect(edge).toContain("template.body_fr = customHtml");
  });
});
