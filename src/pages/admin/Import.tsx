import { useCallback, useEffect, useRef, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Trash2,
  Download,
  Play,
  ShieldAlert,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { FliInscriptionsImportCard } from "@/components/admin/FliInscriptionsImportCard";
import { FliFormResponsesImportCard } from "@/components/admin/FliFormResponsesImportCard";
import {
  buildRejectionCsv,
  downloadTextFile,
  parseCsvText,
  readCsvFileAsText,
  type CsvRow,
} from "@/lib/csv-import-parser";
import {
  IMPORT_TABLE_LABELS,
  classifyInstructorComplement,
  prepareFormateurBackfill,
  prepareImport,
  type ImportTableType,
  type InstructorComplementAction,
  type PreparedImport,
} from "@/lib/admin-import-engine";
import { matchInscriptionsFormateur } from "@/lib/formateur-backfill-match";

type WriteMode = "insert" | "complement" | "formateur_backfill";

interface TableCounts {
  instructors: number;
  ski_schools: number;
  students: number;
  inscriptions: number;
  invoices: number;
}

const EMPTY_COUNTS: TableCounts = {
  instructors: 0,
  ski_schools: 0,
  students: 0,
  inscriptions: 0,
  invoices: 0,
};

async function countTable(table: ImportTableType): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}

async function writeAuditLog(params: {
  userId: string | undefined;
  action: string;
  tableName: string;
  newValues: Record<string, unknown>;
  oldValues?: Record<string, unknown> | null;
}) {
  const { error } = await supabase.from("audit_log").insert({
    user_id: params.userId ?? null,
    action: params.action,
    table_name: params.tableName,
    record_id: null,
    new_values: params.newValues as unknown as import("@/integrations/supabase/types").Json,
    old_values: (params.oldValues ?? null) as unknown as import("@/integrations/supabase/types").Json,
  });
  if (error) {
    console.error("audit_log insert failed", error);
    throw new Error(`Journalisation audit_log échouée : ${error.message}`);
  }
}

export default function Import() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CsvRow[]>([]);
  const [allRows, setAllRows] = useState<CsvRow[]>([]);
  const [encodingNotes, setEncodingNotes] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<ImportTableType>("instructors");
  const [writeMode, setWriteMode] = useState<WriteMode>("complement");
  const [complementSummary, setComplementSummary] = useState<{
    inserts: number;
    updates: number;
    actions: InstructorComplementAction[];
  } | null>(null);
  const [backfillSummary, setBackfillSummary] = useState<{
    matched: number;
    unmatchedDb: number;
    unmatchedCsv: number;
    multiples: number;
    encodingDups: number;
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [isDryRunning, setIsDryRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [prepared, setPrepared] = useState<PreparedImport | null>(null);
  const [dryRunDone, setDryRunDone] = useState(false);
  const [importResult, setImportResult] = useState<{
    imported: number;
    errors: string[];
  } | null>(null);
  const [counts, setCounts] = useState<TableCounts>(EMPTY_COUNTS);
  const [countsLoading, setCountsLoading] = useState(true);
  const [purgeOpen, setPurgeOpen] = useState(false);
  const [purgeConfirmText, setPurgeConfirmText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const refreshCounts = useCallback(async () => {
    setCountsLoading(true);
    try {
      const [instructors, ski_schools, students, inscriptions, invoices] =
        await Promise.all([
          countTable("instructors"),
          countTable("ski_schools"),
          countTable("students"),
          countTable("inscriptions"),
          countTable("invoices"),
        ]);
      setCounts({ instructors, ski_schools, students, inscriptions, invoices });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Impossible de compter les lignes",
        description: error instanceof Error ? error.message : "Erreur inconnue",
      });
    } finally {
      setCountsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void refreshCounts();
  }, [refreshCounts]);

  const resetImportState = () => {
    setPrepared(null);
    setDryRunDone(false);
    setImportResult(null);
    setProgress(0);
    setComplementSummary(null);
    setBackfillSummary(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    resetImportState();

    try {
      const text = await readCsvFileAsText(selectedFile);
      const { rows, encodingNotes: notes } = parseCsvText(text, ";");
      setAllRows(rows);
      setPreview(rows.slice(0, 10));
      setEncodingNotes(notes);
      if (rows.length === 0) {
        toast({
          variant: "destructive",
          title: "Fichier vide ou illisible",
          description: "Vérifiez le délimiteur point-virgule et l'encodage UTF-8.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lecture du fichier impossible",
        description: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  };

  const handleDryRun = async () => {
    if (allRows.length === 0 || !file) return;
    setIsDryRunning(true);
    setComplementSummary(null);
    setBackfillSummary(null);
    try {
      if (writeMode === "formateur_backfill") {
        if (selectedTable !== "inscriptions") {
          throw new Error("Le backfill formateur s'applique à la table inscriptions.");
        }
        const { data: dbRows, error: dbErr } = await supabase
          .from("inscriptions")
          .select("id, code, start_date, language, status, student_id, students(first_name, last_name)");
        if (dbErr) throw dbErr;

        const flat = (dbRows || []).map((row) => {
          const students = row.students as
            | { first_name: string | null; last_name: string | null }
            | { first_name: string | null; last_name: string | null }[]
            | null;
          const st = Array.isArray(students) ? students[0] : students;
          return {
            id: row.id as string,
            code: (row.code as string | null) ?? null,
            start_date: (row.start_date as string | null) ?? null,
            language: (row.language as string | null) ?? null,
            status: (row.status as string | null) ?? null,
            first_name: st?.first_name ?? null,
            last_name: st?.last_name ?? null,
          };
        });

        const report = matchInscriptionsFormateur(flat, allRows);
        const result = prepareFormateurBackfill(
          report.matched.map((m) => ({
            id: m.dbId,
            formateur: m.formateur,
            formateur_email: m.formateur_email,
            formateur_telephone: m.formateur_telephone,
            match_method: m.method,
          }))
        );
        setPrepared(result);
        setDryRunDone(true);
        setImportResult(null);
        setBackfillSummary({
          matched: report.matched.length,
          unmatchedDb: report.unmatchedDb.length,
          unmatchedCsv: report.unmatchedCsv.length,
          multiples: report.multiples.length,
          encodingDups: report.unmatchedDb.filter((u) => u.isEncodingDup).length,
        });

        await writeAuditLog({
          userId: user?.id,
          action: "import_dry_run",
          tableName: "inscriptions",
          newValues: {
            filename: file.name,
            mode: "formateur_backfill",
            total_rows: allRows.length,
            matched: report.matched.length,
            unmatched_db: report.unmatchedDb.length,
            unmatched_csv: report.unmatchedCsv.length,
            multiples: report.multiples.length,
            encoding_dups_db: report.unmatchedDb.filter((u) => u.isEncodingDup).length,
            columns: ["formateur", "formateur_email", "formateur_telephone"],
          },
        });

        toast({
          title: "Dry-run backfill formateur",
          description: `${report.matched.length} rapprochement(s) 1↔1 — aucune écriture.`,
        });
        return;
      }

      const result = prepareImport(allRows, selectedTable);
      setPrepared(result);
      setDryRunDone(true);
      setImportResult(null);

      let complementMeta: Record<string, unknown> = {};
      if (selectedTable === "instructors" && writeMode === "complement") {
        const { data: existing, error: exErr } = await supabase
          .from("instructors")
          .select("id, email, first_name, last_name, status");
        if (exErr) throw exErr;
        const classified = classifyInstructorComplement(
          result.accepted,
          existing || []
        );
        setComplementSummary({
          inserts: classified.inserts.length,
          updates: classified.updates.length,
          actions: classified.actions,
        });
        complementMeta = {
          mode: "complement",
          to_insert: classified.inserts.length,
          to_update: classified.updates.length,
        };
      }

      await writeAuditLog({
        userId: user?.id,
        action: "import_dry_run",
        tableName: selectedTable,
        newValues: {
          filename: file.name,
          write_mode: writeMode,
          total_rows: result.totalRows,
          accepted: result.acceptedCount,
          rejected: result.rejectedCount,
          first_errors: result.rejections.slice(0, 20).map((r) => ({
            line: r.lineNumber,
            reason: r.reason,
          })),
          ...complementMeta,
        },
      });

      toast({
        title: "Dry-run terminé",
        description: `${result.acceptedCount} acceptée(s), ${result.rejectedCount} rejetée(s). Aucune écriture en base.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Échec du dry-run",
        description: error instanceof Error ? error.message : "Erreur inconnue",
      });
    } finally {
      setIsDryRunning(false);
    }
  };

  const handleDownloadRejections = () => {
    if (!prepared || prepared.rejections.length === 0) return;
    const csv = buildRejectionCsv(prepared.rejections);
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    downloadTextFile(
      `rejets-import-${selectedTable}-${stamp}.csv`,
      csv
    );
  };

  const handleImport = async () => {
    if (!prepared || !dryRunDone || !file) return;
    if (prepared.acceptedCount === 0) {
      toast({
        variant: "destructive",
        title: "Rien à importer",
        description: "Le dry-run n'a accepté aucune ligne.",
      });
      return;
    }

    setIsImporting(true);
    setProgress(0);
    const errors: string[] = [];
    let imported = 0;
    const batchSize = 50;

    try {
      if (writeMode === "formateur_backfill") {
        const records = prepared.accepted;
        for (let i = 0; i < records.length; i += batchSize) {
          const batch = records.slice(i, i + batchSize);
          for (const row of batch) {
            const { id, formateur, formateur_email, formateur_telephone } = row as {
              id: string;
              formateur: string | null;
              formateur_email: string | null;
              formateur_telephone: string | null;
            };
            const { error } = await supabase
              .from("inscriptions")
              .update({ formateur, formateur_email, formateur_telephone })
              .eq("id", id);
            if (error) errors.push(`${id}: ${error.message}`);
            else imported += 1;
          }
          setProgress(Math.round(((i + batch.length) / records.length) * 100));
        }

        await writeAuditLog({
          userId: user?.id,
          action: "import",
          tableName: "inscriptions",
          newValues: {
            filename: file.name,
            mode: "formateur_backfill",
            source: file.name,
            updated: imported,
            columns: ["formateur", "formateur_email", "formateur_telephone"],
            write_errors: errors,
          },
        });
      } else if (selectedTable === "instructors" && writeMode === "complement") {
        const { data: existing, error: exErr } = await supabase
          .from("instructors")
          .select("id, email, first_name, last_name, status");
        if (exErr) throw exErr;
        const classified = classifyInstructorComplement(
          prepared.accepted,
          existing || []
        );

        for (let i = 0; i < classified.inserts.length; i += batchSize) {
          const batch = classified.inserts.slice(i, i + batchSize);
          const { error } = await supabase.from("instructors").insert(batch as never[]);
          if (error) errors.push(`Insert lot: ${error.message}`);
          else imported += batch.length;
          setProgress(
            Math.round(
              ((i + batch.length) / Math.max(classified.actions.length, 1)) * 50
            )
          );
        }

        for (let i = 0; i < classified.updates.length; i++) {
          const u = classified.updates[i];
          if (u.action !== "update") continue;
          const { error } = await supabase
            .from("instructors")
            .update(u.record as never)
            .eq("id", u.id);
          if (error) errors.push(`Update ${u.id}: ${error.message}`);
          else imported += 1;
          setProgress(
            50 +
              Math.round(
                ((i + 1) / Math.max(classified.updates.length, 1)) * 50
              )
          );
        }

        await writeAuditLog({
          userId: user?.id,
          action: "import",
          tableName: "instructors",
          newValues: {
            filename: file.name,
            mode: "complement",
            source: file.name,
            inserted: classified.inserts.length,
            updated: classified.updates.length,
            written: imported,
            write_errors: errors,
          },
        });
      } else {
        const records = prepared.accepted;
        for (let i = 0; i < records.length; i += batchSize) {
          const batch = records.slice(i, i + batchSize);
          const { error } = await supabase
            .from(selectedTable)
            .insert(batch as never[]);
          if (error) {
            errors.push(`Lot ${Math.floor(i / batchSize) + 1}: ${error.message}`);
          } else {
            imported += batch.length;
          }
          setProgress(Math.round(((i + batch.length) / records.length) * 100));
        }

        await writeAuditLog({
          userId: user?.id,
          action: "import",
          tableName: selectedTable,
          newValues: {
            filename: file.name,
            write_mode: writeMode,
            total_rows: prepared.totalRows,
            accepted_at_dry_run: prepared.acceptedCount,
            rejected_at_dry_run: prepared.rejectedCount,
            imported,
            write_errors: errors,
          },
        });
      }
    } catch (auditError) {
      errors.push(
        auditError instanceof Error ? auditError.message : "Erreur écriture/audit"
      );
    }

    setImportResult({ imported, errors });
    setIsImporting(false);
    await refreshCounts();

    toast({
      title: "Import terminé",
      description: `${imported} enregistrement(s) traité(s) dans ${selectedTable}.`,
    });
  };

  const selectedCount = counts[selectedTable];
  const purgeConfirmOk =
    purgeConfirmText.trim() === selectedTable && selectedCount > 0;

  const handlePurgeSelectedTable = async () => {
    if (!purgeConfirmOk) return;
    setIsPurging(true);
    try {
      const beforeCount = selectedCount;
      const { error } = await supabase
        .from(selectedTable)
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;

      await writeAuditLog({
        userId: user?.id,
        action: "purge",
        tableName: selectedTable,
        oldValues: { row_count_before: beforeCount },
        newValues: {
          row_count_deleted: beforeCount,
          filename: null,
          confirmed_table_name: selectedTable,
        },
      });

      toast({
        title: "Purge effectuée",
        description: `Table ${selectedTable} : ${beforeCount} ligne(s) supprimée(s).`,
      });
      setPurgeOpen(false);
      setPurgeConfirmText("");
      await refreshCounts();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur de purge",
        description: error instanceof Error ? error.message : "Erreur inconnue",
      });
    } finally {
      setIsPurging(false);
    }
  };

  const headers = preview.length > 0 ? Object.keys(preview[0]).slice(0, 10) : [];

  return (
    <MainLayout>
      <div className="space-y-6">
        <FliInscriptionsImportCard />
        <FliFormResponsesImportCard />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Import de données CSV</h1>
            <p className="text-muted-foreground">
              Délimiteur point-virgule · UTF-8 · dry-run obligatoire avant écriture
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => void refreshCounts()}
            disabled={countsLoading}
          >
            {countsLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Actualiser les comptes
          </Button>
        </div>

        <Alert>
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Sécurité import</AlertTitle>
          <AlertDescription className="space-y-1 text-sm">
            <p>
              Toute écriture est précédée d&apos;un dry-run. Toute purge demande le
              nom exact de la table et affiche le nombre de lignes concernées.
              Chaque action est journalisée dans <code>audit_log</code>.
            </p>
            <p className="text-muted-foreground">
              Ne purgez jamais de données réelles sans validation métier
              préalable.
            </p>
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Volumes actuels</CardTitle>
            <CardDescription>
              Comptes live (lecture seule) — base de confirmation pour les purges
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              {(Object.keys(IMPORT_TABLE_LABELS) as ImportTableType[]).map((key) => (
                <div
                  key={key}
                  className={`rounded-lg border p-3 ${
                    key === selectedTable ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <p className="text-xs text-muted-foreground">{key}</p>
                  <p className="text-2xl font-bold tabular-nums">
                    {countsLoading ? "…" : counts[key]}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Table cible</CardTitle>
            <CardDescription>
              Ordre conseillé : instructors → ski_schools → students →
              inscriptions → invoices
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label>Table</Label>
              <Select
                value={selectedTable}
                onValueChange={(v) => {
                  setSelectedTable(v as ImportTableType);
                  resetImportState();
                }}
              >
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(IMPORT_TABLE_LABELS) as [ImportTableType, string][]).map(
                    ([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label} ({counts[key]})
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-2">
              <Label>Mode d&apos;écriture</Label>
              <Select
                value={writeMode}
                onValueChange={(v) => {
                  setWriteMode(v as WriteMode);
                  resetImportState();
                }}
              >
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="insert">Insert pur (nouvelles lignes)</SelectItem>
                  <SelectItem value="complement">
                    Complément instructors (insert + update, clé email / nom)
                  </SelectItem>
                  <SelectItem value="formateur_backfill">
                    Backfill formateur sur inscriptions (3 colonnes)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="destructive"
              disabled={countsLoading || selectedCount === 0}
              onClick={() => {
                setPurgeConfirmText("");
                setPurgeOpen(true);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Purger {selectedTable}
            </Button>
          </CardContent>
        </Card>

        <AlertDialog open={purgeOpen} onOpenChange={setPurgeOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la purge</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    Vous allez supprimer{" "}
                    <strong className="text-destructive">{selectedCount}</strong>{" "}
                    ligne(s) de la table{" "}
                    <strong className="text-foreground">{selectedTable}</strong>.
                  </p>
                  <p>
                    Table : <code className="text-foreground">{selectedTable}</code>
                    <br />
                    Lignes concernées :{" "}
                    <strong className="text-foreground">{selectedCount}</strong>
                  </p>
                  <p className="text-destructive font-medium">
                    Action irréversible. Aucune suppression sans validation
                    métier.
                  </p>
                  <div className="space-y-2 pt-2">
                    <Label htmlFor="purge-confirm">
                      Tapez le nom exact de la table pour confirmer :{" "}
                      <code>{selectedTable}</code>
                    </Label>
                    <Input
                      id="purge-confirm"
                      value={purgeConfirmText}
                      onChange={(e) => setPurgeConfirmText(e.target.value)}
                      placeholder={selectedTable}
                      autoComplete="off"
                    />
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPurging}>Annuler</AlertDialogCancel>
              <AlertDialogAction
                disabled={!purgeConfirmOk || isPurging}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={(e) => {
                  e.preventDefault();
                  void handlePurgeSelectedTable();
                }}
              >
                {isPurging ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Supprimer {selectedCount} ligne(s)
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Fichier CSV — {IMPORT_TABLE_LABELS[selectedTable]}
            </CardTitle>
            <CardDescription>
              Format : CSV séparateur <strong>;</strong>, encodage UTF-8 (BOM
              accepté), décimales à virgule, milliers avec espace / NBSP
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedTable === "instructors" && (
              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Formateur·rices — colonnes FR acceptées</AlertTitle>
                <AlertDescription className="text-sm">
                  Nom, Prénom, Civilité, Email, Téléphone, Langues, Statut (
                  actif / inactif / candidat), Statut administratif, SIRET,
                  Identifiant étranger, Assujetti TVA, Adresse, CP, Ville, Pays,
                  Date de naissance, CV (lien), Formulaire 2026, Consentements,
                  Alias. Statuts DB : actif | inactif | candidat. Les
                  inactif·ves / candidat·es sont exclus des sélecteurs
                  d&apos;affectation. Aucune liaison auto aux inscriptions.
                </AlertDescription>
              </Alert>
            )}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-8 transition-colors hover:bg-muted/50"
            >
              <Upload className="h-10 w-10 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium">
                  {file ? file.name : "Cliquez pour sélectionner un fichier"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {file
                    ? `${allRows.length} ligne(s) de données`
                    : "CSV ; utf-8-sig"}
                </p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => void handleFileChange(e)}
              className="hidden"
            />
            {encodingNotes.length > 0 && (
              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Notes de lecture</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc space-y-1 pl-4 text-sm">
                    {encodingNotes.map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {preview.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Aperçu (10 premières lignes)</CardTitle>
              <CardDescription>
                Vérifiez les colonnes avant le dry-run
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {headers.map((header) => (
                        <TableHead key={header} className="whitespace-nowrap">
                          {header}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.map((row, index) => (
                      <TableRow key={index}>
                        {headers.map((header) => (
                          <TableCell
                            key={header}
                            className="max-w-[200px] truncate"
                          >
                            {row[header]}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => void handleDryRun()}
                  disabled={isDryRunning || allRows.length === 0}
                  size="lg"
                  variant="secondary"
                >
                  {isDryRunning ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="mr-2 h-4 w-4" />
                  )}
                  Lancer le dry-run ({allRows.length} lignes)
                </Button>

                <Button
                  onClick={() => void handleImport()}
                  disabled={
                    !dryRunDone ||
                    isImporting ||
                    !prepared ||
                    prepared.acceptedCount === 0
                  }
                  size="lg"
                >
                  {isImporting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Écrire en base
                  {prepared ? ` (${prepared.acceptedCount})` : ""}
                </Button>

                {!dryRunDone && (
                  <Badge variant="outline">Dry-run requis avant écriture</Badge>
                )}
              </div>

              {isImporting && (
                <div>
                  <Progress value={progress} className="h-2" />
                  <p className="mt-1 text-sm text-muted-foreground">
                    {progress}% terminé
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {prepared && dryRunDone && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Résultat du dry-run
              </CardTitle>
              <CardDescription>
                Aucune écriture en base — journalisé dans audit_log
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-lg border p-4">
                  <p className="text-2xl font-bold">{prepared.totalRows}</p>
                  <p className="text-sm text-muted-foreground">Lignes lues</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-2xl font-bold text-green-600">
                    {prepared.acceptedCount}
                  </p>
                  <p className="text-sm text-muted-foreground">Acceptées</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-2xl font-bold text-red-600">
                    {prepared.rejectedCount}
                  </p>
                  <p className="text-sm text-muted-foreground">Rejetées</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-2xl font-bold">{selectedTable}</p>
                  <p className="text-sm text-muted-foreground">Table cible</p>
                </div>
              </div>

              {complementSummary && (
                <Alert>
                  <AlertTitle>Complément instructors</AlertTitle>
                  <AlertDescription>
                    {complementSummary.inserts} insertion(s),{" "}
                    {complementSummary.updates} mise(s) à jour (clé email ou
                    nom+prénom). Mode : {writeMode}.
                  </AlertDescription>
                </Alert>
              )}

              {backfillSummary && (
                <Alert>
                  <AlertTitle>Backfill formateur (rapprochement)</AlertTitle>
                  <AlertDescription className="space-y-1 text-sm">
                    <p>
                      Rapprochées 1↔1 : <strong>{backfillSummary.matched}</strong>
                    </p>
                    <p>
                      DB sans correspondance : {backfillSummary.unmatchedDb}{" "}
                      (dont {backfillSummary.encodingDups} doublons
                      d&apos;encodage)
                    </p>
                    <p>CSV sans correspondance : {backfillSummary.unmatchedCsv}</p>
                    <p>Correspondances multiples : {backfillSummary.multiples}</p>
                    <p>
                      Écriture limitée à formateur / formateur_email /
                      formateur_telephone.
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              {prepared.rejections.length > 0 && (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">
                      20 premières erreurs (sur {prepared.rejectedCount})
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadRejections}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Télécharger le CSV des rejets
                    </Button>
                  </div>
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erreurs de validation</AlertTitle>
                    <AlertDescription>
                      <div className="mt-2 max-h-[240px] space-y-1 overflow-y-auto text-sm">
                        {prepared.rejections.slice(0, 20).map((r) => (
                          <p key={`${r.lineNumber}-${r.reason}`}>
                            • Ligne {r.lineNumber} : {r.reason}
                          </p>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                </>
              )}

              {prepared.rejections.length === 0 && (
                <Button variant="outline" size="sm" disabled>
                  Aucun rejet à télécharger
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {importResult && (
          <Card>
            <CardHeader>
              <CardTitle>Résultat de l&apos;écriture</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p>
                <strong>{importResult.imported}</strong> ligne(s) insérée(s) dans{" "}
                <code>{selectedTable}</code>.
              </p>
              {importResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTitle>Erreurs d&apos;écriture</AlertTitle>
                  <AlertDescription>
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-sm">
                      {importResult.errors.map((err) => (
                        <li key={err}>{err}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Mode d&apos;emploi</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none text-sm text-muted-foreground">
            <ol className="list-decimal space-y-2 pl-4">
              <li>Choisir la table cible et vérifier le volume affiché.</li>
              <li>
                Déposer un CSV <strong>;</strong> en UTF-8 (utf-8-sig accepté).
              </li>
              <li>
                Lancer le <strong>dry-run</strong> : contrôle des lignes
                acceptées / rejetées (20 premières erreurs à l&apos;écran).
              </li>
              <li>
                Télécharger le rapport CSV des rejets si besoin, corriger le
                fichier, recommencer le dry-run.
              </li>
              <li>
                Seulement ensuite : <strong>Écrire en base</strong> (journalisé).
              </li>
              <li>
                Purge : uniquement table par table, en tapant le nom exact, avec
                le nombre de lignes affiché.
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
