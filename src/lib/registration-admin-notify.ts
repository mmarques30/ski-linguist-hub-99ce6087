/**
 * Résumé admin envoyé à chaque inscription /register (e-mail + notif in-app).
 * Copie alignée : `supabase/functions/_shared/registration-admin-notify.ts`.
 */

export type RegistrationAdminSummaryInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  language: string;
  modalityLabel: string;
  fundingLabel: string;
  level: string;
  slopeLabel?: string | null;
  durationHours?: number | null;
  courseLocation?: string | null;
  datesLabel: string;
  paymentLabel?: string | null;
  inscriptionCode?: string | null;
  isCustomFormat?: boolean;
  customFormatDetails?: string | null;
  isOpco?: boolean;
  opcoObservation?: string | null;
  price?: number | null;
};

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fullName(input: RegistrationAdminSummaryInput): string {
  return `${input.firstName} ${input.lastName}`.trim();
}

function formatPrice(price: number | null | undefined): string | null {
  if (price == null || Number.isNaN(price)) return null;
  return `${price.toLocaleString("fr-FR")} €`;
}

/** Lignes métier partagées (e-mail HTML + notif texte). */
export function registrationAdminSummaryLines(
  input: RegistrationAdminSummaryInput
): Array<{ label: string; value: string }> {
  const rows: Array<{ label: string; value: string }> = [
    { label: "Nom", value: input.lastName },
    { label: "Prénom", value: input.firstName },
    { label: "E-mail", value: input.email },
  ];
  if (input.phone?.trim()) rows.push({ label: "Téléphone", value: input.phone.trim() });
  if (input.inscriptionCode) {
    rows.push({ label: "Code inscription", value: input.inscriptionCode });
  }
  rows.push(
    { label: "Langue", value: input.language },
    { label: "Modalité", value: input.modalityLabel },
    { label: "Financement", value: input.fundingLabel },
    { label: "Niveau", value: input.level || "—" }
  );
  if (input.slopeLabel) rows.push({ label: "Piste / test", value: input.slopeLabel });
  if (input.durationHours != null) {
    rows.push({ label: "Durée", value: `${input.durationHours} h` });
  }
  if (input.courseLocation) {
    rows.push({ label: "Lieu", value: input.courseLocation });
  }
  rows.push({ label: "Dates", value: input.datesLabel });
  if (input.paymentLabel) {
    rows.push({ label: "Paiement", value: input.paymentLabel });
  }
  const priceLabel = formatPrice(input.price);
  if (priceLabel) rows.push({ label: "Montant", value: priceLabel });
  if (input.isCustomFormat) {
    rows.push({
      label: "Format",
      value: input.customFormatDetails?.trim() || "Personnalisé (détails à préciser)",
    });
  }
  if (input.isOpco && input.opcoObservation?.trim()) {
    rows.push({ label: "OPCO", value: input.opcoObservation.trim() });
  }
  return rows;
}

export function buildRegistrationAdminNotifySubject(
  input: RegistrationAdminSummaryInput
): string {
  const name = fullName(input);
  if (input.isOpco) return `[FLI] Nouvelle inscription OPCO — ${name}`;
  if (input.isCustomFormat) return `[FLI] Nouvelle inscription (devis) — ${name}`;
  return `[FLI] Nouvelle inscription — ${name}`;
}

export function buildRegistrationAdminNotifyHtml(
  input: RegistrationAdminSummaryInput
): string {
  const rows = registrationAdminSummaryLines(input)
    .map(
      (r) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#555;vertical-align:top">${esc(r.label)}</td>` +
        `<td style="padding:4px 0;color:#111"><strong>${esc(r.value).replace(/\n/g, "<br/>")}</strong></td></tr>`
    )
    .join("");

  return `<p>Nouvelle inscription reçue via le formulaire public.</p>
<table style="border-collapse:collapse;font-size:14px;line-height:1.45">${rows}</table>
<p style="margin-top:16px;color:#555;font-size:13px">Consultez la fiche dans le back-office FLI.</p>`;
}

/** Texte court pour la cloche / page Notifications. */
export function buildRegistrationAdminNotifyMessage(
  input: RegistrationAdminSummaryInput
): string {
  const parts = [
    `${input.lastName} ${input.firstName}`.trim(),
    input.language,
    input.modalityLabel,
    `niveau ${input.level || "—"}`,
  ];
  if (input.inscriptionCode) parts.unshift(input.inscriptionCode);
  if (input.fundingLabel) parts.push(input.fundingLabel);
  if (input.datesLabel) parts.push(input.datesLabel);
  return parts.filter(Boolean).join(" · ");
}

export function buildRegistrationAdminNotifyTitle(
  input: RegistrationAdminSummaryInput
): string {
  const name = fullName(input);
  if (input.isOpco) return `OPCO à analyser — ${name}`;
  if (input.isCustomFormat) return `Devis à préparer — ${name}`;
  return `Nouvelle inscription — ${name}`;
}
