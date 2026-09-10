import { describe, expect, it } from "vitest";
import {
  CERTIFICATE_BUCKET,
  DOCUMENTS_BUCKET,
  buildCertificatePath,
  isLegacyPublicUrl,
} from "./certificateStorage";

describe("certificateStorage", () => {
  it("cible le bucket privé", () => {
    expect(CERTIFICATE_BUCKET).toBe("certificates");
    expect(DOCUMENTS_BUCKET).toBe("documents");
  });

  it("place le student_id en premier segment (clé de la politique de lecture)", () => {
    const path = buildCertificatePath("stu-1", "insc-2", "cert-3");
    expect(path).toBe("stu-1/insc-2/cert-3.pdf");
    expect(path.split("/")[0]).toBe("stu-1");
  });

  it("distingue les URL publiques historiques des chemins de stockage", () => {
    expect(isLegacyPublicUrl("https://x.supabase.co/storage/v1/a.pdf")).toBe(
      true
    );
    expect(isLegacyPublicUrl("stu-1/insc-2/cert-3.pdf")).toBe(false);
  });
});
