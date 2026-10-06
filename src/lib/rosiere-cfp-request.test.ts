import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  isLaRosiereSession,
  isLaRosiereSkiInstructor,
  isRosiereCfpDataComplete,
  observationsLookLikeSkiInstructor,
  parseFifplCfpFromFundingDetails,
  renderRosiereCfpRequestEmail,
  ROSIERE_CFP_EMAIL_HTML,
  ROSIERE_CFP_EMAIL_SLUG,
  ROSIERE_CFP_EMAIL_SUBJECT,
  shouldSendRosiereCfpRequest,
} from "./rosiere-cfp-request";

function source(relatif: string): string {
  return readFileSync(join(process.cwd(), relatif), "utf8");
}

const completeCfp = {
  status: "independant" as const,
  cfpAttestationPath: "documents/cfp.pdf",
  cfpAttestationFileName: "cfp.pdf",
  cfpAttestationYear: 2026,
  hadOtherFifplTrainingThisYear: false,
  otherFifplAmountAlreadyCoveredEur: null,
};

describe("La Rosière — demande CFP manquante", () => {
  it("reconnaît la session par le mode financement, la clé ou le libellé", () => {
    expect(isLaRosiereSession({ fundingMode: "fifpl_stagiaire_solde_ecole" })).toBe(true);
    expect(isLaRosiereSession({ locationKey: "la-rosiere" })).toBe(true);
    expect(isLaRosiereSession({ locationKey: "la_rosiere" })).toBe(true);
    expect(isLaRosiereSession({ locationLabel: "ESF La Rosière" })).toBe(true);
    expect(isLaRosiereSession({ locationKey: "meribel" })).toBe(false);
    expect(isLaRosiereSession({ fundingMode: "forfait_ecole" })).toBe(false);
  });

  it("cible uniquement les moniteurs de ski de La Rosière", () => {
    expect(
      isLaRosiereSkiInstructor({
        profession: "ski_instructor",
        locationKey: "la-rosiere",
      })
    ).toBe(true);
    expect(
      isLaRosiereSkiInstructor({
        profession: "other",
        locationKey: "la-rosiere",
      })
    ).toBe(false);
    expect(observationsLookLikeSkiInstructor("Moniteur de ski\nDates: …")).toBe(true);
    expect(observationsLookLikeSkiInstructor("Autre profession")).toBe(false);
  });

  it("exige statut, attestation et réponse autre FIF-PL 2026", () => {
    expect(isRosiereCfpDataComplete(completeCfp)).toBe(true);
    expect(isRosiereCfpDataComplete({ ...completeCfp, cfpAttestationPath: null, cfpAttestationFileName: null })).toBe(
      false
    );
    expect(isRosiereCfpDataComplete({ ...completeCfp, status: null })).toBe(false);
    expect(
      isRosiereCfpDataComplete({ ...completeCfp, hadOtherFifplTrainingThisYear: null })
    ).toBe(false);
    expect(
      isRosiereCfpDataComplete({
        ...completeCfp,
        hadOtherFifplTrainingThisYear: true,
        otherFifplAmountAlreadyCoveredEur: 300,
      })
    ).toBe(true);
    expect(
      isRosiereCfpDataComplete({
        ...completeCfp,
        hadOtherFifplTrainingThisYear: true,
        otherFifplAmountAlreadyCoveredEur: null,
      })
    ).toBe(false);
  });

  it("déclenche l'envoi si un moniteur La Rosière n'a pas fourni les pièces", () => {
    expect(
      shouldSendRosiereCfpRequest({
        profession: "ski_instructor",
        locationKey: "la-rosiere",
        fundingMode: "fifpl_stagiaire_solde_ecole",
      })
    ).toBe(true);
    expect(
      shouldSendRosiereCfpRequest({
        profession: "ski_instructor",
        locationKey: "la-rosiere",
        ...completeCfp,
      })
    ).toBe(false);
    expect(
      shouldSendRosiereCfpRequest({
        profession: "ski_instructor",
        locationKey: "meribel",
        fundingMode: "forfait_ecole",
      })
    ).toBe(false);
  });

  it("lit le questionnaire depuis funding_details (cas Gaidet : statut sans attestation)", () => {
    const gaidet = parseFifplCfpFromFundingDetails({
      version: 1,
      fifpl: {
        status: "independant",
        cfpAttestationPath: null,
        cfpAttestationFileName: null,
        hadOtherFifplTrainingThisYear: false,
        estimatedRights: { hasCfpAttestation: false },
      },
    });
    expect(gaidet.status).toBe("independant");
    expect(isRosiereCfpDataComplete(gaidet)).toBe(false);
    expect(parseFifplCfpFromFundingDetails(null)).toEqual({});
  });

  it("compose le mail validé par Paula (sujet + 3 infos + reply info@fli.fr)", () => {
    const mail = renderRosiereCfpRequestEmail({
      studentName: "Christelle Gaidet",
      inscriptionCode: "FLI-260027",
    });
    expect(mail.subject).toBe("Attestation CFP — dossier FIF-PL La Rosière (FLI-260027)");
    expect(mail.html).toContain("Christelle Gaidet");
    expect(mail.html).toContain("FLI-260027");
    expect(mail.html).toContain("attestation CFP URSSAF 2026");
    expect(mail.html).toContain("indépendant");
    expect(mail.html).toContain("micro-entrepreneur");
    expect(mail.html).toContain("montant déjà pris en charge par le FIF-PL en 2026");
    expect(mail.html).toContain("reste à charge de l'ESF");
    expect(mail.html).toContain("info@fli.fr");
    expect(ROSIERE_CFP_EMAIL_SLUG).toBe("rosiere_cfp_missing");
    expect(ROSIERE_CFP_EMAIL_SUBJECT).toContain("{{inscription_code}}");
    expect(ROSIERE_CFP_EMAIL_HTML).toContain("{{student_name}}");
  });

  it("garde la copie Deno d'accord avec le module front", () => {
    const front = source("src/lib/rosiere-cfp-request.ts");
    const deno = source("supabase/functions/_shared/rosiere-cfp-request.ts");
    const extraire = (texte: string, nom: string) => {
      const debut = texte.indexOf(`export function ${nom}`);
      expect(debut).toBeGreaterThan(-1);
      const fin = texte.indexOf("\nexport ", debut + 1);
      return texte.slice(debut, fin === -1 ? undefined : fin);
    };
    expect(extraire(deno, "isLaRosiereSession")).toBe(extraire(front, "isLaRosiereSession"));
    expect(extraire(deno, "shouldSendRosiereCfpRequest")).toBe(
      extraire(front, "shouldSendRosiereCfpRequest")
    );
    expect(extraire(deno, "isRosiereCfpDataComplete")).toBe(
      extraire(front, "isRosiereCfpDataComplete")
    );
    expect(extraire(deno, "renderRosiereCfpRequestEmail")).toBe(
      extraire(front, "renderRosiereCfpRequestEmail")
    );
    expect(extraire(deno, "parseFifplCfpFromFundingDetails")).toBe(
      extraire(front, "parseFifplCfpFromFundingDetails")
    );
  });

  it("branche l'envoi auto dans submit-registration", () => {
    const edge = source("supabase/functions/submit-registration/index.ts");
    expect(edge).toContain("shouldSendRosiereCfpRequest");
    expect(edge).toContain("ROSIERE_CFP_EMAIL_SLUG");
    expect(edge).toContain("renderRosiereCfpRequestEmail");
  });

  it("expose un backfill service-role sans requireStaff", () => {
    const edge = source("supabase/functions/send-rosiere-cfp-request/index.ts");
    expect(edge).toContain("inscriptionIds");
    expect(edge).toContain("ROSIERE_CFP_EMAIL_SLUG");
    expect(edge).not.toContain('from "../_shared/admin-auth.ts"');
    const toml = source("supabase/config.toml");
    expect(toml).toContain("[functions.send-rosiere-cfp-request]");
  });

  it("affiche le questionnaire CFP aux moniteurs La Rosière même en financement école", () => {
    const payment = source("src/components/registration/PaymentStep.tsx");
    expect(payment).toContain("rosiereInstructor");
    expect(payment).toContain("showFifplQuestionnaire");
  });
});
