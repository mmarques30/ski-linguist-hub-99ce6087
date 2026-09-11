import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Garde-fou RGPD : aucune donnée personnelle réelle dans le dépôt.
 *
 * Constat du 09/09/2026, corrigé le 10/09/2026 : un extrait de la liste de
 * prospection moniteurs avait été collé dans un test, avec deux personnes
 * identifiées, leurs adresses personnelles et leur statut d'abonnement.
 *
 * Ce test échoue si une adresse e-mail apparaît dans `src/` en dehors des
 * domaines réservés par la RFC 2606 ou des domaines de l'entreprise.
 * Pour un nouveau jeu d'essai, utiliser `@example.invalid`.
 */

const ROOT = join(process.cwd(), "src");

const DOMAINES_AUTORISES = [
  // RFC 2606 / RFC 6761 — non délivrables par construction
  "example.com",
  "example.org",
  "example.net",
  "example.invalid",
  "example.test",
  "exemple.com",
  // domaines de l'entreprise, présents dans les gabarits et les mentions légales
  "fli.fr",
  "fli-formation.fr",
  "fli-langues.fr",
  "france-langues-international.com",
  // valeurs d'aide de saisie
  "email.com",
];

const EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".json"];
const MOTIF_EMAIL = /[a-z0-9._%+-]+@([a-z0-9.-]+\.[a-z]{2,})/gi;

function listerFichiers(dir: string): string[] {
  return readdirSync(dir).flatMap((entree) => {
    const chemin = join(dir, entree);
    if (statSync(chemin).isDirectory()) return listerFichiers(chemin);
    return EXTENSIONS.some((e) => chemin.endsWith(e)) ? [chemin] : [];
  });
}

describe("hygiène des données du dépôt", () => {
  it("n'expose aucune adresse e-mail hors domaines réservés ou d'entreprise", () => {
    const infractions: string[] = [];

    for (const fichier of listerFichiers(ROOT)) {
      const contenu = readFileSync(fichier, "utf8");
      for (const trouve of contenu.matchAll(MOTIF_EMAIL)) {
        const domaine = trouve[1].toLowerCase();
        // `@types/...`, `@tanstack/...` : imports de paquets, pas des adresses
        if (!domaine.includes(".") || domaine.endsWith(".ts")) continue;
        if (DOMAINES_AUTORISES.includes(domaine)) continue;
        infractions.push(
          `${fichier.replace(process.cwd() + "/", "")} → @${domaine}`
        );
      }
    }

    expect(
      [...new Set(infractions)],
      "Adresse e-mail non autorisée dans src/. Utiliser @example.invalid pour un jeu d'essai."
    ).toEqual([]);
  });
});
