import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  matchFliInvoicesToInscriptions,
  toInvoiceInsert,
  type FliInvoiceParsedRow,
  type FliInvoicesMatchReport,
  type InscriptionMatchInput,
} from "@/lib/fli-invoices-csv-import";

const BATCH = 50;

export interface FliInvoicesWriteResult {
  inserted: number;
  skippedExisting: number;
  paymentsInserted: number;
  relatedLinked: number;
  errors: string[];
}

async function loadInscriptions(): Promise<InscriptionMatchInput[]> {
  const { data, error } = await supabase
    .from("inscriptions")
    .select("id, code, start_date, language, students(first_name, last_name)")
    .range(0, 4999);
  if (error) throw error;
  return (data ?? []).map((row) => {
    const student = row.students as
      | { first_name: string | null; last_name: string | null }
      | { first_name: string | null; last_name: string | null }[]
      | null;
    const one = Array.isArray(student) ? student[0] : student;
    return {
      id: row.id,
      code: row.code,
      start_date: row.start_date,
      language: row.language,
      first_name: one?.first_name ?? null,
      last_name: one?.last_name ?? null,
    };
  });
}

async function writeAudit(
  userId: string | undefined,
  action: string,
  payload: Record<string, unknown>
) {
  const { error } = await supabase.from("audit_log").insert({
    user_id: userId ?? null,
    action,
    table_name: "invoices",
    record_id: null,
    new_values: payload as never,
  });
  if (error) throw new Error(`Journalisation impossible : ${error.message}`);
}

export function useFliInvoicesMatch() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (rows: FliInvoiceParsedRow[]): Promise<FliInvoicesMatchReport> => {
      const inscriptions = await loadInscriptions();
      const report = matchFliInvoicesToInscriptions(rows, inscriptions);
      await writeAudit(user?.id, "import_dry_run", {
        filename: "facturation_FLI",
        total_rows: rows.length,
        matched: report.matched.length,
        unmatched: report.unmatched.length,
        ambiguous: report.ambiguous.length,
        by_year: report.byYear,
      });
      return report;
    },
  });
}

export function useFliInvoicesImport() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      rows,
      match,
    }: {
      rows: FliInvoiceParsedRow[];
      match: FliInvoicesMatchReport;
    }): Promise<FliInvoicesWriteResult> => {
      const result: FliInvoicesWriteResult = {
        inserted: 0,
        skippedExisting: 0,
        paymentsInserted: 0,
        relatedLinked: 0,
        errors: [],
      };

      const { data: existing, error: existingError } = await supabase
        .from("invoices")
        .select("id, invoice_number, sequence_number");
      if (existingError) throw existingError;

      const existingByNumber = new Map(
        (existing ?? [])
          .filter((row) => row.invoice_number)
          .map((row) => [row.invoice_number as string, row.id])
      );
      const matchByNumber = new Map(
        match.matched.map((m) => [m.invoiceNumber, m.inscriptionId])
      );

      const toInsert = rows.filter((row) => !existingByNumber.has(row.invoiceNumber));
      result.skippedExisting = rows.length - toInsert.length;

      for (let i = 0; i < toInsert.length; i += BATCH) {
        const batch = toInsert.slice(i, i + BATCH).map((row) =>
          toInvoiceInsert(row, matchByNumber.get(row.invoiceNumber) ?? null)
        );
        const { data, error } = await supabase
          .from("invoices")
          .insert(batch as never)
          .select("id, invoice_number, sequence_number");
        if (error) {
          result.errors.push(`Lot factures ${Math.floor(i / BATCH) + 1} : ${error.message}`);
          continue;
        }
        result.inserted += data?.length ?? 0;
        for (const row of data ?? []) {
          if (row.invoice_number) existingByNumber.set(row.invoice_number, row.id);
        }
      }

      const sequenceToId = new Map<number, string>();
      for (const row of rows) {
        const id = existingByNumber.get(row.invoiceNumber);
        if (id) sequenceToId.set(row.sequence, id);
      }

      const relatedUpdates: Array<{ id: string; related: string }> = [];
      for (const row of rows) {
        if (!row.relatedInvoiceRef) continue;
        const invoiceId = existingByNumber.get(row.invoiceNumber);
        if (!invoiceId) continue;
        const relatedId = row.relatedInvoiceRef.includes(".")
          ? existingByNumber.get(row.relatedInvoiceRef)
          : sequenceToId.get(Number.parseInt(row.relatedInvoiceRef, 10));
        if (relatedId) relatedUpdates.push({ id: invoiceId, related: relatedId });
      }
      for (const upd of relatedUpdates) {
        const { error } = await supabase
          .from("invoices")
          .update({ related_invoice_id: upd.related })
          .eq("id", upd.id);
        if (error) result.errors.push(`Avoir ${upd.id} : ${error.message}`);
        else result.relatedLinked += 1;
      }

      const payments: Record<string, unknown>[] = [];
      for (const row of rows) {
        const invoiceId = existingByNumber.get(row.invoiceNumber);
        const inscriptionId = matchByNumber.get(row.invoiceNumber) ?? null;
        const payerType = row.clientType === "ecole_ski" ? "ecole" : "stagiaire";
        if (
          row.depositAmount &&
          row.depositAmount > 0 &&
          row.depositMethod &&
          row.depositDate
        ) {
          payments.push({
            invoice_id: invoiceId ?? null,
            inscription_id: inscriptionId,
            amount: row.depositAmount,
            payment_type: "acompte",
            payment_method: row.depositMethod,
            payment_date: row.depositDate,
            currency: "EUR",
            payer_type: payerType,
            payer_name: row.clientName,
          });
        }
        if (row.paymentMethod && row.invoiceStatus === "paid" && row.paymentDate) {
          payments.push({
            invoice_id: invoiceId ?? null,
            inscription_id: inscriptionId,
            amount: Math.abs(row.amountTtc),
            payment_type: "total",
            payment_method: row.paymentMethod,
            payment_date: row.paymentDate,
            currency: "EUR",
            payer_type: payerType,
            payer_name: row.clientName,
            cheque_number: row.chequeNumber,
            cheque_bank: row.chequeBank,
            cheque_date: row.paymentMethod === "cheque" ? row.paymentDate : null,
          });
        }
      }

      for (let i = 0; i < payments.length; i += BATCH) {
        const batch = payments.slice(i, i + BATCH);
        const { error } = await supabase.from("payments").insert(batch as never);
        if (error) {
          result.errors.push(`Lot paiements ${Math.floor(i / BATCH) + 1} : ${error.message}`);
        } else {
          result.paymentsInserted += batch.length;
        }
      }

      await writeAudit(user?.id, "import", {
        filename: "facturation_FLI",
        inserted: result.inserted,
        skipped_existing: result.skippedExisting,
        payments_inserted: result.paymentsInserted,
        related_linked: result.relatedLinked,
        write_errors: result.errors.slice(0, 20),
      });

      return result;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}
