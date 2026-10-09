import { describe, expect, it } from "vitest";
import {
  attestationPresenceFilename,
  buildAttestationPresencePath,
  buildAttestationPresencePdfBlob,
} from "./attestation-presence-pdf";

describe("attestation-presence-pdf", () => {
  it("builds a stable storage path and filename", () => {
    expect(attestationPresenceFilename("FLI-260099")).toBe(
      "Attestation-presence-FLI-260099.pdf"
    );
    expect(
      buildAttestationPresencePath("stu", "ins", "FLI-260099")
    ).toBe("stu/ins/Attestation-presence-FLI-260099.pdf");
  });

  it("produces a PDF blob mentioning hours and FIFPL", async () => {
    const blob = buildAttestationPresencePdfBlob({
      studentName: "Montaine Gros-Deleglise",
      language: "Anglais",
      startDate: "2026-09-16",
      endDate: "2026-10-07",
      durationHoursPlanned: 18,
      hoursFollowed: 18,
      attendanceRate: 100,
      locationOrModality: "en_ligne",
      formateurName: "Maxime Goy",
      inscriptionCode: "FLI-260099",
      issueDate: "2026-10-09",
      fundingOrganization: "FIFPL",
    });
    expect(blob.type).toBe("application/pdf");
    const buf = Buffer.from(await blob.arrayBuffer());
    expect(buf.slice(0, 5).toString()).toBe("%PDF-");
    expect(buf.length).toBeGreaterThan(1000);
  });
});
