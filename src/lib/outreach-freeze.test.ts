import { describe, expect, it } from "vitest";
import {
  OUTREACH_ENABLED_ENV,
  outreachFreezeState,
  verifierConformiteRgpd,
} from "../../supabase/functions/_shared/outreach-freeze";
import {
  MESSAGE_GEL_PROSPECTION,
  PROSPECTION_MONITEURS_GELEE,
  assertProspectionNonGelee,
} from "./prospection-gel";

function env(values: Record<string, string>) {
  return { get: (name: string) => values[name] };
}

describe("gel de la prospection — variable d'environnement bloquante", () => {
  it("gèle quand la variable est absente", () => {
    expect(outreachFreezeState(env({})).frozen).toBe(true);
  });

  it("gèle quand la variable est vide", () => {
    expect(outreachFreezeState(env({ [OUTREACH_ENABLED_ENV]: "" })).frozen).toBe(true);
  });

  it.each(["false", "0", "1", "oui", "yes", "TRUE ", "vrai", "enabled"])(
    "gèle quand la variable vaut %o",
    (valeur) => {
      const state = outreachFreezeState(env({ [OUTREACH_ENABLED_ENV]: valeur }));
      if (valeur.trim().toLowerCase() === "true") {
        expect(state.frozen).toBe(false);
      } else {
        expect(state.frozen).toBe(true);
      }
    }
  );

  it("ne dégèle que sur la valeur exacte « true »", () => {
    expect(outreachFreezeState(env({ [OUTREACH_ENABLED_ENV]: "true" })).frozen).toBe(false);
  });

  it("renvoie un message qui renvoie à la procédure de réactivation", () => {
    const { message } = outreachFreezeState(env({}));
    expect(message).toContain("validation écrite");
    expect(message).toContain("désinscription");
    expect(message).toContain("RGPD");
  });
});

describe("condition de réouverture — désinscription et mention RGPD", () => {
  const gabaritConforme = `
    <p>Bonjour Camille,</p>
    <p>Une session de formation est ouverte.</p>
    <p><a href="https://exemple.fli.fr/desinscription?token=abc">Se désinscrire</a></p>
    <p>Vos données personnelles sont traitées conformément au RGPD.</p>
  `;

  it("accepte un gabarit qui porte les deux mentions", () => {
    expect(verifierConformiteRgpd(gabaritConforme)).toEqual({
      conforme: true,
      manquants: [],
    });
  });

  it("refuse le gabarit de prospection actuellement en base", () => {
    const gabaritActuel = `
      <h2>Bonjour Camille,</h2>
      <p>Une nouvelle session de formation linguistique est ouverte :</p>
      <p><a href="https://exemple.fli.fr/register">S'inscrire en ligne →</a></p>
      <p>Cordialement,<br/>L'équipe France Langues International</p>
    `;
    const { conforme, manquants } = verifierConformiteRgpd(gabaritActuel);
    expect(conforme).toBe(false);
    expect(manquants).toEqual(["lien de désinscription", "mention RGPD"]);
  });

  it("refuse le HTML de repli codé en dur dans l'edge function", () => {
    const repli = "<p>Bonjour Camille, une formation anglais est ouverte à Courchevel.</p>";
    expect(verifierConformiteRgpd(repli).conforme).toBe(false);
  });

  it("refuse un gabarit dont le lien de désinscription n'a pas été substitué", () => {
    const html = gabaritConforme.replace(
      "https://exemple.fli.fr/desinscription?token=abc",
      "{{unsubscribe_url}}"
    );
    // Le motif « unsubscribe » est bien présent dans l'URL, mais le gabarit
    // n'a pas été rendu : le lien enverrait le destinataire nulle part.
    const { conforme, manquants } = verifierConformiteRgpd(html);
    expect(conforme).toBe(false);
    expect(manquants).toEqual(["variable de gabarit non substituée"]);
  });

  it("refuse une mention RGPD sans lien de désinscription", () => {
    const html =
      "<p>Vos données personnelles sont traitées conformément au RGPD.</p>";
    expect(verifierConformiteRgpd(html).manquants).toEqual(["lien de désinscription"]);
  });

  it("refuse un lien de désinscription sans mention RGPD", () => {
    const html = '<p><a href="https://exemple.fli.fr/unsubscribe">Se désabonner</a></p>';
    expect(verifierConformiteRgpd(html).manquants).toEqual(["mention RGPD"]);
  });
});

describe("garde-fou applicatif", () => {
  it("la prospection est gelée dans cette version", () => {
    expect(PROSPECTION_MONITEURS_GELEE).toBe(true);
  });

  it("toute écriture ou tout envoi lève une erreur explicite", () => {
    expect(() => assertProspectionNonGelee()).toThrowError(
      new RegExp(MESSAGE_GEL_PROSPECTION.slice(0, 40).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    );
  });
});
