import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Invoice {
  id: string;
  inscription_id: string | null;
  invoice_number: string | null;
  fiscal_year: string | null;
  sequence_number: number | null;
  invoice_date: string;
  due_date: string | null;
  invoice_type: "formation" | "test" | "soustraitance";
  amount_ht: number;
  tva_rate: number | null;
  amount_ttc: number | null;
  status: "draft" | "sent" | "paid" | "cancelled";
  payment_date: string | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceWithInscription extends Invoice {
  inscription?: {
    code: string | null;
    student_name: string | null;
    student_email: string | null;
    student_phone: string | null;
    student_city: string | null;
    student_company: string | null;
    student_address: string | null;
    student_postal_code: string | null;
    course_location: string | null;
    start_date: string;
    end_date: string;
    duration_hours: number | null;
    language: string;
    price: number | null;
    deposit_amount: number | null;
    deposit_date: string | null;
  };
}

export function useInvoices(filters?: { status?: string; type?: string; search?: string }) {
  return useQuery({
    queryKey: ["invoices", filters],
    queryFn: async () => {
      let query = supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      if (filters?.type && filters.type !== "all") {
        query = query.eq("invoice_type", filters.type);
      }

      if (filters?.search) {
        query = query.ilike("invoice_number", `%${filters.search}%`);
      }

      const { data: invoicesData, error } = await query;
      if (error) throw error;

      // Fetch inscription details for each invoice
      const invoicesWithInscriptions = await Promise.all(
        (invoicesData || []).map(async (invoice) => {
          if (!invoice.inscription_id) return invoice;

          const { data: inscription } = await supabase
            .from("inscriptions")
            .select(`
              id,
              code,
              course_location,
              start_date,
              end_date,
              duration_hours,
              language,
              price,
              deposit_amount,
              deposit_date,
              student_id
            `)
            .eq("id", invoice.inscription_id)
            .maybeSingle();

          if (!inscription) return invoice;

          // Fetch student details
          const { data: student } = await supabase
            .from("students")
            .select("first_name, last_name, email, phone, city, company, street_address, postal_code")
            .eq("id", inscription.student_id)
            .maybeSingle();

          return {
            ...invoice,
            inscription: {
              code: inscription.code,
              student_name: student ? `${student.first_name} ${student.last_name}` : null,
              student_email: student?.email || null,
              student_phone: student?.phone || null,
              student_city: student?.city || null,
              student_company: student?.company || null,
              student_address: student?.street_address || null,
              student_postal_code: student?.postal_code || null,
              course_location: inscription.course_location,
              start_date: inscription.start_date,
              end_date: inscription.end_date,
              duration_hours: inscription.duration_hours,
              language: inscription.language,
              price: inscription.price,
              deposit_amount: inscription.deposit_amount,
              deposit_date: inscription.deposit_date,
            },
          } as InvoiceWithInscription;
        })
      );

      return invoicesWithInscriptions as InvoiceWithInscription[];
    },
  });
}

export function useInvoiceWithDetails(invoiceId: string) {
  return useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: async () => {
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", invoiceId)
        .maybeSingle();

      if (invoiceError) throw invoiceError;
      if (!invoice) return null;

      let inscription = null;
      if (invoice.inscription_id) {
        const { data: inscriptionData } = await supabase
          .from("inscriptions_complete")
          .select("*")
          .eq("id", invoice.inscription_id)
          .maybeSingle();
        inscription = inscriptionData;
      }

      return {
        ...invoice,
        inscription,
      } as InvoiceWithInscription;
    },
    enabled: !!invoiceId,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceData: {
      inscription_id?: string;
      invoice_date?: string;
      invoice_type: "formation" | "test" | "soustraitance";
      amount_ht: number;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from("invoices")
        .insert(invoiceData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Invoice> & { id: string }) => {
      const { data, error } = await supabase
        .from("invoices")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useInvoiceStats() {
  return useQuery({
    queryKey: ["invoice-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.from("invoices").select("*");

      if (error) throw error;

      const stats = {
        total: data.length,
        totalRevenue: data.reduce((sum, inv) => sum + (inv.amount_ttc || 0), 0),
        paid: data.filter((inv) => inv.status === "paid").length,
        pending: data.filter((inv) => inv.status === "sent").length,
        draft: data.filter((inv) => inv.status === "draft").length,
        paidAmount: data
          .filter((inv) => inv.status === "paid")
          .reduce((sum, inv) => sum + (inv.amount_ttc || 0), 0),
        pendingAmount: data
          .filter((inv) => inv.status === "sent")
          .reduce((sum, inv) => sum + (inv.amount_ttc || 0), 0),
      };

      return stats;
    },
  });
}
