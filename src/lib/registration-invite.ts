/** Helpers inscription sur invitation (/register?session=S21). */

export function normalizeInviteEmail(email: string | null | undefined): string {
  return (email || "").trim().toLowerCase();
}

export function isPlausibleInviteEmail(email: string | null | undefined): boolean {
  const e = normalizeInviteEmail(email);
  return e.length > 3 && e.includes("@") && e.includes(".");
}

/** Navigation wizard : saute certification et/ou paiement. */
export function nextRegistrationStepId(
  currentStep: number,
  opts: { skipCertification: boolean; skipPayment: boolean }
): number {
  let next = currentStep + 1;
  if (next === 5 && opts.skipCertification) next = 6;
  if (next === 6 && opts.skipPayment) next = 7;
  return Math.min(next, 7);
}

export function prevRegistrationStepId(
  currentStep: number,
  opts: { skipCertification: boolean; skipPayment: boolean }
): number {
  let prev = currentStep - 1;
  if (prev === 6 && opts.skipPayment) prev = 5;
  if (prev === 5 && opts.skipCertification) prev = 4;
  return Math.max(prev, 1);
}

export const SAMOENS_PT_SESSION_CODE = "S21";

export const SAMOENS_PT_GROUP_SCHEDULE_HTML = `
<ul>
  <li><strong>1 groupe débutants</strong> — 3 h le matin : 8 h–11 h</li>
  <li><strong>1 groupe perfectionnement</strong> — 2 h : 11 h 15–13 h 15</li>
  <li><strong>1 groupe faux débutants</strong> — 3 h l’après-midi : 14 h 30–17 h 30</li>
</ul>
`.trim();
