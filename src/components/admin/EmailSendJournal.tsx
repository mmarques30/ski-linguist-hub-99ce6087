import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail } from "lucide-react";
import {
  CardList,
  CardListItem,
  FilterBar,
  StatusPill,
  SurfaceCard,
  TableCell,
  TableEmpty,
  TableFrame,
  TableHeadCell,
  TableHeadRow,
  TableRow,
  TableSkeleton,
  type PillTone,
} from "@/components/ui-kit";

/** Teinte d'un statut d'envoi — le libellé reste le code brut de `email_log`. */
const STATUS_TONES: Record<string, PillTone> = {
  sent: "success",
  failed: "danger",
  skipped: "warning",
  pending: "neutral",
};

/** Journal global `email_log` (PLANO Onda D4). */
export function EmailSendJournal() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["email-log-journal", status],
    queryFn: async () => {
      let query = supabase
        .from("email_log")
        .select(
          "id, template_slug, recipient_email, recipient_name, status, sent_at, error_message, inscription_id"
        )
        .order("sent_at", { ascending: false })
        .limit(200);
      if (status !== "all") {
        query = query.eq("status", status);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (r) =>
        r.recipient_email?.toLowerCase().includes(term) ||
        r.recipient_name?.toLowerCase().includes(term) ||
        r.template_slug?.toLowerCase().includes(term)
    );
  }, [rows, q]);

  const failedCount = rows.filter((r) => r.status === "failed").length;

  const sentAt = (value: string | null) =>
    value ? format(new Date(value), "dd/MM/yyyy HH:mm", { locale: fr }) : "—";

  return (
    <SurfaceCard
      title="Journal des envois"
      icon={Mail}
      description="200 derniers e-mails transactionnels enregistrés dans email_log."
      actions={
        failedCount > 0 ? (
          <StatusPill tone="danger" dot>
            {failedCount} échec(s) dans les 200 derniers
          </StatusPill>
        ) : undefined
      }
      toolbar={
        <FilterBar
          search={{
            value: q,
            onChange: setQ,
            placeholder: "Destinataire, template…",
            ariaLabel: "Rechercher un envoi",
          }}
          filters={
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[160px]" aria-label="Statut">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="sent">Envoyés</SelectItem>
                <SelectItem value="failed">Échecs</SelectItem>
                <SelectItem value="skipped">Ignorés</SelectItem>
              </SelectContent>
            </Select>
          }
        />
      }
      flush
    >
      {isLoading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : filtered.length === 0 ? (
        <TableEmpty
          icon={Mail}
          title="Aucun envoi"
          description="Les e-mails transactionnels (inscription, documents, invitations…) apparaîtront ici."
        />
      ) : (
        <>
          <TableFrame>
            <table className="hidden w-full md:table">
              <thead>
                <TableHeadRow>
                  <TableHeadCell>Date</TableHeadCell>
                  <TableHeadCell>Template</TableHeadCell>
                  <TableHeadCell>Destinataire</TableHeadCell>
                  <TableHeadCell>Statut</TableHeadCell>
                  <TableHeadCell className="hidden lg:table-cell">Inscription</TableHeadCell>
                  <TableHeadCell className="hidden lg:table-cell">Erreur</TableHeadCell>
                </TableHeadRow>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap tabular">
                      {sentAt(row.sent_at)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{row.template_slug}</TableCell>
                    <TableCell>
                      <div className="min-w-0">
                        <p className="truncate text-sm">{row.recipient_name || "—"}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {row.recipient_email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusPill
                        tone={STATUS_TONES[row.status] ?? STATUS_TONES.pending}
                        size="sm"
                      >
                        {row.status}
                      </StatusPill>
                    </TableCell>
                    <TableCell hideBelow="lg">
                      {row.inscription_id ? (
                        <Link
                          className="text-sm text-primary underline-offset-2 hover:underline"
                          to={`/inscriptions/${row.inscription_id}`}
                        >
                          Voir
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell hideBelow="lg" className="max-w-[200px] truncate text-xs text-destructive">
                      {row.error_message || ""}
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </table>
          </TableFrame>

          {/* Doublure mobile du tableau — mêmes colonnes, même lien inscription. */}
          <CardList className="md:hidden">
            {filtered.map((row) => (
              <CardListItem
                key={row.id}
                title={row.recipient_name || row.recipient_email || "—"}
                subtitle={row.recipient_email}
                meta={
                  <StatusPill
                    tone={STATUS_TONES[row.status] ?? STATUS_TONES.pending}
                    size="sm"
                  >
                    {row.status}
                  </StatusPill>
                }
                fields={[
                  { label: "Date", value: sentAt(row.sent_at) },
                  { label: "Template", value: row.template_slug },
                  {
                    label: "Erreur",
                    value: row.error_message ? (
                      <span className="text-destructive">{row.error_message}</span>
                    ) : (
                      "—"
                    ),
                  },
                ]}
                actions={
                  row.inscription_id ? (
                    <Link
                      className="text-sm text-primary underline-offset-2 hover:underline"
                      to={`/inscriptions/${row.inscription_id}`}
                    >
                      Voir l'inscription
                    </Link>
                  ) : undefined
                }
              />
            ))}
          </CardList>
        </>
      )}
    </SurfaceCard>
  );
}
