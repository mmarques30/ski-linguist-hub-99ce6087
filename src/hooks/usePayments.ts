import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { notifyAdmins } from "@/lib/notify-admins";
import { INVOICE_ORIGIN_APP } from "@/lib/invoice-origin";

export interface Payment {
  id: string;
  inscription_id: string | null;
  invoice_id: string | null;
  amount: number;
  currency: string;
  payment_method: string;
  payment_date: string;
  status: string;
  cheque_status: string | null;
  reference: string | null;
  payer_type: string | null;
  payer_name: string | null;
  notes: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  inscription?: {
    id: string;
    code: string | null;
    student: {
      first_name: string;
      last_name: string;
      company: string | null;
    } | null;
  } | null;
  invoice?: {
    invoice_number: string | null;
  } | null;
}

export interface PaymentReminder {
  id: string;
  payment_id: string | null;
  inscription_id: string;
  reminder_type: string;
  sent_at: string;
  sent_via: string;
  response_status: string | null;
  notes: string | null;
  created_at: string;
}

export interface PaymentFilters {
  status?: string;
  method?: string;
  startDate?: string;
  endDate?: string;
}

export function usePayments(filters?: PaymentFilters) {
  return useQuery({
    queryKey: ["payments", filters],
    queryFn: async () => {
      let query = supabase
        .from("payments")
        .select(`
          *,
          inscription:inscription_id (
            id, code,
            student:student_id ( first_name, last_name, company )
          ),
          invoice:invoice_id ( invoice_number )
        `)
        .order("payment_date", { ascending: false });

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }
      if (filters?.method && filters.method !== "all") {
        query = query.eq("payment_method", filters.method);
      }
      if (filters?.startDate) {
        query = query.gte("payment_date", filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte("payment_date", filters.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return ((data || []) as unknown) as Payment[];
    },
  });
}

export function usePaymentKPIs(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["payment-kpis", startDate, endDate],
    queryFn: async () => {
      const today = new Date();
      const start = startDate || new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
      const end = endDate || new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split("T")[0];

      // Encaissé ce mois
      const { data: received } = await supabase
        .from("payments")
        .select("amount")
        .eq("status", "recu")
        .gte("payment_date", start)
        .lte("payment_date", end);

      const totalReceived = received?.reduce((s, p) => s + Number(p.amount || 0), 0) || 0;

      // En attente
      const { data: pending } = await supabase
        .from("payments")
        .select("amount")
        .eq("status", "en_attente");

      const totalPending = pending?.reduce((s, p) => s + Number(p.amount || 0), 0) || 0;

      // Factures en retard — uniquement émises par l'app (BL-007 : hors import)
      const { data: overdueInvoices } = await supabase
        .from("invoices")
        .select("amount_ttc")
        .eq("status", "sent")
        .eq("origin", INVOICE_ORIGIN_APP)
        .lt("due_date", today.toISOString().split("T")[0]);

      const totalOverdue = overdueInvoices?.reduce((s, i) => s + Number(i.amount_ttc || 0), 0) || 0;

      // Taux de recouvrement — période courante, factures app seulement
      const { data: allInvoices } = await supabase
        .from("invoices")
        .select("amount_ttc, status")
        .eq("origin", INVOICE_ORIGIN_APP)
        .gte("invoice_date", start)
        .lte("invoice_date", end);

      const totalInvoiced = allInvoices?.reduce((s, i) => s + Number(i.amount_ttc || 0), 0) || 0;
      const recoveryRate = totalInvoiced > 0 ? (totalReceived / totalInvoiced) * 100 : 0;

      return {
        totalReceived,
        totalPending,
        totalOverdue,
        recoveryRate,
      };
    },
  });
}

export async function ensureInvoicePayment(params: {
  invoiceId: string;
  inscriptionId?: string | null;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  payerName?: string | null;
  chequeStatus?: string | null;
}): Promise<"created" | "already_paid"> {
  const { data: existing, error: readError } = await supabase
    .from("payments")
    .select("id, amount")
    .eq("invoice_id", params.invoiceId);
  if (readError) throw readError;
  const paid = (existing ?? []).reduce((sum, row) => sum + Number(row.amount || 0), 0);
  if (params.amount <= 0 || paid + 0.009 >= params.amount) {
    return "already_paid";
  }
  const remaining = Math.round((params.amount - paid) * 100) / 100;
  const { error } = await supabase.from("payments").insert({
    invoice_id: params.invoiceId,
    inscription_id: params.inscriptionId ?? null,
    amount: remaining,
    payment_type: "total",
    payment_method: params.paymentMethod,
    payment_date: params.paymentDate,
    status: "recu",
    payer_type: "stagiaire",
    payer_name: params.payerName ?? null,
    cheque_status: params.paymentMethod === "cheque" ? params.chequeStatus || "recu" : null,
    cheque_date: params.paymentMethod === "cheque" ? params.paymentDate : null,
  } as never);
  if (error) throw error;

  await notifyAdmins({
    type: "paiement",
    title: `Paiement reçu — ${remaining} €`,
    message: params.payerName
      ? `${params.payerName} · ${params.paymentMethod}`
      : `Méthode : ${params.paymentMethod}`,
    link: params.inscriptionId
      ? `/inscriptions/${params.inscriptionId}?tab=financial`
      : "/finance/payments",
  });

  return "created";
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payment: {
      inscription_id?: string | null;
      invoice_id?: string | null;
      amount: number;
      payment_method: string;
      payment_date: string;
      status: string;
      payment_type?: "acompte" | "partial" | "total";
      cheque_status?: string | null;
      reference?: string | null;
      payer_type?: string | null;
      payer_name?: string | null;
      notes?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("payments")
        .insert({
          ...payment,
          payment_type: payment.payment_type ?? "total",
        })
        .select()
        .single();
      if (error) throw error;

      if (payment.status === "recu") {
        const amountLabel = `${payment.amount} €`;
        await notifyAdmins({
          type: "paiement",
          title: `Paiement reçu — ${amountLabel}`,
          message: payment.payer_name
            ? `${payment.payer_name} · ${payment.payment_method}`
            : `Méthode : ${payment.payment_method}`,
          link: payment.inscription_id
            ? `/inscriptions/${payment.inscription_id}?tab=financial`
            : "/finance/payments",
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["payment-kpis"] });
      queryClient.invalidateQueries({ queryKey: ["financial-kpis"] });
      queryClient.invalidateQueries({ queryKey: ["pending-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function usePaymentReminders(inscriptionId?: string) {
  return useQuery({
    queryKey: ["payment-reminders", inscriptionId],
    queryFn: async () => {
      let query = supabase
        .from("payment_reminders")
        .select("*")
        .order("sent_at", { ascending: false });

      if (inscriptionId) {
        query = query.eq("inscription_id", inscriptionId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as PaymentReminder[];
    },
    enabled: !!inscriptionId || inscriptionId === undefined,
  });
}

export function useCreatePaymentReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reminder: {
      payment_id?: string | null;
      inscription_id: string;
      reminder_type: string;
      sent_via: string;
      notes?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("payment_reminders")
        .insert(reminder)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-reminders"] });
    },
  });
}
