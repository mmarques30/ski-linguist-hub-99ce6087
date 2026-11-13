import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildExitTestLink,
  exitTestBlocksEndPack,
  exitTestFormationKind,
  isExitTestCompleted,
  isExitTestInvited,
  shouldAutoInviteCollectiveOnLastDay,
  shouldAutoInviteIndividualOnFinished,
} from "./exit-test";

describe("exit-test gates", () => {
  it("bloque le pack tant que le test n'est pas complété", () => {
    expect(exitTestBlocksEndPack({})).toMatch(/obligatoire/);
    expect(
      exitTestBlocksEndPack({
        exit_test_id: "t1",
        exit_test_invited_at: "2026-11-13T00:00:00Z",
      })
    ).toMatch(/pas encore complété/);
    expect(
      exitTestBlocksEndPack({
        exit_test_id: "t1",
        exit_test_completed_at: "2026-11-13T12:00:00Z",
      })
    ).toBeNull();
  });

  it("détecte invitation et complétion", () => {
    expect(isExitTestInvited({ exit_test_invited_at: "x" })).toBe(true);
    expect(isExitTestCompleted({ exit_test_id: "a" })).toBe(false);
    expect(
      isExitTestCompleted({
        exit_test_id: "a",
        exit_test_completed_at: "x",
      })
    ).toBe(true);
  });

  it("construit le lien public", () => {
    expect(buildExitTestLink("https://plateforme.fli.fr/", "tok")).toBe(
      "https://plateforme.fli.fr/exit-test/tok"
    );
  });

  it("la migration expose les RPC publiques", () => {
    const sql = readFileSync(
      join(
        process.cwd(),
        "supabase/migrations/20261113085834_exit_test_invite_token_rpc.sql"
      ),
      "utf8"
    );
    expect(sql).toContain("get_exit_test_context");
    expect(sql).toContain("submit_exit_test_by_token");
    expect(sql).toContain("exit_test_invite");
    expect(sql).toContain("invite_token");
  });

  it("l'edge d'invitation et la page publique existent", () => {
    const edge = readFileSync(
      join(
        process.cwd(),
        "supabase/functions/send-exit-test-invite/index.ts"
      ),
      "utf8"
    );
    expect(edge).toContain("exit_test_invite");
    expect(edge).toContain("inviteExitTestForInscription");

    const batch = readFileSync(
      join(
        process.cwd(),
        "supabase/functions/process-exit-test-invites/index.ts"
      ),
      "utf8"
    );
    expect(batch).toContain("parisTodayYmd");
    expect(batch).toContain("collective");

    const app = readFileSync(join(process.cwd(), "src/App.tsx"), "utf8");
    expect(app).toContain("/exit-test/:token");
  });

  it("discrimine collectif / individuel et les déclencheurs auto", () => {
    expect(
      exitTestFormationKind({ courseType: "Collectif", modality: "presentiel" })
    ).toBe("collective");
    expect(
      exitTestFormationKind({
        courseType: "Individuel",
        modality: "en_ligne_individuel",
      })
    ).toBe("individuelle");

    expect(
      shouldAutoInviteCollectiveOnLastDay({
        courseType: "Collectif",
        endDate: "2026-11-13",
        todayParis: "2026-11-13",
        status: "en_cours",
      })
    ).toBe(true);
    expect(
      shouldAutoInviteCollectiveOnLastDay({
        courseType: "Collectif",
        endDate: "2026-11-12",
        todayParis: "2026-11-13",
        status: "en_cours",
      })
    ).toBe(false);
    expect(
      shouldAutoInviteCollectiveOnLastDay({
        courseType: "Individuel",
        endDate: "2026-11-13",
        todayParis: "2026-11-13",
        status: "en_cours",
      })
    ).toBe(false);

    expect(
      shouldAutoInviteIndividualOnFinished({
        courseType: "Individuel",
        status: "en_cours",
        exit_form_completed_at: "2026-11-13T10:00:00Z",
      })
    ).toBe(true);
    expect(
      shouldAutoInviteIndividualOnFinished({
        courseType: "Individuel",
        status: "terminee",
      })
    ).toBe(true);
    expect(
      shouldAutoInviteIndividualOnFinished({
        courseType: "Collectif",
        status: "terminee",
        exit_form_completed_at: "2026-11-13T10:00:00Z",
      })
    ).toBe(false);
    expect(
      shouldAutoInviteIndividualOnFinished({
        courseType: "Individuel",
        status: "en_cours",
        exit_form_completed_at: "2026-11-13T10:00:00Z",
        exit_test_invited_at: "2026-11-13T10:05:00Z",
      })
    ).toBe(false);
  });

  it("la migration auto-invite active le modèle et le cron", () => {
    const sql = readFileSync(
      join(
        process.cwd(),
        "supabase/migrations/20261113093000_exit_test_auto_invite.sql"
      ),
      "utf8"
    );
    expect(sql).toContain("process-exit-test-invites");
    expect(sql).toContain("exit_test_invite_individuelle");
    expect(sql).toContain("is_active = true");
  });
});
