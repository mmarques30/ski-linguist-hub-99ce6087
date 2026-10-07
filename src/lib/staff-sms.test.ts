import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BREVO_SMS_SENDER,
  buildStaffSmsTemplate,
  canSendStaffSms,
  FLI_DEPOSIT_PAYMENT_LINK,
  normalizePhoneForSms,
  STAFF_SMS_EDGE,
  STAFF_SMS_SLUGS,
  smsCharCount,
} from "./staff-sms";

describe("staff-sms", () => {
  it("normalise les numéros FR en E.164", () => {
    expect(normalizePhoneForSms("06 12 34 56 78")).toBe("+33612345678");
    expect(normalizePhoneForSms("0612345678")).toBe("+33612345678");
    expect(normalizePhoneForSms("+33 6 12 34 56 78")).toBe("+33612345678");
    expect(normalizePhoneForSms("0033612345678")).toBe("+33612345678");
    expect(normalizePhoneForSms("612345678")).toBe("+33612345678");
    expect(normalizePhoneForSms("")).toBeNull();
    expect(normalizePhoneForSms("123")).toBeNull();
  });

  it("refuse un SMS vide ou sans numéro valide", () => {
    expect(canSendStaffSms({ to: "0612345678", content: "  " })).toBe(false);
    expect(canSendStaffSms({ to: "123", content: "Bonjour" })).toBe(false);
    expect(canSendStaffSms({ to: "0612345678", content: "Bonjour" })).toBe(true);
  });

  it("construit le modèle mail / spam", () => {
    const t = buildStaffSmsTemplate("mailCheck", { firstName: "Lisa" });
    expect(t.slug).toBe(STAFF_SMS_SLUGS.mailCheck);
    expect(t.content).toContain("Lisa");
    expect(t.content).toContain("spams");
    expect(t.content).toContain("FLI");
    expect(smsCharCount(t.content)).toBeLessThanOrEqual(200);
  });

  it("construit le modèle acompte avec le lien Stripe", () => {
    const t = buildStaffSmsTemplate("payment", { firstName: "Tristan" });
    expect(t.slug).toBe(STAFF_SMS_SLUGS.payment);
    expect(t.content).toContain("150");
    expect(t.content).toContain(FLI_DEPOSIT_PAYMENT_LINK);
    expect(t.content).toContain("Tristan");
  });

  it("expose sender FLI et l'edge send-staff-sms alignée", () => {
    expect(BREVO_SMS_SENDER).toBe("FLI");
    expect(STAFF_SMS_EDGE).toBe("send-staff-sms");
    const edge = readFileSync(
      join(process.cwd(), "supabase/functions/send-staff-sms/index.ts"),
      "utf8"
    );
    expect(edge).toContain("requireStaff");
    expect(edge).toContain("sendBrevoSms");
    expect(edge).toContain("BREVO_API_KEY");
    const shared = readFileSync(
      join(process.cwd(), "supabase/functions/_shared/brevo-sms.ts"),
      "utf8"
    );
    expect(shared).toContain('BREVO_SMS_SENDER = "FLI"');
    // Drift garde : même logique de normalisation côté Deno
    const frontNorm = readFileSync(
      join(process.cwd(), "src/lib/staff-sms.ts"),
      "utf8"
    );
    const extract = (src: string) => {
      const m = src.match(
        /export function normalizePhoneForSms[\s\S]*?\n}\n/
      );
      return m?.[0]?.replace(/\s+/g, " ").trim() ?? "";
    };
    expect(extract(shared)).toBe(extract(frontNorm));
  });
});
