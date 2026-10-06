/**
 * La Rosière (mode fifpl_stagiaire_solde_ecole) : le reste à charge ESF
 * dépend du dossier FIF-PL du moniteur. Sans statut / attestation CFP /
 * autre FIF-PL 2026, on demande les pièces par e-mail.
 */

export const ROSIERE_CFP_EMAIL_SLUG = "rosiere_cfp_missing";

export const ROSIERE_CFP_EMAIL_SUBJECT =
  "Attestation CFP — dossier FIF-PL La Rosière ({{inscription_code}})";

export const ROSIERE_CFP_EMAIL_VARIABLES = ["student_name", "inscription_code"] as const;

export const ROSIERE_CFP_EMAIL_HTML = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e8e8">
<tr><td style="padding:28px 24px 24px;font-size:15px;line-height:1.55;font-family:Georgia,'Times New Roman',serif;color:#111">
<p style="margin:0 0 16px">Bonjour {{student_name}},</p>
<p style="margin:0 0 16px">Vous êtes inscrit·e à la formation de La Rosière ({{inscription_code}}). Pour constituer votre dossier FIF-PL et calculer le reste à charge de l'ESF, nous avons besoin des informations suivantes :</p>
<ul style="margin:0 0 16px;padding-left:20px">
<li style="margin:0 0 8px">votre <strong>attestation CFP URSSAF 2026</strong> (espace URSSAF → documents / attestations → attestation de contribution à la formation professionnelle) ;</li>
<li style="margin:0 0 8px">votre <strong>statut</strong> : indépendant (100&nbsp;% des critères) ou micro-entrepreneur (selon la cotisation CFP) ;</li>
<li style="margin:0 0 8px">le <strong>montant déjà pris en charge par le FIF-PL en 2026</strong> pour une autre formation, s'il y a lieu (indiquez 0&nbsp;€ sinon).</li>
</ul>
<p style="margin:0 0 16px">Merci de répondre à ce message avec ces éléments : ils arrivent directement à <a href="mailto:info@fli.fr" style="color:#111">info@fli.fr</a>.</p>
<p style="margin:24px 0 0">Cordialement,<br/>L'équipe FLI</p>
</td></tr>
</table>
</td></tr>
</table>`;

export type RosiereCfpData = {
  status?: string | null;
  cfpAttestationPath?: string | null;
  cfpAttestationFileName?: string | null;
  cfpAttestationYear?: number | null;
  hadOtherFifplTrainingThisYear?: boolean | null;
  otherFifplAmountAlreadyCoveredEur?: number | null;
};

function normalizeLocation(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[_]+/g, "-")
    .replace(/\s+/g, " ");
}

export function isLaRosiereSession(input: {
  locationKey?: string | null;
  locationLabel?: string | null;
  fundingMode?: string | null;
}): boolean {
  if (input.fundingMode === "fifpl_stagiaire_solde_ecole") return true;
  const key = normalizeLocation(input.locationKey).replace(/\s+/g, "-");
  if (key === "la-rosiere") return true;
  const label = normalizeLocation(input.locationLabel);
  return label.includes("la rosiere") || label.includes("esf la rosiere");
}

export function isLaRosiereSkiInstructor(input: {
  profession?: string | null;
  locationKey?: string | null;
  locationLabel?: string | null;
  fundingMode?: string | null;
}): boolean {
  if (input.profession !== "ski_instructor") return false;
  return isLaRosiereSession(input);
}

export function isRosiereCfpDataComplete(data: RosiereCfpData): boolean {
  const hasStatus = data.status === "independant" || data.status === "micro_entrepreneur";
  const hasAttestation = Boolean(
    (data.cfpAttestationPath && data.cfpAttestationPath.trim()) ||
      (data.cfpAttestationFileName && data.cfpAttestationFileName.trim())
  );
  const hasOtherAnswer =
    data.hadOtherFifplTrainingThisYear === true || data.hadOtherFifplTrainingThisYear === false;
  const otherAmountOk =
    data.hadOtherFifplTrainingThisYear !== true ||
    (data.otherFifplAmountAlreadyCoveredEur != null &&
      Number.isFinite(Number(data.otherFifplAmountAlreadyCoveredEur)) &&
      Number(data.otherFifplAmountAlreadyCoveredEur) >= 0);
  return hasStatus && hasAttestation && hasOtherAnswer && otherAmountOk;
}

export function shouldSendRosiereCfpRequest(
  input: {
    profession?: string | null;
    locationKey?: string | null;
    locationLabel?: string | null;
    fundingMode?: string | null;
  } & RosiereCfpData
): boolean {
  return isLaRosiereSkiInstructor(input) && !isRosiereCfpDataComplete(input);
}

export function parseFifplCfpFromFundingDetails(
  fundingDetails: string | Record<string, unknown> | null | undefined
): RosiereCfpData {
  if (!fundingDetails) return {};
  try {
    const parsed =
      typeof fundingDetails === "string" ? JSON.parse(fundingDetails) : fundingDetails;
    const fifpl = (parsed as { fifpl?: Record<string, unknown> } | null)?.fifpl;
    if (!fifpl || typeof fifpl !== "object") return {};
    const rights = fifpl.estimatedRights as Record<string, unknown> | undefined;
    const hasFlag = rights?.hasCfpAttestation === true;
    return {
      status: typeof fifpl.status === "string" ? fifpl.status : null,
      cfpAttestationPath:
        typeof fifpl.cfpAttestationPath === "string" ? fifpl.cfpAttestationPath : null,
      cfpAttestationFileName:
        typeof fifpl.cfpAttestationFileName === "string" ? fifpl.cfpAttestationFileName : null,
      cfpAttestationYear:
        typeof fifpl.cfpAttestationYear === "number" ? fifpl.cfpAttestationYear : null,
      hadOtherFifplTrainingThisYear:
        typeof fifpl.hadOtherFifplTrainingThisYear === "boolean"
          ? fifpl.hadOtherFifplTrainingThisYear
          : null,
      otherFifplAmountAlreadyCoveredEur:
        typeof fifpl.otherFifplAmountAlreadyCoveredEur === "number"
          ? fifpl.otherFifplAmountAlreadyCoveredEur
          : null,
      ...(hasFlag && !fifpl.cfpAttestationPath && !fifpl.cfpAttestationFileName
        ? { cfpAttestationFileName: "attestation-cfp" }
        : {}),
    };
  } catch {
    return {};
  }
}

export function renderRosiereCfpRequestEmail(vars: {
  studentName: string;
  inscriptionCode: string;
}): { subject: string; html: string } {
  const studentName = vars.studentName.trim() || "Madame, Monsieur";
  const inscriptionCode = vars.inscriptionCode.trim() || "votre inscription";
  return {
    subject: ROSIERE_CFP_EMAIL_SUBJECT.replaceAll("{{inscription_code}}", inscriptionCode),
    html: ROSIERE_CFP_EMAIL_HTML.replaceAll("{{student_name}}", studentName).replaceAll(
      "{{inscription_code}}",
      inscriptionCode
    ),
  };
}

export function observationsLookLikeSkiInstructor(observations: string | null | undefined): boolean {
  return /moniteur de ski/i.test(observations ?? "");
}
