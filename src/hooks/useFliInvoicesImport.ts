import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  linkEsfPartners,
  matchFliInvoicesToInscriptions,
  toInvoiceInsert,
  FLI_INVOICES_WRITE_CONFIRMATION,
  type EsfPartnerInput,
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
  partnersLinked: number;
  errors: string[];
}

async function loadEsfPartners(): Promise<EsfPartnerInput[]> {
  const { data, error } = await supabase
    .from("partners")
    .select("id, name, type, station, esf_code")
    .eq("type", "esf");
  if (error) throw error;
  return (data ?? []) as EsfPartnerInput[];
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
      const [inscriptions, partners] = await Promise.all([
        loadInscriptions(),
        loadEsfPartners(),
      ]);
      const report = matchFliInvoicesToInscriptions(rows, inscriptions);
      report.esfPartners = linkEsfPartners(rows, report, partners);
      await writeAudit(user?.id, "import_dry_run", {
        filename: "facturation_FLI",
        total_rows: rows.length,
        matched: report.matched.length,
        unmatched: report.unmatched.length,
        ambiguous: report.ambiguous.length,
        esf_partners: report.esfPartners,
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
      confirmation,
    }: {
      rows: FliInvoiceParsedRow[];
      match: FliInvoicesMatchReport;
      confirmation: string;
    }): Promise<FliInvoicesWriteResult> => {
      if (confirmation.trim() !== FLI_INVOICES_WRITE_CONFIRMATION) {
        throw new Error(`Écriture bloquée : taper exactement « ${FLI_INVOICES_WRITE_CONFIRMATION} ».`);
      }
      const result: FliInvoicesWriteResult = {
        inserted: 0,
        skippedExisting: 0,
        paymentsInserted: 0,
        relatedLinked: 0,
        partnersLinked: 0,
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
      const partners = await loadEsfPartners();
      const esfLinks = linkEsfPartners(rows, match, partners);
      const esfPartnerByInvoice = new Map(
        esfLinks
          .filter((link) => link.partnerId)
          .map((link) => [
            link.invoiceNumber,
            partners.find((p) => p.id === link.partnerId) ?? null,
          ])
      );

      const toInsert = rows.filter((row) => !existingByNumber.has(row.invoiceNumber));
      result.skippedExisting = rows.length - toInsert.length;

      for (let i = 0; i < toInsert.length; i += BATCH) {
        const batch = toInsert.slice(i, i + BATCH).map((row) =>
          toInvoiceInsert(
            row,
            matchByNumber.get(row.invoiceNumber) ?? null,
            esfPartnerByInvoice.get(row.invoiceNumber) ?? null
          )
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
        const esfPartner = esfPartnerByInvoice.get(row.invoiceNumber) ?? null;
        const payerType = row.clientType === "ecole_ski" ? "ecole" : "stagiaire";
        const payerName = esfPartner?.name ?? row.clientName;
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
            payer_name: payerName,
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
            payer_name: payerName,
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

      const partnerUpdates = esfLinks.filter((link) => link.partnerId && link.inscriptionId);
      if (partnerUpdates.length > 0) {
        const inscriptionIds = partnerUpdates.map((link) => link.inscriptionId as string);
        const { data: current, error: currentError } = await supabase
          .from("inscriptions")
          .select("id, partner_id")
          .in("id", inscriptionIds);
        if (currentError) {
          result.errors.push(`Lecture inscriptions partenaires : ${currentError.message}`);
        } else {
          const byId = new Map((current ?? []).map((row) => [row.id, row.partner_id]));
          for (const link of partnerUpdates) {
            const inscriptionId = link.inscriptionId as string;
            if (byId.get(inscriptionId)) continue;
            const { error } = await supabase
              .from("inscriptions")
              .update({ partner_id: link.partnerId })
              .eq("id", inscriptionId);
            if (error) result.errors.push(`Partenaire ${link.invoiceNumber} : ${error.message}`);
            else result.partnersLinked += 1;
          }
        }
      }

      await writeAudit(user?.id, "import", {
        filename: "facturation_FLI",
        inserted: result.inserted,
        skipped_existing: result.skippedExisting,
        payments_inserted: result.paymentsInserted,
        related_linked: result.relatedLinked,
        partners_linked: result.partnersLinked,
        esf_partners: esfLinks,
        write_errors: result.errors.slice(0, 20),
      });

      return result;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}
