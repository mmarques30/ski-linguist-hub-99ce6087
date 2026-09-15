import { useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2 } from "lucide-react";
import {
  parseFliInvoicesCsv,
  type FliInvoicesMatchReport,
  type FliInvoicesPreview,
} from "@/lib/fli-invoices-csv-import";
import { useFliInvoicesImport, useFliInvoicesMatch } from "@/hooks/useFliInvoicesImport";
import { downloadTextFile } from "@/lib/csv-import-parser";
import { toast } from "sonner";

function euro(n: number): string {
  return n.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function FliInvoicesImportCard() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<FliInvoicesPreview | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [match, setMatch] = useState<FliInvoicesMatchReport | null>(null);
  const dryRun = useFliInvoicesMatch();
  const write = useFliInvoicesImport();

  const handleFile = async (file: File) => {
    setParseError(null);
    setMatch(null);
    try {
      const text = await file.text();
      setPreview(parseFliInvoicesCsv(text));
      setFileName(file.name);
    } catch (err) {
      setPreview(null);
      setFileName("");
      setParseError(err instanceof Error ? err.message : "Fichier illisible");
    }
  };

  const handleDryRun = async () => {
    if (!preview) return;
    try {
      const report = await dryRun.mutateAsync(preview.rows);
      setMatch(report);
      toast.success(
        `Dry-run : ${report.matched.length} rattachée(s), ${report.unmatched.length} non rattachée(s), ${report.ambiguous.length} ambiguë(s). Rien n'est écrit.`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Dry-run impossible");
    }
  };

  const handleWrite = async () => {
    if (!preview || !match) return;
    try {
      const result = await write.mutateAsync({ rows: preview.rows, match });
      toast.success(
        `Écriture : ${result.inserted} facture(s), ${result.paymentsInserted} paiement(s), ${result.skippedExisting} déjà en base.`
      );
      if (result.errors.length > 0) {
        toast.warning(`${result.errors.length} erreur(s) — voir la console`);
        console.warn(result.errors);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Écriture impossible");
    }
  };

  const downloadUnmatched = () => {
    if (!match) return;
    const lines = ["facture;nom;debut;langue;exercice;motif"];
    for (const row of match.unmatched) {
      lines.push(
        [row.invoiceNumber, row.clientName, row.startDate ?? "", row.language ?? "", row.year, row.reason]
          .map((v) => `"${v.replace(/"/g, '""')}"`)
          .join(";")
      );
    }
    downloadTextFile("factures-non-rattachees.csv", lines.join("\n"));
  };

  const downloadEmptyMeans = () => {
    if (!preview) return;
    const lines = ["facture;nom;exercice;ht"];
    for (const row of preview.emptyPaymentMethods) {
      lines.push(
        [row.invoiceNumber, row.clientName, row.year, String(row.amountHt)]
          .map((v) => `"${v.replace(/"/g, '""')}"`)
          .join(";")
      );
    }
    downloadTextFile("factures-moyen-vide.csv", lines.join("\n"));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tableur FLI — Facturation historique</CardTitle>
        <CardDescription>
          CSV Paula (<code>;</code>, UTF-8 BOM, dates ISO, virgule décimale). Les numéros
          Fact FLI sont conservés. Dry-run obligatoire avant écriture : totaux HT/TTC par
          exercice à comparer à l&apos;expert-comptable.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
          {fileName ? (
            <p className="flex items-center justify-center gap-2 text-sm">
              <FileSpreadsheet className="h-4 w-4" />
              {fileName}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              <Upload className="inline h-4 w-4 mr-1" />
              Déposer facturation_FLI_2026_09_15.csv
            </p>
          )}
        </div>

        {parseError && (
          <Alert variant="destructive">
            <AlertTitle>Fichier refusé</AlertTitle>
            <AlertDescription>{parseError}</AlertDescription>
          </Alert>
        )}

        {preview && (
          <>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{preview.totalRows} lignes</Badge>
              <Badge variant="outline">
                {preview.sequence.min} → {preview.sequence.max}
              </Badge>
              {preview.sequence.knownGapPreserved && (
                <Badge>Trou 13288 conservé</Badge>
              )}
              <Badge variant="outline">
                {preview.byType.formation} formation · {preview.byType.test} test ·{" "}
                {preview.byType.soustraitance} sous-traitance
              </Badge>
            </div>

            {preview.sequence.missing.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Séquences absentes (non comblées) : {preview.sequence.missing.join(", ")}
              </p>
            )}

            <div>
              <h3 className="text-sm font-medium mb-2">Totaux par exercice (dry-run, aucune écriture)</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exercice</TableHead>
                    <TableHead className="text-right">N</TableHead>
                    <TableHead className="text-right">HT</TableHead>
                    <TableHead className="text-right">TVA</TableHead>
                    <TableHead className="text-right">TTC</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.totalsByYear.map((y) => (
                    <TableRow key={y.year}>
                      <TableCell>{y.year}</TableCell>
                      <TableCell className="text-right">{y.n}</TableCell>
                      <TableCell className="text-right">{euro(y.ht)}</TableCell>
                      <TableCell className="text-right">{euro(y.tva)}</TableCell>
                      <TableCell className="text-right">{euro(y.ttc)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell className="font-medium">Total</TableCell>
                    <TableCell className="text-right font-medium">
                      {preview.grandTotal.n}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {euro(preview.grandTotal.ht)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {euro(preview.grandTotal.tva)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {euro(preview.grandTotal.ttc)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {preview.ambiguousTypes.length > 0 && (
              <Alert>
                <AlertTitle>
                  {preview.ambiguousTypes.length} type(s) ambigu(s) — test par défaut
                </AlertTitle>
                <AlertDescription className="text-sm">
                  {preview.ambiguousTypes
                    .map((a) => `${a.invoiceNumber} (${a.note})`)
                    .join(" · ")}
                </AlertDescription>
              </Alert>
            )}

            {preview.rows.some((r) => r.typeNote && !r.typeAmbiguous) && (
              <p className="text-sm text-muted-foreground">
                Graphies / avoirs à TVA :{" "}
                {preview.rows
                  .filter((r) => r.typeNote && !r.typeAmbiguous)
                  .map((r) => `${r.invoiceNumber} → ${r.invoiceType}`)
                  .join(" · ")}
              </p>
            )}

            <div className="text-sm space-y-1">
              <p>
                Moyens : {preview.byPaymentKind.cheque} chèque, {preview.byPaymentKind.virement}{" "}
                virement, {preview.byPaymentKind.cb} CB, {preview.byPaymentKind.unpaid} à
                régler, {preview.byPaymentKind.credit} avoir, {preview.byPaymentKind.cancelled}{" "}
                annulée, {preview.byPaymentKind.empty} vide (à demander),{" "}
                {preview.byPaymentKind.esf} facturé à l&apos;ESF.
              </p>
              {preview.emptyPaymentMethods.length > 0 && (
                <Button variant="link" className="h-auto p-0" onClick={downloadEmptyMeans}>
                  Télécharger les {preview.emptyPaymentMethods.length} moyens vides
                </Button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void handleDryRun()} disabled={dryRun.isPending}>
                {dryRun.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Dry-run rattachement inscriptions
              </Button>
              <Button
                onClick={() => void handleWrite()}
                disabled={!match || write.isPending}
              >
                {write.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Écrire en base
              </Button>
            </div>

            {match && (
              <div className="text-sm space-y-2">
                <p>
                  Rattachées : <strong>{match.matched.length}</strong> · non rattachées :{" "}
                  <strong>{match.unmatched.length}</strong> · ambiguës :{" "}
                  <strong>{match.ambiguous.length}</strong>
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Exercice</TableHead>
                      <TableHead className="text-right">Rattachées</TableHead>
                      <TableHead className="text-right">Non rattachées</TableHead>
                      <TableHead className="text-right">Ambiguës</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(match.byYear)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([year, counts]) => (
                        <TableRow key={year}>
                          <TableCell>{year}</TableCell>
                          <TableCell className="text-right">{counts.matched}</TableCell>
                          <TableCell className="text-right">{counts.unmatched}</TableCell>
                          <TableCell className="text-right">{counts.ambiguous}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
                <Button variant="outline" size="sm" onClick={downloadUnmatched}>
                  Télécharger les non-rattachées
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
