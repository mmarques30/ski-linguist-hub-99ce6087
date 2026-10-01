/**
 * Remplit la demande AGEFICE éditable pour un stagiaire (preview / dossier).
 * Champs inconnus laissés vides pour complétion manuelle (PTA, SIRET, NSS…).
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { inflateSync } from "node:zlib";

async function main() {
  const { PDFDocument } = await import("pdf-lib");
  const src =
    "public/registration-documents/agefice-demande-prise-en-charge-2025-2026.pdf";
  const bytes = readFileSync(src);
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const form = pdf.getForm();

  const setText = (name: string, value: string) => {
    try {
      form.getTextField(name).setText(value);
    } catch (e) {
      console.warn("text field missing:", name, e);
    }
  };
  const check = (name: string) => {
    try {
      form.getCheckBox(name).check();
    } catch (e) {
      console.warn("checkbox missing:", name, e);
    }
  };

  // —— Entreprise (partiel : raison = école / activité déclarée) ——
  setText("Nom / Raison Sociale de L'entreprise (Entreprise)", "Meribel");
  setText("Nom commercial de l'entreprise (Entreprise)", "Meribel");
  setText("Activité Professionnelle (Entreprise)", "Moniteur de ski / commerce");
  // Adresse perso connue — souvent aussi siège micro ; à confirmer
  setText("Adresse Entreprise", "10 Rue Paul Doumer");
  setText("Code Postal (Entreprise)", "06310");
  setText("Ville (Entreprise)", "Beaulieu sur mer");

  // —— Stagiaire ——
  check("MR (Stagiaire)");
  setText("Nom (Stagiaire)", "Testut");
  setText("Prénom  (Stagiaire)", "Marc");
  setText("N° de Téléphone  (Stagiaire)", "0611587278");
  setText("Adresse Email  (Stagiaire)", "marc.testut@gmail.com");

  // —— Organisme de formation FLI ——
  setText("Raison Sociale ( OF)", "France Langues International");
  setText("NDA (OF)", "82 73 01 366 73");
  setText("N° SIRET (OF)", "484 772 041 00048");
  setText("Adresse (OF)", "25 avenue de la Gare");
  setText("Code Postal (OF)", "73800");
  setText("Ville (OF)", "Montmélian");
  check("MME (Resp.OF)");
  setText("Nom Responsable (OF)", "Rangel Halbwachs");
  setText("Prénom Responsable (OF)", "Paula");
  setText("N° de Téléphone - Responsable (OF)", "0479282109");
  setText("Adresse Email - Responsable (OF)", "info@fli.fr");
  check("MME (Contact OF)");
  setText("Nom - Contact (OF)", "Rangel Halbwachs");
  setText("Prénom - Contact (OF)", "Paula");
  setText("N° de Téléphone - Contact (OF)", "0479282109");
  setText("Adresse Email - Contact (OF)", "info@fli.fr");

  // —— Formation ——
  check("Action de Formation");
  check("Obligatoire (Non)");
  check("reconversion ( Non)");
  setText(
    "Intitulé Exact ( Formation)",
    "Formation professionnelle en russe pour moniteurs de ski",
  );
  setText(
    "Thématique (Formation)",
    "Langues étrangères — accueil et conseil clientèle internationale en station",
  );
  check("Perfectionnement");
  check("Sans Qualification");
  setText("Date de Début (Formation)", "30/11/2026");
  setText("Date de Fin (Formation)", "04/12/2026");
  // Présentiel station — durée collective (séance groupe) ; si individuel, déplacer.
  setText("Durée ( Présentiel Collectif - Formation)", "24");
  setText("Prix Ht (Formation)", "950");
  check("Form en Entreprise (Non)");
  setText("Code Postal (Lieu de Formation)", "73570");
  setText("Ville (Lieu de Formation)", "Brides-les-Bains");
  setText(
    "Nom et Adresse exacte du lieu de formation",
    "Brides-les-Bains (73570) — formation en présentiel organisée par FLI",
  );
  setText(
    "Déroulement Pédagogique (Formation) - 1 -",
    "Cours en présentiel collectif : compréhension et expression orales professionnelles, " +
      "vocabulaire technique ski / sécurité / conditions de neige, jeux de rôle clientèle. " +
      "Évaluation formative continue + bilan. Contrôle d'assiduité par feuilles de présence.",
  );
  check("Contrôle continu");
  check("Feuilles de présence");
  check("Attestation de Stage");

  // Mandat OF pour suivi dossier — case à cocher pour faciliter (Paula peut décocher)
  check("Mandat (Oui)");
  setText("Lieu de Signature", "Montmélian");
  setText("Date de Signature", "01/10/2026");

  // Ne pas aplatir : Marc / FLI doivent pouvoir encore éditer / signer.
  const outBytes = await pdf.save({ updateFieldAppearances: true });
  mkdirSync("/opt/cursor/artifacts", { recursive: true });
  const outPath =
    "/opt/cursor/artifacts/AGEFICE-Demande-FLI-260020-Marc-Testut-PREREMPLIE.pdf";
  writeFileSync(outPath, outBytes);
  console.log("wrote", outPath, outBytes.byteLength);

  // Copie aussi convention/programme déjà générés si présents
  for (const f of [
    "Convention-formation-FLI-260020.pdf",
    "Programme-formation-FLI-260020.pdf",
  ]) {
    try {
      const b = readFileSync(`/opt/cursor/artifacts/${f}`);
      console.log("kept", f, b.byteLength);
    } catch {
      console.warn("missing", f);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
