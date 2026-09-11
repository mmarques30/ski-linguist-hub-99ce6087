/**
 * Gel de la prospection « moniteurs de ski » (point 5).
 *
 * La prospection est gelée par défaut. `process-intake-outreach` refuse tout appel
 * — y compris en `dry_run` — tant que la variable d'environnement
 * OUTREACH_MONITEURS_ENABLED ne vaut pas exactement « true » : toute autre valeur,
 * y compris « True » ou « TRUE », maintient le gel.
 *
 * Deux conditions cumulatives pour rouvrir la prospection :
 *   1. validation écrite de la direction, matérialisée par la pose de la variable
 *      d'environnement et par la levée du gel en base (migration de retour) ;
 *   2. présence, dans CHAQUE email, d'un lien de désinscription et d'une mention
 *      RGPD — vérifiée à l'exécution par `verifierConformiteRgpd`, qui bloque
 *      l'envoi avant le premier appel au fournisseur d'emails.
 *
 * Voir docs/GEL_PROSPECTION_MONITEURS.md.
 *
 * Ce module ne contient aucune dépendance Deno : il est couvert par les tests
 * unitaires du dépôt (src/lib/outreach-freeze.test.ts).
 */

export const OUTREACH_ENABLED_ENV = "OUTREACH_MONITEURS_ENABLED";

export const OUTREACH_FREEZE_MESSAGE =
  "Prospection moniteurs gelée (point 5). Aucun envoi, aucune simulation. " +
  "Réactivation soumise à validation écrite de la direction, et impossible sans " +
  "lien de désinscription et mention RGPD dans chaque email. " +
  "Voir docs/GEL_PROSPECTION_MONITEURS.md.";

export interface EnvLike {
  get(name: string): string | undefined;
}

export interface FreezeState {
  frozen: boolean;
  message: string;
}

/**
 * Comparaison stricte : toute valeur autre que « true » exactement — casse ou
 * espace compris — maintient le gel. Un interrupteur de sécurité doit échouer
 * du côté fermé.
 */
export function outreachFreezeState(env: EnvLike): FreezeState {
  if (env.get(OUTREACH_ENABLED_ENV) === "true") {
    return { frozen: false, message: "" };
  }
  return { frozen: true, message: OUTREACH_FREEZE_MESSAGE };
}

export interface RgpdCheck {
  conforme: boolean;
  manquants: string[];
}

const LIEN_DESINSCRIPTION =
  /href\s*=\s*["'][^"']*(desinscription|désinscription|desabonnement|désabonnement|unsubscribe|opt-?out)[^"']*["']/i;

const MENTION_RGPD =
  /(rgpd|données personnelles|donnees personnelles|protection des données|protection des donnees|règlement général sur la protection)/i;

const VARIABLE_NON_SUBSTITUEE = /\{\{\s*[\w.-]+\s*\}\}/;

/**
 * Contrôle du corps HTML réellement prêt à partir (variables déjà substituées).
 */
export function verifierConformiteRgpd(html: string): RgpdCheck {
  const manquants: string[] = [];

  if (!LIEN_DESINSCRIPTION.test(html)) {
    manquants.push("lien de désinscription");
  }
  if (!MENTION_RGPD.test(html)) {
    manquants.push("mention RGPD");
  }
  if (VARIABLE_NON_SUBSTITUEE.test(html)) {
    manquants.push("variable de gabarit non substituée");
  }

  return { conforme: manquants.length === 0, manquants };
}
