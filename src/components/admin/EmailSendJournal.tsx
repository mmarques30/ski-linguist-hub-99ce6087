import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/common/EmptyState";
import { Mail, Loader2 } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  sent: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-800",
  skipped: "bg-amber-100 text-amber-800",
  pending: "bg-slate-100 text-slate-800",
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Destinataire, template…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="sent">Envoyés</SelectItem>
            <SelectItem value="failed">Échecs</SelectItem>
            <SelectItem value="skipped">Ignorés</SelectItem>
          </SelectContent>
        </Select>
        {failedCount > 0 && (
          <Badge variant="destructive">{failedCount} échec(s) dans les 200 derniers</Badge>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="Aucun envoi"
          description="Les e-mails transactionnels (inscription, documents, invitations…) apparaîtront ici."
          className="py-12"
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Destinataire</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Inscription</TableHead>
                <TableHead>Erreur</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {row.sent_at
                      ? format(new Date(row.sent_at), "dd/MM/yyyy HH:mm", { locale: fr })
                      : "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{row.template_slug}</TableCell>
                  <TableCell>
                    <div className="text-sm">{row.recipient_name || "—"}</div>
                    <div className="text-xs text-muted-foreground">{row.recipient_email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_STYLES[row.status] || STATUS_STYLES.pending} variant="secondary">
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
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
                  <TableCell className="max-w-[200px] truncate text-xs text-destructive">
                    {row.error_message || ""}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
