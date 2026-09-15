import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Garde-fou de langue : l'application est en français.
 *
 * Constat du 15/09/2026, pendant la recette : la page 404 affichait « Ops!
 * Página não encontrada », la carte de connexion administrateur était
 * entièrement en portugais (« Painel Administrativo », « Senha », « Entrar »),
 * et le tableau de bord d'accueil portait du portugais dans ses clés `fr:`
 * (« Dashboard de Gestão », « Atualizado agora »), donc visible en français.
 *
 * Deux contrôles :
 *   1. aucune clé `fr:` ne contient de portugais ;
 *   2. les écrans vus avant toute connexion (404, carte admin, écran d'attente)
 *      ne contiennent aucun mot portugais en dur.
 *
 * Les valeurs `"pt-BR":` sont évidemment exclues : ce sont les traductions
 * légitimes du sélecteur de langue.
 */

const ROOT = join(process.cwd(), "src");
const EXTENSIONS = [".ts", ".tsx"];

// Marqueurs exclusivement portugais : le français n'emploie ni ã, ni õ, et
// aucun de ces mots.
const MARQUEURS_PORTUGAIS = [
  "ã",
  "õ",
  "não",
  "você",
  "senha",
  "aluno",
  "carregando",
  "atualizado",
  "página",
  "voltar",
  "início",
  "painel",
  "entrar",
  "sucesso",
  "erro ",
  "cadastro",
  "usuário",
];

// Écrans atteignables sans être connecté : ils ne passent pas par le
// sélecteur de langue, donc tout doit y être en français.
const ECRANS_AVANT_CONNEXION = [
  "pages/NotFound.tsx",
  "components/auth/AuthCard.tsx",
  "components/auth/ProtectedRoute.tsx",
];

function listerFichiers(dir: string): string[] {
  return readdirSync(dir).flatMap((entree) => {
    const chemin = join(dir, entree);
    if (statSync(chemin).isDirectory()) return listerFichiers(chemin);
    return EXTENSIONS.some((e) => chemin.endsWith(e)) ? [chemin] : [];
  });
}

function portugaisDans(texte: string): string[] {
  const minuscule = texte.toLowerCase();
  return MARQUEURS_PORTUGAIS.filter((mot) => minuscule.includes(mot));
}

/** Valeurs des clés `fr:` d'un fichier, y compris sur plusieurs lignes. */
function valeursFrancaises(contenu: string): { ligne: number; valeur: string }[] {
  const resultats: { ligne: number; valeur: string }[] = [];
  contenu.split("\n").forEach((ligne, index) => {
    const trouve = ligne.match(/\bfr:\s*"((?:[^"\\]|\\.)*)"/);
    if (trouve) resultats.push({ ligne: index + 1, valeur: trouve[1] });
    const simple = ligne.match(/\bfr:\s*'((?:[^'\\]|\\.)*)'/);
    if (simple) resultats.push({ ligne: index + 1, valeur: simple[1] });
  });
  return resultats;
}

describe("langue de l'interface", () => {
  it("ne laisse aucun portugais dans une valeur fr:", () => {
    const infractions: string[] = [];

    for (const fichier of listerFichiers(ROOT)) {
      if (fichier.endsWith("messages-francais.test.ts")) continue;
      const contenu = readFileSync(fichier, "utf8");
      for (const { ligne, valeur } of valeursFrancaises(contenu)) {
        const mots = portugaisDans(valeur);
        if (mots.length > 0) {
          infractions.push(
            `${relative(process.cwd(), fichier)}:${ligne} « ${valeur} » → ${mots.join(", ")}`
          );
        }
      }
    }

    expect(infractions).toEqual([]);
  });

  it("garde les écrans d'avant connexion entièrement en français", () => {
    const infractions: string[] = [];

    for (const relatif of ECRANS_AVANT_CONNEXION) {
      const contenu = readFileSync(join(ROOT, relatif), "utf8");
      contenu.split("\n").forEach((ligne, index) => {
        // Les traductions pt-BR de ces fichiers sont légitimes.
        if (/"pt-BR":/.test(ligne)) return;
        const mots = portugaisDans(ligne);
        if (mots.length > 0) {
          infractions.push(`${relatif}:${index + 1} → ${mots.join(", ")}`);
        }
      });
    }

    expect(infractions).toEqual([]);
  });
});
