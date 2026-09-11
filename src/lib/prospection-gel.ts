/**
 * Gel de la prospection « moniteurs de ski » (point 5).
 *
 * Le gel est porté par la base : `ski_monitors` et `partners` sont en lecture
 * seule (migration 20260910150000_gel_prospection_moniteurs), et l'edge function
 * `process-intake-outreach` refuse tout appel tant que la variable
 * d'environnement OUTREACH_MONITEURS_ENABLED ne vaut pas « true ».
 *
 * Les garde-fous ci-dessous ne remplacent pas cette protection : ils évitent
 * simplement de proposer une action qui échouerait, et affichent un message
 * explicite plutôt qu'une erreur de politique de sécurité.
 *
 * Levée du gel : validation écrite de la direction, migration de retour
 * (docs/GEL_PROSPECTION_MONITEURS.md), puis passage de cette constante à false.
 */
export const PROSPECTION_MONITEURS_GELEE: boolean = true;

export const MESSAGE_GEL_PROSPECTION =
  "Prospection moniteurs gelée : la base moniteurs et la base partenaires sont en lecture seule, et aucun email de prospection ne peut partir.";

export const MESSAGE_GEL_REACTIVATION =
  "La réactivation suppose une validation écrite de la direction. Aucun email ne repartira sans lien de désinscription ni mention RGPD.";

export function assertProspectionNonGelee(): void {
  if (PROSPECTION_MONITEURS_GELEE) {
    throw new Error(`${MESSAGE_GEL_PROSPECTION} ${MESSAGE_GEL_REACTIVATION}`);
  }
}
