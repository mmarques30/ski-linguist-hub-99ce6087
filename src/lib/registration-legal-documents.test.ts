import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  canAcceptLegalTerms,
  CONDITIONS_GENERALES_PATH,
  isLegalDocumentReadable,
  LEGAL_DOCUMENT_ON_REQUEST_NOTICE,
  legalDocumentTitle,
  REGISTRATION_LEGAL_DOCUMENT_LIST,
  REGISTRATION_LEGAL_DOCUMENTS,
} from "./registration-legal-documents";
import {
  CONDITIONS_GENERALES_SECTIONS,
  CONDITIONS_GENERALES_PROVENANCE,
} from "./conditions-generales-content";

/**
 * BL-023 — la case « J'accepte les conditions générales » doit donner accès au
 * texte, avant la case, dans un nouvel onglet.
 *
 * Le piège corrigé ici : les deux liens existaient mais pointaient vers des PDF
 * absents de `public/registration-documents/`, donc en 404.
 */

const RACINE = process.cwd();

describe("documents juridiques de /register", () => {
  it("les conditions générales sont lisibles", () => {
    const cg = REGISTRATION_LEGAL_DOCUMENTS.conditionsGenerales;
    expect(cg.availability).toBe("page");
    expect(cg.href).toBe(CONDITIONS_GENERALES_PATH);
    expect(isLegalDocumentReadable(cg)).toBe(true);
    expect(canAcceptLegalTerms()).toBe(true);
  });

  it("ne référence plus aucun fichier absent du dépôt", () => {
    for (const document of REGISTRATION_LEGAL_DOCUMENT_LIST) {
      if (document.availability !== "file") continue;
      const chemin = join(RACINE, "public", document.href ?? "");
      expect(existsSync(chemin), `${document.href} doit exister`).toBe(true);
    }
  });

  it("annonce le règlement intérieur sur demande au lieu d'un lien mort", () => {
    const ri = REGISTRATION_LEGAL_DOCUMENTS.reglementInterieur;
    expect(ri.availability).toBe("on_request");
    expect(ri.href).toBeUndefined();
    expect(isLegalDocumentReadable(ri)).toBe(false);
    expect(LEGAL_DOCUMENT_ON_REQUEST_NOTICE).toContain("info@fli.fr");
  });

  it("titre chaque document en tête de liste", () => {
    expect(legalDocumentTitle(REGISTRATION_LEGAL_DOCUMENTS.conditionsGenerales)).toBe(
      "Conditions générales de formation"
    );
    expect(legalDocumentTitle(REGISTRATION_LEGAL_DOCUMENTS.reglementInterieur)).toBe(
      "Règlement intérieur"
    );
  });

  it("place la liste avant la case à cocher de l'étape 7", () => {
    const etape = readFileSync(
      join(RACINE, "src", "components/registration/ConfirmationStep.tsx"),
      "utf8"
    );
    const liste = etape.indexOf("À lire avant d&apos;accepter");
    const caseACocher = etape.indexOf('id="terms"');
    expect(liste).toBeGreaterThan(-1);
    expect(caseACocher).toBeGreaterThan(-1);
    expect(liste).toBeLessThan(caseACocher);
    expect(etape).toContain('target="_blank"');
    expect(etape).not.toContain(".pdf");
  });

  it("expose la page publique des conditions générales", () => {
    const routes = readFileSync(join(RACINE, "src", "App.tsx"), "utf8");
    const ligne = routes
      .split("\n")
      .find((l) => l.includes(CONDITIONS_GENERALES_PATH));
    expect(ligne).toBeTruthy();
    // La page se lit sans être connecté : jamais derrière ProtectedRoute.
    expect(ligne).not.toContain("ProtectedRoute");
  });

  it("couvre les articles attendus, sans texte inventé sans provenance", () => {
    const titres = CONDITIONS_GENERALES_SECTIONS.map((s) => s.id);
    expect(titres).toEqual([
      "objet",
      "tarif",
      "retractation",
      "seances",
      "interruption",
      "accessibilite",
      "donnees",
      "litiges",
    ]);
    for (const section of CONDITIONS_GENERALES_SECTIONS) {
      expect(section.paragraphs.length, section.id).toBeGreaterThan(0);
      for (const paragraphe of section.paragraphs) {
        expect(paragraphe.trim(), section.id).not.toBe("");
      }
    }
    expect(CONDITIONS_GENERALES_PROVENANCE).toContain("convention");
  });

  it("reprend les règles chiffrées de la convention FLI", () => {
    const texte = CONDITIONS_GENERALES_SECTIONS.flatMap((s) => s.paragraphs).join(" ");
    expect(texte).toContain("10 jours");
    expect(texte).toContain("24 heures");
    expect(texte).toContain("150 €");
    expect(texte).toContain("tribunal de Chambéry");
    expect(texte).toContain("L.6313-1");
  });
});
