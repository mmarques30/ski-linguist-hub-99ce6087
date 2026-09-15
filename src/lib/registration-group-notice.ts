/**
 * BL-028 — décision Paula : le message sur l'attribution du groupe matin /
 * après-midi ne concerne que les collectifs en station. Un cours en ligne
 * (individuel ou petit groupe) n'a pas de groupe matin / après-midi : l'afficher
 * quand même promet un fonctionnement qui n'existe pas. Le message est signé
 * « l'équipe FLI », jamais du prénom de la directrice.
 */

/** Modalités « collectif en station », côté formulaire et côté base. */
const MODALITES_STATION = new Set(["in_person", "presentiel", "présentiel"]);

export function expectsStationGroupAssignment(
  modality?: string | null
): boolean {
  if (!modality) return false;
  return MODALITES_STATION.has(modality.trim().toLowerCase());
}

export const STATION_GROUP_SIGNATURE = "l'équipe FLI";

/** Avant le test : ce qui se passera après l'inscription. */
export const STATION_GROUP_NOTICE_BEFORE_TEST =
  "Le groupe du matin ou de l'après-midi est attribué par l'équipe FLI environ " +
  "10 jours avant le début des cours, après analyse de l'ensemble des inscrits.";

/** Après le test et sur le récapitulatif : même règle, formulée au futur. */
export const STATION_GROUP_NOTICE_AFTER_TEST =
  "Votre groupe (matin ou après-midi) vous sera confirmé environ 10 jours avant " +
  "le début des cours, après analyse de l'ensemble des inscrits.";
