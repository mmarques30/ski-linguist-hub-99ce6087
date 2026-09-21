import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type {
  FundingProposalStatus,
  ProposalPayerType,
  ProposalPaymentFormula,
} from "@/lib/opco-funding";

export interface FundingProposal {
  id: string;
  inscription_id: string;
  funding_organization: string;
  amount_requested: number | null;
  amount_granted: number | null;
  payment_amount: number | null;
  payment_date: string | null;
  status: string;
  notes: string | null;
  reference_number: string | null;
  convention_number: string | null;
  contact_name: string | null;
  contact_email: string | null;
  payer_type: string | null;
  payment_formula: string | null;
  request_date: string;
  created_at: string;
  updated_at: string;
}

export function useFundingProposals(inscriptionId: string | undefined) {
  return useQuery({
    queryKey: ["funding-proposals", inscriptionId],
    queryFn: async () => {
      if (!inscriptionId) return [];
      const { data, error } = await supabase
        .from("funding_requests")
        .select("*")
        .eq("inscription_id", inscriptionId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as FundingProposal[];
    },
    enabled: !!inscriptionId,
  });
}

export interface FundingProposalInput {
  inscription_id: string;
  funding_organization: string;
  payer_type: ProposalPayerType;
  payment_formula: ProposalPaymentFormula;
  amount_requested?: number | null;
  amount_granted?: number | null;
  payment_amount?: number | null;
  status?: FundingProposalStatus;
  notes?: string | null;
  reference_number?: string | null;
  convention_number?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
}

export function useCreateFundingProposal() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: FundingProposalInput) => {
      const { data, error } = await supabase
        .from("funding_requests")
        .insert({
          inscription_id: input.inscription_id,
          funding_organization: input.funding_organization,
          payer_type: input.payer_type,
          payment_formula: input.payment_formula,
          amount_requested: input.amount_requested ?? null,
          amount_granted: input.amount_granted ?? null,
          payment_amount: input.payment_amount ?? null,
          status: input.status ?? "brouillon",
          notes: input.notes ?? null,
          reference_number: input.reference_number ?? null,
          convention_number: input.convention_number ?? null,
          contact_name: input.contact_name ?? null,
          contact_email: input.contact_email ?? null,
          request_date: new Date().toISOString().slice(0, 10),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["funding-proposals", vars.inscription_id] });
      toast({ title: "Proposition enregistrée", description: "La nouvelle proposition a été créée." });
    },
    onError: (e: Error) =>
      toast({ variant: "destructive", title: "Erreur", description: e.message }),
  });
}

export function useUpdateFundingProposal() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({
      id,
      inscriptionId,
      ...updates
    }: Partial<FundingProposalInput> & { id: string; inscriptionId: string }) => {
      const { error } = await supabase
        .from("funding_requests")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
      return inscriptionId;
    },
    onSuccess: (inscriptionId) => {
      qc.invalidateQueries({ queryKey: ["funding-proposals", inscriptionId] });
      toast({ title: "Proposition mise à jour", description: "Les modifications ont bien été prises en compte." });
    },
    onError: (e: Error) =>
      toast({ variant: "destructive", title: "Erreur", description: e.message }),
  });
}

export function useDeleteFundingProposal() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, inscriptionId }: { id: string; inscriptionId: string }) => {
      const { error } = await supabase.from("funding_requests").delete().eq("id", id);
      if (error) throw error;
      return inscriptionId;
    },
    onSuccess: (inscriptionId) => {
      qc.invalidateQueries({ queryKey: ["funding-proposals", inscriptionId] });
      toast({ title: "Proposition supprimée", description: "La proposition a été retirée." });
    },
    onError: (e: Error) =>
      toast({ variant: "destructive", title: "Erreur", description: e.message }),
  });
}

export function useUpdateInscriptionFunding() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({
      id,
      ...fields
    }: {
      id: string;
      funding_organization?: string | null;
      funding_details?: string | null;
      price?: number | null;
      deposit_amount?: number | null;
      deposit_date?: string | null;
      balance_after_deposit?: number | null;
      payment_method?: string | null;
      observations?: string | null;
    }) => {
      const payload: Record<string, string | number | null> = {};
      for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined) payload[key] = value as string | number | null;
      }
      if (Object.keys(payload).length === 0) return;
      const { error } = await supabase.from("inscriptions").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["inscription", vars.id] });
      qc.invalidateQueries({ queryKey: ["inscription-ops-fields", vars.id] });
      qc.invalidateQueries({ queryKey: ["inscription-funding", vars.id] });
      qc.invalidateQueries({ queryKey: ["inscriptions"] });
      toast({
        title: "Enregistré",
        description: "Les modifications ont bien été prises en compte.",
      });
    },
    onError: (e: Error) =>
      toast({ variant: "destructive", title: "Erreur", description: e.message }),
  });
}
