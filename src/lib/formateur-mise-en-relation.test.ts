import { describe, expect, it } from "vitest";
import {
  buildFormateurMiseEnRelationBodyText,
  buildFormateurMiseEnRelationSubject,
  buildFormateurMissionBodyText,
  buildFormateurMissionSubject,
  canSendFormateurMiseEnRelation,
  FORMATEUR_MISE_EN_RELATION_SLUG,
  formateurContactWord,
  formationLabelForMiseEnRelation,
} from "./formateur-mise-en-relation";

describe("formateur-mise-en-relation", () => {
  it("expose le slug journal", () => {
    expect(FORMATEUR_MISE_EN_RELATION_SLUG).toBe("formateur_mise_en_relation");
  });

  it("choisit formatrice pour Tatiana", () => {
    expect(formateurContactWord("Tatiana SAMOILOVA-MAGNIER")).toBe("formatrice");
  });

  it("construit sujet et corps avec fiches + CC implicite", () => {
    const subject = buildFormateurMiseEnRelationSubject({
      inscriptionCode: "FLI-260022",
      contactWord: "formatrice",
    });
    expect(subject).toMatch(/formatrice/);
    expect(subject).toMatch(/FLI-260022/);

    const body = buildFormateurMiseEnRelationBodyText({
      studentFirstName: "Michael",
      studentFullName: "Michael colonna cesari",
      inscriptionCode: "FLI-260022",
      language: "Russe",
      formationLabel: "russe en ligne (du 12/10/2026 au 31/03/2027)",
      formateurFullName: "Tatiana Samoilova-Magnier",
      formateurEmail: "tatiana1.samoilova@gmail.com",
      formateurPhone: "06 87 56 86 61",
      contactWord: "formatrice",
    });
    expect(body).toMatch(/Bonjour Michael/);
    expect(body).toMatch(/tatiana1\.samoilova@gmail\.com/);
    expect(body).toMatch(/06 87 56 86 61/);
    expect(body).toMatch(/fiches de présence/);
    expect(body).not.toMatch(/en copie/);
  });

  it("garde le bouton désactivé sans e-mails", () => {
    expect(
      canSendFormateurMiseEnRelation({
        studentEmail: "a@b.fr",
        formateurEmail: null,
        formateurName: "Tatiana",
      })
    ).toBe(false);
    expect(
      canSendFormateurMiseEnRelation({
        studentEmail: "colonna.michael@hotmail.fr",
        formateurEmail: "tatiana1.samoilova@gmail.com",
        formateurName: "Tatiana Samoilova-Magnier",
      })
    ).toBe(true);
  });

  it("libellé formation en ligne avec dates", () => {
    expect(
      formationLabelForMiseEnRelation({
        language: "Russe",
        modality: "en_ligne",
        startDate: "2026-10-12",
        endDate: "2027-03-31",
      })
    ).toBe("russe en ligne (du 12/10/2026 au 31/03/2027)");
  });

  it("construit le mail mission formateur séparé avec contrat", () => {
    const subject = buildFormateurMissionSubject({
      inscriptionCode: "FLI-260022",
      language: "Russe",
      studentFullName: "Michael colonna cesari",
      contractNumber: "CTR-2026-0002",
    });
    expect(subject).toMatch(/CTR-2026-0002/);
    expect(subject).toMatch(/Michael/);

    const body = buildFormateurMissionBodyText({
      formateurFirstName: "Tatiana",
      studentFullName: "Michael colonna cesari",
      studentEmail: "colonna.michael@hotmail.fr",
      studentPhone: "06 16 01 48 55",
      language: "Russe",
      durationHours: 12,
      periodLabel: "du 12/10/2026 au 31/03/2027",
      inscriptionCode: "FLI-260022",
      contractNumber: "CTR-2026-0002",
      hourlyRate: 30,
      totalAmountHt: 360,
    });
    expect(body).toMatch(/Bonjour Tatiana/);
    expect(body).toMatch(/te confier/);
    expect(body).toMatch(/ton engagement/);
    expect(body).toMatch(/Je te souhaite/);
    expect(body).not.toMatch(/\bvous\b/);
    expect(body).toMatch(/colonna\.michael@hotmail\.fr/);
    expect(body).toMatch(/CTR-2026-0002/);
    expect(body).toMatch(/360 € HT/);
    expect(body).toMatch(/contrat de prestation/);
  });
});
