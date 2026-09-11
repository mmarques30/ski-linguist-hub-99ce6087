import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Trash2, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ZZTEST_EMAIL_DOMAIN, ZZTEST_PREFIX } from "@/lib/zztest";

export type CleanupZztestJournal = {
  dry_run: boolean;
  students: number;
  inscriptions: number;
  invoices: number;
  payments: number;
  certificates: number;
  storage_objects: number;
  auth_users: number;
  last_real_invoice_sequence: number;
  next_invoice_sequence: number;
  deleted?: boolean;
};

const CONFIRM_WORD = "NETTOYER";

function JournalTable({ journal }: { journal: CleanupZztestJournal }) {
  const rows: Array<[string, string | number]> = [
    ["Mode", journal.dry_run ? "Simulation (rien n'est effacé)" : "Exécuté"],
    ["Stagiaires", journal.students],
    ["Inscriptions", journal.inscriptions],
    ["Factures", journal.invoices],
    ["Paiements", journal.payments],
    ["Certificats", journal.certificates],
    ["Fichiers de stockage", journal.storage_objects],
    ["Comptes portail", journal.auth_users],
    ["Dernier n° de facture réel", journal.last_real_invoice_sequence],
    ["Prochaine séquence", journal.next_invoice_sequence],
  ];

  return (
    <div className="rounded-lg border text-sm">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="flex items-center justify-between border-b px-3 py-2 last:border-b-0"
        >
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium">{value}</span>
        </div>
      ))}
    </div>
  );
}

async function callCleanup(dryRun: boolean): Promise<CleanupZztestJournal> {
  const { data, error } = await supabase.rpc("cleanup_zztest_data", {
    _dry_run: dryRun,
  });
  if (error) throw new Error(error.message);
  return data as CleanupZztestJournal;
}

export function CleanupZztestCard() {
  const [pending, setPending] = useState<"dry" | "run" | null>(null);
  const [journal, setJournal] = useState<CleanupZztestJournal | null>(null);
  const [confirm, setConfirm] = useState("");

  const handleDryRun = async () => {
    setPending("dry");
    try {
      const result = await callCleanup(true);
      setJournal(result);
      toast.success("Simulation terminée — aucune ligne effacée");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Échec de la simulation");
    } finally {
      setPending(null);
    }
  };

  const handleCleanup = async () => {
    if (confirm !== CONFIRM_WORD) {
      toast.error(`Tapez ${CONFIRM_WORD} pour confirmer`);
      return;
    }
    setPending("run");
    try {
      const result = await callCleanup(false);
      setJournal(result);
      setConfirm("");
      toast.success("Données de test nettoyées");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Échec du nettoyage");
    } finally {
      setPending(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Nettoyer les données de test
        </CardTitle>
        <CardDescription>
          Supprime uniquement les stagiaires dont le nom commence par {ZZTEST_PREFIX} et
          l&apos;email se termine par @{ZZTEST_EMAIL_DOMAIN}, plus inscriptions, factures,
          paiements, certificats, fichiers et comptes liés. La prochaine facture reprend
          le dernier numéro réel. Journal sans donnée personnelle.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTitle>Deux temps : simulation, puis confirmation</AlertTitle>
          <AlertDescription>
            Lancez d&apos;abord la simulation. Si les comptes sont ceux attendus, tapez{" "}
            {CONFIRM_WORD} puis exécutez. Un formateur·rice réel affecté à une inscription
            de test n&apos;est pas supprimé.
          </AlertDescription>
        </Alert>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => void handleDryRun()}
            disabled={pending !== null}
          >
            {pending === "dry" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ListChecks className="mr-2 h-4 w-4" />
            )}
            Simuler (dry-run)
          </Button>
        </div>

        {journal && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Journal</p>
            <JournalTable journal={journal} />
          </div>
        )}

        <div className="space-y-2 rounded-lg border border-destructive/40 p-4">
          <p className="text-sm font-medium text-destructive">Exécution réelle</p>
          <p className="text-sm text-muted-foreground">
            Tapez {CONFIRM_WORD} puis cliquez. Irréversible pour les lignes de test.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={CONFIRM_WORD}
              className="max-w-xs"
              autoComplete="off"
            />
            <Button
              variant="destructive"
              onClick={() => void handleCleanup()}
              disabled={pending !== null || confirm !== CONFIRM_WORD}
            >
              {pending === "run" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Nettoyer les données de test
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
