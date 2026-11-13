/**
 * Test de fin de formation — garde-fou avant le pack de clôture.
 *
 * Le test reprend le moteur de positionnement (pistes). L'invitation
 * publique utilise `placement_tests.invite_token` + `inscriptions.exit_test_id`.
 */

export type ExitTestSnapshot = {
  exit_test_id?: string | null;
  exit_test_invited_at?: string | null;
  exit_test_completed_at?: string | null;
};

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
