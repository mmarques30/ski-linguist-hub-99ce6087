/**
 * Digest opérationnel matinal — dossiers récents + actions à réaliser.
 * Miroir Deno : `supabase/functions/_shared/daily-ops-digest.ts`.
 */

export type DigestInscriptionRow = {
  id: string;
  code: string | null;
  status: string;
  created_at: string;
  start_date: string;
  end_date: string;
  course_location: string | null;
  modality: string | null;
  language: string | null;
  funding_organization: string | null;
  payment_method: string | null;
  price: number | null;
  deposit_amount: number | null;
  balance_after_deposit: number | null;
  documents_sent_at: string | null;
  first_name: string;
  last_name: string;
  email: string;
  /** Somme paiements status=recu */
  amount_received: number;
  /** Acompte (payment_type=acompte) reçu */
  deposit_received: number;
  /** Montants en_attente (hors annulés) */
  amount_pending: number;
  /** Chèque en_attente */
  cheque_pending: number;
};

export type DigestActionPriority = "haute" | "normale" | "basse";

export type DigestAction = {
  priority: DigestActionPriority;
  code: string;
  studentName: string;
  label: string;
};

export type DailyOpsDigest = {
  generatedAtIso: string;
  asOfDateLabel: string;
  newLast24h: DigestInscriptionRow[];
  active: DigestInscriptionRow[];
  actions: DigestAction[];
  cancelledRecent: DigestInscriptionRow[];
};

const ZZTEST = /zztest/i;
const PLACEHOLDER_EMAIL = /@example\.invalid$/i;

export function isOpsDigestNoise(row: Pick<DigestInscriptionRow, "first_name" | "last_name" | "email">): boolean {
  if (ZZTEST.test(row.first_name) || ZZTEST.test(row.last_name)) return true;
  if (PLACEHOLDER_EMAIL.test(row.email)) return true;
  return false;
}

export function isOnlineModality(modality: string | null | undefined, location: string | null | undefined): boolean {
  const m = (modality || "").toLowerCase();
  const loc = (location || "").toLowerCase();
  if (m.includes("ligne") || m.includes("online") || m.includes("visio")) return true;
  if (loc.includes("meet") || loc.includes("ligne") || loc.includes("visio")) return true;
  return false;
}

export function isSchoolStation(location: string | null | undefined): boolean {
  const loc = (location || "").toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  return loc.includes("rosiere") || loc.includes("meribel");
}

function daysUntil(isoDate: string, now = new Date()): number {
  const start = new Date(`${isoDate.slice(0, 10)}T12:00:00Z`);
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12));
  return Math.round((start.getTime() - today.getTime()) / 86_400_000);
}

function studentName(row: DigestInscriptionRow): string {
  return `${row.first_name} ${row.last_name}`.replace(/\s+/g, " ").trim();
}

function pushAction(
  actions: DigestAction[],
  seen: Set<string>,
  action: DigestAction,
) {
  const key = `${action.code}|${action.label}`;
  if (seen.has(key)) return;
  seen.add(key);
  actions.push(action);
}

export function buildDailyOpsDigest(
  rows: DigestInscriptionRow[],
  now = new Date(),
): DailyOpsDigest {
  const filtered = rows.filter((r) => !isOpsDigestNoise(r));
  const asOfDateLabel = now.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  });

  const ms24h = 24 * 60 * 60 * 1000;
  const newLast24h = filtered.filter(
    (r) => now.getTime() - new Date(r.created_at).getTime() <= ms24h && r.status !== "annulee",
  );

  const active = filtered.filter(
    (r) => !["annulee", "facturee", "terminee"].includes(r.status),
  );

  const cancelledRecent = filtered.filter(
    (r) =>
      r.status === "annulee" &&
      now.getTime() - new Date(r.created_at).getTime() <= 14 * ms24h,
  );

  const actions: DigestAction[] = [];
  const seen = new Set<string>();

  for (const row of active) {
    const name = studentName(row);
    const code = row.code || row.id.slice(0, 8);
    const online = isOnlineModality(row.modality, row.course_location);
    const school = isSchoolStation(row.course_location);
    const days = daysUntil(row.start_date, now);
    const docsSent = Boolean(row.documents_sent_at);
    const depositOk = row.deposit_received >= 150 || row.amount_received >= (row.price || 0);

    // Doublon probable : même email + même lieu + même dates, codes différents
    const twins = active.filter(
      (o) =>
        o.id !== row.id &&
        o.email.toLowerCase() === row.email.toLowerCase() &&
        o.start_date === row.start_date &&
        (o.course_location || "") === (row.course_location || ""),
    );
    if (twins.length && row.code && twins.every((t) => (t.code || "") > (row.code || ""))) {
      pushAction(actions, seen, {
        priority: "normale",
        code,
        studentName: name,
        label: `Doublon probable avec ${twins.map((t) => t.code).join(", ")} — vérifier / annuler`,
      });
    }

    if (depositOk && !docsSent && !school) {
      pushAction(actions, seen, {
        priority: days <= 14 ? "haute" : "normale",
        code,
        studentName: name,
        label: `Acompte/paiement reçu — envoyer dossier ${row.funding_organization || "formation"}`,
      });
    }

    if (online && row.deposit_received >= 150 && row.cheque_pending > 0) {
      pushAction(actions, seen, {
        priority: days <= 7 ? "haute" : "normale",
        code,
        studentName: name,
        label: `En ligne — acompte OK, attendre chèque ${row.cheque_pending} € avant mise en contact formateur·rice`,
      });
    } else if (
      online &&
      row.deposit_received >= 150 &&
      (row.balance_after_deposit || 0) > 0 &&
      row.amount_received < (row.price || 0)
    ) {
      pushAction(actions, seen, {
        priority: days <= 7 ? "haute" : "normale",
        code,
        studentName: name,
        label: `En ligne — acompte OK, solde ${row.balance_after_deposit} € (chèque) en attente avant mise en contact`,
      });
    }

    if (school && !docsSent && row.status !== "annulee") {
      pushAction(actions, seen, {
        priority: "normale",
        code,
        studentName: name,
        label: "Forfait école (Rosière/Méribel) — dossier pas encore envoyé (pas d'acompte 150 €)",
      });
    }

    if (!depositOk && row.amount_pending > 0 && !school && days <= 10) {
      pushAction(actions, seen, {
        priority: days <= 3 ? "haute" : "normale",
        code,
        studentName: name,
        label: `Début dans ${days} j — paiement en attente (${row.amount_pending} €)`,
      });
    }

    if (
      (row.funding_organization || "").toLowerCase().includes("agefice") &&
      row.deposit_received >= 150
    ) {
      pushAction(actions, seen, {
        priority: "basse",
        code,
        studentName: name,
        label: "AGEFICE — suivi dépôt Point d'accueil / pièces",
      });
    }
  }

  const priorityRank: Record<DigestActionPriority, number> = {
    haute: 0,
    normale: 1,
    basse: 2,
  };
  actions.sort(
    (a, b) =>
      priorityRank[a.priority] - priorityRank[b.priority] ||
      a.code.localeCompare(b.code),
  );

  return {
    generatedAtIso: now.toISOString(),
    asOfDateLabel,
    newLast24h,
    active: active.sort((a, b) => (b.code || "").localeCompare(a.code || "")),
    actions,
    cancelledRecent,
  };
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatDailyOpsDigestSubject(digest: DailyOpsDigest): string {
  const n = digest.actions.filter((a) => a.priority === "haute").length;
  const dateShort = digest.asOfDateLabel.replace(/^./, (c) => c.toUpperCase());
  return `FLI — Digest ops ${dateShort}${n ? ` · ${n} action${n > 1 ? "s" : ""} prioritaire${n > 1 ? "s" : ""}` : ""}`;
}

export function formatDailyOpsDigestHtml(digest: DailyOpsDigest): string {
  const actionBlock =
    digest.actions.length === 0
      ? `<p>Aucune action prioritaire détectée.</p>`
      : `<ul>${digest.actions
          .map(
            (a) =>
              `<li><strong>[${esc(a.priority)}]</strong> ${esc(a.code)} — ${esc(a.studentName)} : ${esc(a.label)}</li>`,
          )
          .join("")}</ul>`;

  const newBlock =
    digest.newLast24h.length === 0
      ? `<p>Aucune nouvelle inscription (24 h).</p>`
      : `<ul>${digest.newLast24h
          .map(
            (r) =>
              `<li>${esc(r.code || "—")} — ${esc(studentName(r))} · ${esc(r.course_location || "—")} · ${esc(r.language || "—")} · ${esc(r.status)} · reçu ${r.amount_received} €</li>`,
          )
          .join("")}</ul>`;

  const activeBlock = `<table role="presentation" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-size:13px;width:100%">
<tr style="background:#f4f4f5;text-align:left"><th>Code</th><th>Stagiaire</th><th>Lieu</th><th>Début</th><th>Statut</th><th>Reçu</th><th>Attente</th><th>Docs</th></tr>
${digest.active
  .slice(0, 40)
  .map(
    (r) =>
      `<tr>
<td>${esc(r.code || "—")}</td>
<td>${esc(studentName(r))}</td>
<td>${esc(r.course_location || "—")}</td>
<td>${esc(r.start_date)}</td>
<td>${esc(r.status)}</td>
<td>${r.amount_received} €</td>
<td>${r.amount_pending} €</td>
<td>${r.documents_sent_at ? "oui" : "non"}</td>
</tr>`,
  )
  .join("")}
</table>`;

  return `<div style="font-family:Arial,sans-serif;font-size:15px;color:#111;max-width:720px">
<p>Bonjour Paula,</p>
<p>Voici le résumé opérationnel du <strong>${esc(digest.asOfDateLabel)}</strong>.</p>
<h2 style="font-size:17px;margin:20px 0 8px">Actions à réaliser</h2>
${actionBlock}
<h2 style="font-size:17px;margin:20px 0 8px">Nouvelles inscriptions (24 h)</h2>
${newBlock}
<h2 style="font-size:17px;margin:20px 0 8px">Dossiers actifs récents</h2>
${activeBlock}
<p style="margin-top:24px;color:#555;font-size:13px">Digest automatique FLI — généré le ${esc(digest.generatedAtIso)}.</p>
</div>`;
}

export function formatDailyOpsDigestText(digest: DailyOpsDigest): string {
  const lines = [
    `FLI — Digest ops — ${digest.asOfDateLabel}`,
    "",
    "ACTIONS À RÉALISER",
    ...(digest.actions.length
      ? digest.actions.map(
          (a) => `- [${a.priority}] ${a.code} — ${a.studentName} : ${a.label}`,
        )
      : ["(aucune)"]),
    "",
    "NOUVELLES (24 h)",
    ...(digest.newLast24h.length
      ? digest.newLast24h.map(
          (r) =>
            `- ${r.code} — ${studentName(r)} · ${r.course_location} · reçu ${r.amount_received} €`,
        )
      : ["(aucune)"]),
    "",
    `Dossiers actifs : ${digest.active.length}`,
  ];
  return lines.join("\n");
}
