import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  canSendStaffEmail,
  plainTextToEmailHtml,
  STAFF_MANUAL_EMAIL_SLUG,
} from "./staff-email";

describe("staff-email", () => {
  it("refuse un message vide", () => {
    expect(canSendStaffEmail({ subject: "", bodyText: "x" })).toBe(false);
    expect(canSendStaffEmail({ subject: "Sujet", bodyText: "  " })).toBe(false);
    expect(canSendStaffEmail({ subject: "Sujet", bodyText: "Bonjour" })).toBe(true);
  });

  it("transforme le texte en paragraphes et liens", () => {
    const html = plainTextToEmailHtml(
      "Bonjour Marc,\n\nVoir https://exemple.fr/pay\nligne 2"
    );
    expect(html).toContain("<p style=\"margin:0 0 16px\">Bonjour Marc,</p>");
    expect(html).toContain('href="https://exemple.fr/pay"');
    expect(html).toContain("ligne 2");
    expect(html).toContain("<br/>");
  });

  it("échappe le HTML saisi", () => {
    expect(plainTextToEmailHtml('<script>alert(1)</script>')).toContain(
      "&lt;script&gt;"
    );
  });

  it("expose le slug journal et l'edge send-staff-email", () => {
    expect(STAFF_MANUAL_EMAIL_SLUG).toBe("staff_manual");
    const edge = readFileSync(
      join(process.cwd(), "supabase/functions/send-staff-email/index.ts"),
      "utf8"
    );
    expect(edge).toContain('TEMPLATE_SLUG = "staff_manual"');
    expect(edge).toContain("requireStaff");
    expect(edge).toContain("sendFliEmail");
  });
});
