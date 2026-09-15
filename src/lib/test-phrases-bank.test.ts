import { describe, expect, it } from "vitest";
import testPhrasesComplete from "@/data/test_phrases_complete.json";
import {
  PHRASE_BANK_ALL,
  blocCommentsWithoutPhrases,
  filterPhraseBank,
  phraseIdsForBloc,
  fileCategoryLabel,
  fileLanguageForBooking,
  fileLanguageLabel,
  phraseBankCategories,
  phraseBankCounts,
  phraseBankLanguages,
  type PhraseBankItem,
} from "./test-phrases-bank";

function phrase(overrides: Partial<PhraseBankItem> & { id: string }): PhraseBankItem {
  return {
    code: null,
    language: "COMMON",
    category: "INTRODUCTION",
    text_fr: "Texte",
    order_index: 1,
    ...overrides,
  };
}

const bank: PhraseBankItem[] = [
  phrase({ id: "1", code: "INTRO-01", language: "COMMON", category: "INTRODUCTION", order_index: 1, context: "Accueil candidat", text_fr: "Bienvenue à ce test de langue." }),
  phrase({ id: "2", code: "EXPR-PT-03", language: "PT", category: "PRONONCIATION", order_index: 120, is_correction: true, error_type: "R français", text_fr: "Votre « R » français est trop marqué." }),
  phrase({ id: "3", code: "GRAM-EN-04", language: "EN", category: "GRAMMAIRE", order_index: 300, text_fr: "L'adjectif se place AVANT le nom en anglais." }),
  phrase({ id: "4", code: "VOC-PT-02", language: "PT", category: "VOCABULAIRE", order_index: 150, text_fr: "Le vocabulaire des remontées mécaniques est maîtrisé." }),
];

describe("fileLanguageForBooking", () => {
  it("traduit les codes de l'application vers les étiquettes du fichier", () => {
    expect(fileLanguageForBooking("anglais")).toBe("EN");
    expect(fileLanguageForBooking("portugais")).toBe("PT");
    expect(fileLanguageForBooking("neerlandais")).toBe("NL");
    expect(fileLanguageForBooking("chinois")).toBe("ZH");
    expect(fileLanguageForBooking("fle")).toBe("FR");
  });

  it("laisse passer une étiquette déjà au format du fichier", () => {
    expect(fileLanguageForBooking("EN")).toBe("EN");
    expect(fileLanguageForBooking("zh")).toBe("ZH");
  });

  it("retombe sur COMMON quand la langue est absente ou inconnue", () => {
    expect(fileLanguageForBooking(null)).toBe("COMMON");
    expect(fileLanguageForBooking("")).toBe("COMMON");
    expect(fileLanguageForBooking("all")).toBe("COMMON");
    expect(fileLanguageForBooking("klingon")).toBe("COMMON");
  });
});

describe("libellés", () => {
  it("affiche les étiquettes du fichier en français sans les renommer en base", () => {
    expect(fileLanguageLabel("PT")).toBe("Portugais brésilien");
    expect(fileCategoryLabel("PRONONCIATION")).toBe("Prononciation");
    expect(fileCategoryLabel("INCONNUE")).toBe("INCONNUE");
  });
});

describe("filterPhraseBank", () => {
  it("remonte la langue demandée et les phrases COMMON", () => {
    const result = filterPhraseBank(bank, { language: "PT", category: PHRASE_BANK_ALL });
    expect(result.map((p) => p.id)).toEqual(["1", "2", "4"]);
  });

  it("filtre par catégorie indépendamment du bloc", () => {
    const result = filterPhraseBank(bank, { language: PHRASE_BANK_ALL, category: "GRAMMAIRE" });
    expect(result.map((p) => p.id)).toEqual(["3"]);
  });

  it("croise langue et catégorie", () => {
    const result = filterPhraseBank(bank, { language: "PT", category: "PRONONCIATION" });
    expect(result.map((p) => p.id)).toEqual(["2"]);
  });

  it("cherche sans tenir compte des accents ni de la casse", () => {
    expect(
      filterPhraseBank(bank, { language: PHRASE_BANK_ALL, category: PHRASE_BANK_ALL, search: "remontees" }).map((p) => p.id),
    ).toEqual(["4"]);
    expect(
      filterPhraseBank(bank, { language: PHRASE_BANK_ALL, category: PHRASE_BANK_ALL, search: "GRAM-EN" }).map((p) => p.id),
    ).toEqual(["3"]);
    expect(
      filterPhraseBank(bank, { language: PHRASE_BANK_ALL, category: PHRASE_BANK_ALL, search: "r francais" }).map((p) => p.id),
    ).toEqual(["2"]);
  });

  it("ne retient rien quand le croisement est vide", () => {
    expect(filterPhraseBank(bank, { language: "EN", category: "VOCABULAIRE" })).toEqual([]);
  });

  it("place COMMON en tête puis suit l'ordre du fichier", () => {
    const result = filterPhraseBank(bank, { language: PHRASE_BANK_ALL, category: PHRASE_BANK_ALL });
    expect(result.map((p) => p.id)).toEqual(["1", "3", "2", "4"]);
  });
});

describe("options et comptages", () => {
  it("liste les langues présentes avec COMMON en tête", () => {
    expect(phraseBankLanguages(bank)).toEqual(["COMMON", "EN", "PT"]);
  });

  it("liste les catégories dans l'ordre du fichier", () => {
    expect(phraseBankCategories(bank)).toEqual([
      "INTRODUCTION",
      "PRONONCIATION",
      "GRAMMAIRE",
      "VOCABULAIRE",
    ]);
  });

  it("compte par langue et par catégorie", () => {
    expect(phraseBankCounts(bank)).toEqual({
      total: 4,
      byLanguage: { COMMON: 1, EN: 1, PT: 2 },
      byCategory: { INTRODUCTION: 1, PRONONCIATION: 1, GRAMMAIRE: 1, VOCABULAIRE: 1 },
    });
  });
});

describe("reprise d'un brouillon", () => {
  it("rattache chaque phrase au bloc dont le texte la contient", () => {
    const blocIntro = "Bienvenue à ce test de langue. Candidat ponctuel.";
    const blocTechnique = "L'adjectif se place AVANT le nom en anglais.";
    const ids = ["1", "3"];

    expect(phraseIdsForBloc(ids, bank, blocIntro)).toEqual(["1"]);
    expect(phraseIdsForBloc(ids, bank, blocTechnique)).toEqual(["3"]);
  });

  it("ne rattache rien si le bloc est vide", () => {
    expect(phraseIdsForBloc(["1"], bank, "")).toEqual([]);
    expect(phraseIdsForBloc(["1"], bank, null)).toEqual([]);
    expect(phraseIdsForBloc([], bank, "Bienvenue à ce test de langue.")).toEqual([]);
  });

  it("retire les phrases du bloc pour ne garder que le commentaire libre", () => {
    expect(
      blocCommentsWithoutPhrases("Bienvenue à ce test de langue. Candidat ponctuel.", [
        "Bienvenue à ce test de langue.",
      ]),
    ).toBe("Candidat ponctuel.");
  });

  it("rend une chaîne vide quand le bloc ne contenait que des phrases", () => {
    expect(
      blocCommentsWithoutPhrases("Bienvenue à ce test de langue.", [
        "Bienvenue à ce test de langue.",
      ]),
    ).toBe("");
    expect(blocCommentsWithoutPhrases(null, [])).toBe("");
  });
});

describe("test_phrases_complete.json", () => {
  const phrases = testPhrasesComplete.phrases as PhraseBankItem[];

  it("contient 445 phrases là où la métadonnée en annonce 540", () => {
    expect(testPhrasesComplete.metadata.total_phrases).toBe(540);
    expect(phrases).toHaveLength(445);
  });

  it("garde les comptages par langue et par catégorie du fichier", () => {
    const counts = phraseBankCounts(phrases);
    expect(counts.byLanguage).toEqual({
      COMMON: 45,
      EN: 82,
      PT: 40,
      ES: 40,
      NL: 36,
      RU: 36,
      IT: 39,
      ZH: 36,
      DE: 42,
      FR: 49,
    });
    expect(counts.byCategory).toEqual({
      INTRODUCTION: 15,
      COMPREHENSION: 20,
      CONCLUSION: 10,
      PRONONCIATION: 96,
      GRAMMAIRE: 194,
      VOCABULAIRE: 110,
    });
  });

  it("n'a ni code manquant ni code en double", () => {
    const codes = phrases.map((p) => p.code);
    expect(codes.filter((code) => !code)).toEqual([]);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("a un encodage lisible : pas de séquence mojibake résiduelle", () => {
    // « Ã » suivi d'un caractère latin-1 haut trahit un double encodage UTF-8,
    // alors que « -ÃO » du portugais est légitime.
    const mojibake = /[ÃÂ][\u0080-\u00bf]|â€|\uFFFD/;
    const suspicious = phrases.filter((p) => mojibake.test(p.text_fr));
    expect(suspicious).toEqual([]);
  });

  it("n'utilise que les étiquettes de langue et de catégorie connues", () => {
    expect(phraseBankLanguages(phrases).every((code) => fileLanguageLabel(code) !== code)).toBe(true);
    expect(phraseBankCategories(phrases).every((code) => fileCategoryLabel(code) !== code)).toBe(true);
  });
});
