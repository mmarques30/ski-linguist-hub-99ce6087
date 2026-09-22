import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, Receipt } from "lucide-react";
import {
  StatusPill,
  SurfaceCard,
  TableCell,
  TableFrame,
  TableHeadCell,
  TableHeadRow,
  TableRow,
} from "@/components/ui-kit";
import {
  parseFliInvoicesCsv,
  FLI_INVOICES_WRITE_CONFIRMATION,
  type FliInvoicesMatchReport,
  type FliInvoicesPreview,
} from "@/lib/fli-invoices-csv-import";
import { useFliInvoicesImport, useFliInvoicesMatch } from "@/hooks/useFliInvoicesImport";
import { downloadTextFile } from "@/lib/csv-import-parser";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [okImport, setOkImport] = useState("");
  const dryRun = useFliInvoicesMatch();
  const write = useFliInvoicesImport();

  const handleFile = async (file: File) => {
    setParseError(null);
    setMatch(null);
    setOkImport("");
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
      const result = await write.mutateAsync({
        rows: preview.rows,
        match,
        confirmation: okImport,
      });
      toast.success(
        `Écriture : ${result.inserted} facture(s), ${result.paymentsInserted} paiement(s), ${result.partnersLinked} partenaire(s), ${result.skippedExisting} déjà en base.`
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
    const lines = ["facture;nom;date;montant_ttc;resolution"];
    for (const row of preview.emptyPaymentMethods) {
      lines.push(
        [row.invoiceNumber, row.clientName, row.invoiceDate, String(row.amountTtc), row.resolution]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(";")
      );
    }
    downloadTextFile("factures-sans-moyen-paiement.csv", lines.join("\n"));
  };

  const downloadAmbiguous = () => {
    if (!match) return;
    const lines = ["facture;nom;date_facture;date_debut;langue;candidates"];
    for (const row of match.ambiguous) {
      const cands = row.candidates.map((c) => `${c.code ?? "?"} ${c.name}`).join(" | ");
      lines.push(
        [row.invoiceNumber, row.clientName, row.invoiceDate, row.startDate ?? "", row.language ?? "", cands]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(";")
      );
    }
    downloadTextFile("factures-ambigues.csv", lines.join("\n"));
  };

  return (
    <SurfaceCard
      title="Tableur FLI — Facturation historique"
      icon={Receipt}
      description={
        <>
          CSV Paula (<code>;</code>, UTF-8 BOM, dates ISO, virgule décimale). Les numéros
          Fact FLI sont conservés. Dry-run obligatoire avant écriture : totaux HT/TTC par
          exercice à comparer à l&apos;expert-comptable.
        </>
      }
      actions={fileName ? <StatusPill tone="info">{fileName}</StatusPill> : undefined}
    >
      <div className="space-y-4">
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
        <button
          type="button"
          className="w-full cursor-pointer rounded-[var(--radius)] border-2 border-dashed border-border p-6 text-center transition-colors hover:bg-[hsl(var(--surface-sunken))]"
          onClick={() => fileRef.current?.click()}
        >
          {fileName ? (
            <span className="flex items-center justify-center gap-2 text-sm">
              <FileSpreadsheet className="h-4 w-4" />
              {fileName}
            </span>
          ) : (
            <span className="block text-sm text-muted-foreground">
              <Upload className="inline h-4 w-4 mr-1" />
              Déposer un fichier CSV de facturation
            </span>
          )}
        </button>

        {parseError && (
          <Alert variant="destructive">
            <AlertTitle>Fichier refusé</AlertTitle>
            <AlertDescription>{parseError}</AlertDescription>
          </Alert>
        )}

        {preview && (
          <>
            <div className="flex flex-wrap gap-2">
              <StatusPill tone="neutral" size="sm">{preview.totalRows} lignes</StatusPill>
              <StatusPill tone="neutral" size="sm">
                {preview.sequence.min} → {preview.sequence.max}
              </StatusPill>
              {preview.sequence.knownGapPreserved && (
                <StatusPill tone="warning" size="sm">Trou 13288 conservé</StatusPill>
              )}
              <StatusPill tone="info" size="sm">
                {preview.byType.formation} formation · {preview.byType.test} test ·{" "}
                {preview.byType.soustraitance} sous-traitance
              </StatusPill>
            </div>

            {preview.sequence.missing.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Séquences absentes (non comblées) : {preview.sequence.missing.join(", ")}
              </p>
            )}

            <div>
              <h3 className="text-sm font-medium mb-2">Totaux par exercice (dry-run, aucune écriture)</h3>
              <div className="overflow-hidden rounded-[var(--radius)] border border-border">
                <TableFrame>
                  <table className="w-full">
                    <thead>
                      <TableHeadRow>
                        <TableHeadCell>Exercice</TableHeadCell>
                        <TableHeadCell align="right">N</TableHeadCell>
                        <TableHeadCell align="right">HT</TableHeadCell>
                        <TableHeadCell align="right">TVA</TableHeadCell>
                        <TableHeadCell align="right">TTC</TableHeadCell>
                      </TableHeadRow>
                    </thead>
                    <tbody>
                      {preview.totalsByYear.map((y) => (
                        <TableRow key={y.year}>
                          <TableCell>{y.year}</TableCell>
                          <TableCell align="right" className="tabular">{y.n}</TableCell>
                          <TableCell align="right" className="tabular">{euro(y.ht)}</TableCell>
                          <TableCell align="right" className="tabular">{euro(y.tva)}</TableCell>
                          <TableCell align="right" className="tabular">{euro(y.ttc)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-[hsl(var(--surface-sunken))]">
                        <TableCell className="font-medium">Total</TableCell>
                        <TableCell align="right" className="font-medium tabular">
                          {preview.grandTotal.n}
                        </TableCell>
                        <TableCell align="right" className="font-medium tabular">
                          {euro(preview.grandTotal.ht)}
                        </TableCell>
                        <TableCell align="right" className="font-medium tabular">
                          {euro(preview.grandTotal.tva)}
                        </TableCell>
                        <TableCell align="right" className="font-medium tabular">
                          {euro(preview.grandTotal.ttc)}
                        </TableCell>
                      </TableRow>
                    </tbody>
                  </table>
                </TableFrame>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Chiffre d&apos;affaires (hors annulées, avoirs déduits)</h3>
              <div className="overflow-hidden rounded-[var(--radius)] border border-border">
                <TableFrame>
                  <table className="w-full">
                    <thead>
                      <TableHeadRow>
                        <TableHeadCell>Exercice</TableHeadCell>
                        <TableHeadCell align="right">N</TableHeadCell>
                        <TableHeadCell align="right">HT</TableHeadCell>
                        <TableHeadCell align="right">TVA</TableHeadCell>
                        <TableHeadCell align="right">TTC</TableHeadCell>
                      </TableHeadRow>
                    </thead>
                    <tbody>
                      {preview.caByYear.map((y) => (
                        <TableRow key={`ca-${y.year}`}>
                          <TableCell>{y.year}</TableCell>
                          <TableCell align="right" className="tabular">{y.n}</TableCell>
                          <TableCell align="right" className="tabular">{euro(y.ht)}</TableCell>
                          <TableCell align="right" className="tabular">{euro(y.tva)}</TableCell>
                          <TableCell align="right" className="tabular">{euro(y.ttc)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-[hsl(var(--surface-sunken))]">
                        <TableCell className="font-medium">CA</TableCell>
                        <TableCell align="right" className="font-medium tabular">
                          {preview.caGrandTotal.n}
                        </TableCell>
                        <TableCell align="right" className="font-medium tabular">
                          {euro(preview.caGrandTotal.ht)}
                        </TableCell>
                        <TableCell align="right" className="font-medium tabular">
                          {euro(preview.caGrandTotal.tva)}
                        </TableCell>
                        <TableCell align="right" className="font-medium tabular">
                          {euro(preview.caGrandTotal.ttc)}
                        </TableCell>
                      </TableRow>
                    </tbody>
                  </table>
                </TableFrame>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {preview.cancelled.length} annulée(s) exclues · {preview.credits.length} avoir(s)
                en négatif.
              </p>
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
                annulée, {preview.byPaymentKind.historique} historique,{" "}
                {preview.byPaymentKind.a_verifier} à vérifier, {preview.byPaymentKind.esf}{" "}
                facturé à l&apos;ESF.
              </p>
              {preview.emptyPaymentMethods.length > 0 && (
                <Button variant="link" className="h-auto p-0" onClick={downloadEmptyMeans}>
                  Télécharger les {preview.emptyPaymentMethods.length} moyens vides
                </Button>
              )}
            </div>

            {preview.esfBilled.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {preview.esfBilled.length} facture(s) « facturé à l&apos;ESF » → payeur école
                {preview.esfBilled.map((r) => r.location).filter(Boolean).length > 0
                  ? `, lieu ${[...new Set(preview.esfBilled.map((r) => r.location).filter(Boolean))].join(", ")}`
                  : ""}
                . Le partenaire ESF est proposé au dry-run.
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void handleDryRun()} disabled={dryRun.isPending}>
                {dryRun.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Dry-run rattachement inscriptions
              </Button>
            </div>

            {match && (
              <div className="text-sm space-y-2">
                <p>
                  Rattachées : <strong>{match.matched.length}</strong> · non rattachées :{" "}
                  <strong>{match.unmatched.length}</strong> · ambiguës :{" "}
                  <strong>{match.ambiguous.length}</strong>
                </p>
                <div className="overflow-hidden rounded-[var(--radius)] border border-border">
                  <TableFrame>
                    <table className="w-full">
                      <thead>
                        <TableHeadRow>
                          <TableHeadCell>Exercice</TableHeadCell>
                          <TableHeadCell align="right">Rattachées</TableHeadCell>
                          <TableHeadCell align="right">Non rattachées</TableHeadCell>
                          <TableHeadCell align="right">Ambiguës</TableHeadCell>
                        </TableHeadRow>
                      </thead>
                      <tbody>
                        {Object.entries(match.byYear)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([year, counts]) => (
                            <TableRow key={year}>
                              <TableCell>{year}</TableCell>
                              <TableCell align="right" className="tabular">{counts.matched}</TableCell>
                              <TableCell align="right" className="tabular">{counts.unmatched}</TableCell>
                              <TableCell align="right" className="tabular">{counts.ambiguous}</TableCell>
                            </TableRow>
                          ))}
                      </tbody>
                    </table>
                  </TableFrame>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={downloadUnmatched}>
                    Télécharger les non-rattachées
                  </Button>
                  {match.ambiguous.length > 0 && (
                    <Button variant="outline" size="sm" onClick={downloadAmbiguous}>
                      Télécharger les {match.ambiguous.length} ambiguës
                    </Button>
                  )}
                </div>
                {match.esfPartners.length > 0 && (
                  <div className="space-y-1">
                    <p className="font-medium">Facturé à l&apos;ESF → partenaire</p>
                    <ul className="list-disc pl-5">
                      {match.esfPartners.map((link) => (
                        <li key={link.invoiceNumber}>
                          {link.invoiceNumber} {link.clientName}
                          {link.location ? ` (${link.location})` : ""} →{" "}
                          {link.partnerName
                            ? `${link.partnerName}${link.partnerCode ? ` ${link.partnerCode}` : ""}`
                            : "partenaire non unique"}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <Alert>
                  <AlertTitle className="flex flex-wrap items-center gap-2">
                    <StatusPill tone="danger" size="sm">Écriture bloquée</StatusPill>
                  </AlertTitle>
                  <AlertDescription>
                    Taper exactement « {FLI_INVOICES_WRITE_CONFIRMATION} » pour déverrouiller.
                    Sans ce feu vert, rien n&apos;est écrit.
                  </AlertDescription>
                </Alert>
                <div className="flex flex-wrap items-end gap-3 rounded-[var(--radius)] border border-destructive/40 bg-destructive/5 p-3">
                  <div className="space-y-1">
                    <Label htmlFor="ok-import">Confirmation</Label>
                    <Input
                      id="ok-import"
                      value={okImport}
                      onChange={(e) => setOkImport(e.target.value)}
                      placeholder={FLI_INVOICES_WRITE_CONFIRMATION}
                      autoComplete="off"
                      className="w-48"
                    />
                  </div>
                  <Button
                    onClick={() => void handleWrite()}
                    disabled={
                      write.isPending ||
                      okImport.trim() !== FLI_INVOICES_WRITE_CONFIRMATION
                    }
                  >
                    {write.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    Écrire en base
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </SurfaceCard>
  );
}
