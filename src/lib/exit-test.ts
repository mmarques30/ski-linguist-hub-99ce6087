/**
 * Test de fin de formation — garde-fou avant le pack de clôture.
 *
 * Le test reprend le moteur de positionnement (pistes). L'invitation
 * publique utilise `placement_tests.invite_token` + `inscriptions.exit_test_id`.
 *
 * Envoi automatique :
 * - collectives : dernier jour (`end_date` = aujourd'hui Paris) via cron ;
 * - individuelles : dès que Paula / le formateur déclare la fin
 *   (formulaire de sortie ou statut Terminée).
 */

export type ExitTestSnapshot = {
  exit_test_id?: string | null;
  exit_test_invited_at?: string | null;
  exit_test_completed_at?: string | null;
};

export type ExitTestFormationKind = "collective" | "individuelle";

/** Aligné sur `inferFormationKindFifpl` — discriminateur d'envoi auto. */
export function exitTestFormationKind(input: {
  courseType?: string | null;
  modality?: string | null;
}): ExitTestFormationKind {
  const course = (input.courseType || "").toLowerCase();
  if (course.includes("collect")) return "collective";
  if (course.includes("individ")) return "individuelle";
  const mod = (input.modality || "").toLowerCase();
  if (mod.includes("collect") || mod.includes("groupe")) {
    return "collective";
  }
  return "individuelle";
}

const CANCELLED_STATUSES = new Set([
  "annulee",
  "annulée",
  "cancelled",
  "canceled",
]);

export function isExitTestEligibleStatus(status: string | null | undefined): boolean {
  const s = (status || "").trim().toLowerCase();
  if (!s) return false;
  if (CANCELLED_STATUSES.has(s)) return false;
  if (s === "brouillon" || s === "en_attente") return false;
  return true;
}

/**
 * Collectives : invitation le jour de `end_date` (calendrier Paris).
 * Comparer `endDate` et `todayParis` en YYYY-MM-DD.
 */
export function shouldAutoInviteCollectiveOnLastDay(input: {
  courseType?: string | null;
  modality?: string | null;
  endDate?: string | null;
  todayParis: string;
  status?: string | null;
  exit_test_invited_at?: string | null;
  exit_test_completed_at?: string | null;
}): boolean {
  if (exitTestFormationKind(input) !== "collective") return false;
  if (!isExitTestEligibleStatus(input.status)) return false;
  if (input.exit_test_invited_at || input.exit_test_completed_at) return false;
  const end = (input.endDate || "").slice(0, 10);
  return Boolean(end && end === input.todayParis);
}

/**
 * Individuelles : dès déclaration de fin (bilan sortie ou statut Terminée).
 */
export function shouldAutoInviteIndividualOnFinished(input: {
  courseType?: string | null;
  modality?: string | null;
  status?: string | null;
  exit_form_completed_at?: string | null;
  exit_test_invited_at?: string | null;
  exit_test_completed_at?: string | null;
}): boolean {
  if (exitTestFormationKind(input) !== "individuelle") return false;
  if (!isExitTestEligibleStatus(input.status)) return false;
  if (input.exit_test_invited_at || input.exit_test_completed_at) return false;
  const finished =
    Boolean(input.exit_form_completed_at) ||
    (input.status || "").trim().toLowerCase() === "terminee";
  return finished;
}

export function isExitTestCompleted(snapshot: ExitTestSnapshot): boolean {
  return Boolean(snapshot.exit_test_id && snapshot.exit_test_completed_at);
}

export function isExitTestInvited(snapshot: ExitTestSnapshot): boolean {
  return Boolean(snapshot.exit_test_id || snapshot.exit_test_invited_at);
}

/**
 * Raison, en français, pour laquelle le pack de fin ne peut pas encore
 * être généré faute de test de sortie. `null` quand le test est OK.
 */
export function exitTestBlocksEndPack(
  snapshot: ExitTestSnapshot
): string | null {
  if (isExitTestCompleted(snapshot)) return null;
  if (isExitTestInvited(snapshot)) {
    return "Le test de fin de formation a été envoyé mais n'est pas encore complété — le dossier de fin ne peut pas être déclenché.";
  }
  return "Le test de fin de formation est obligatoire avant le dossier de fin — envoyez d'abord l'invitation au stagiaire.";
}

export function buildExitTestLink(
  appUrl: string,
  inviteToken: string
): string {
  const base = appUrl.replace(/\/$/, "");
  return `${base}/exit-test/${inviteToken}`;
}

export const EXIT_TEST_INVITE_SLUG = "exit_test_invite";
