import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// ─── Types ───────────────────────────────────────────────
export interface Partner {
  id: string;
  name: string;
  type: string;
  esf_code?: string | null;
  station: string | null;
  address: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PartnerContract {
  id: string;
  partner_id: string;
  contract_type: string;
  negotiated_rate: number | null;
  volume_commitment: string | null;
  payment_terms: string | null;
  signed_date: string | null;
  document_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PartnerContact {
  id: string;
  partner_id: string;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  is_primary: boolean;
  created_at: string;
}

// ─── Partners ────────────────────────────────────────────
export function usePartners(filters?: { type?: string; status?: string; search?: string }) {
  return useQuery({
    queryKey: ["partners", filters],
    queryFn: async () => {
      let q = supabase.from("partners").select("*").order("name");
      if (filters?.type) q = q.eq("type", filters.type);
      if (filters?.status) q = q.eq("status", filters.status);
      if (filters?.search) q = q.ilike("name", `%${filters.search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data as Partner[];
    },
  });
}

export function usePartnerDetails(id: string | undefined) {
  return useQuery({
    queryKey: ["partner", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from("partners").select("*").eq("id", id).single();
      if (error) throw error;
      return data as Partner;
    },
    enabled: !!id,
  });
}

export function useCreatePartner() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (partner: Partial<Partner>) => {
      const { data, error } = await supabase.from("partners").insert(partner as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partners"] });
      toast({ title: "Partenaire créé" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Erreur", description: e.message }),
  });
}

export function useUpdatePartner() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Partner> & { id: string }) => {
      const { error } = await supabase.from("partners").update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partners"] });
      qc.invalidateQueries({ queryKey: ["partner"] });
      toast({ title: "Partenaire mis à jour" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Erreur", description: e.message }),
  });
}

export function useDeletePartner() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("partners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partners"] });
      toast({ title: "Partenaire supprimé" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Erreur", description: e.message }),
  });
}

// ─── Partner Contracts ───────────────────────────────────
export function usePartnerContracts(partnerId: string | undefined) {
  return useQuery({
    queryKey: ["partner-contracts", partnerId],
    queryFn: async () => {
      if (!partnerId) return [];
      const { data, error } = await supabase
        .from("partner_contracts")
        .select("*")
        .eq("partner_id", partnerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PartnerContract[];
    },
    enabled: !!partnerId,
  });
}

export function useCreatePartnerContract() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (contract: Partial<PartnerContract>) => {
      const { data, error } = await supabase.from("partner_contracts").insert(contract as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partner-contracts"] });
      toast({ title: "Contrat ajouté" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Erreur", description: e.message }),
  });
}

export function useDeletePartnerContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("partner_contracts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["partner-contracts"] }),
  });
}

// ─── Partner Contacts ────────────────────────────────────
export function usePartnerContacts(partnerId: string | undefined) {
  return useQuery({
    queryKey: ["partner-contacts", partnerId],
    queryFn: async () => {
      if (!partnerId) return [];
      const { data, error } = await supabase
        .from("partner_contacts")
        .select("*")
        .eq("partner_id", partnerId)
        .order("is_primary", { ascending: false });
      if (error) throw error;
      return data as PartnerContact[];
    },
    enabled: !!partnerId,
  });
}

export function useCreatePartnerContact() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (contact: Partial<PartnerContact>) => {
      const { data, error } = await supabase.from("partner_contacts").insert(contact as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partner-contacts"] });
      toast({ title: "Contact ajouté" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Erreur", description: e.message }),
  });
}

export function useDeletePartnerContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("partner_contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["partner-contacts"] }),
  });
}

// ─── Partner Inscriptions & Stats ────────────────────────
export function usePartnerInscriptions(partnerId: string | undefined) {
  return useQuery({
    queryKey: ["partner-inscriptions", partnerId],
    queryFn: async () => {
      if (!partnerId) return [];
      const { data, error } = await supabase
        .from("inscriptions")
        .select("*, students(first_name, last_name, email)")
        .eq("partner_id", partnerId)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!partnerId,
  });
}

export function usePartnerInvoices(partnerId: string | undefined) {
  return useQuery({
    queryKey: ["partner-invoices", partnerId],
    queryFn: async () => {
      if (!partnerId) return [];
      // Get inscription IDs for this partner, then find invoices
      const { data: inscriptions, error: iErr } = await supabase
        .from("inscriptions")
        .select("id")
        .eq("partner_id", partnerId);
      if (iErr) throw iErr;
      if (!inscriptions?.length) return [];
      const ids = inscriptions.map((i) => i.id);
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .in("inscription_id", ids)
        .order("invoice_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!partnerId,
  });
}

export function usePartnerStats() {
  return useQuery({
    queryKey: ["partner-stats"],
    queryFn: async () => {
      const { data: partners, error: pErr } = await supabase.from("partners").select("id, name, status");
      if (pErr) throw pErr;
      const activePartners = partners?.filter((p) => p.status === "actif").length || 0;
      const { count: totalInscriptions } = await supabase
        .from("inscriptions")
        .select("id", { count: "exact", head: true })
        .not("partner_id", "is", null);
      return {
        totalPartners: partners?.length || 0,
        activePartners,
        totalInscriptions: totalInscriptions || 0,
      };
    },
  });
}
