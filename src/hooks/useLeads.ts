import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ExpansionChannel = "cpf" | "b2b" | "dsf";

export interface Lead {
  id: string;
  source: string;
  expansion_channel: ExpansionChannel;
  partner_id: string | null;
  contact_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  company: string | null;
  language_interest: string | null;
  estimated_students: number | null;
  estimated_revenue: number | null;
  cpf_amount_available: number | null;
  course_interest: string | null;
  project_name: string | null;
  expected_volume: number | null;
  status: string;
  assigned_to: string | null;
  next_action: string | null;
  next_action_date: string | null;
  loss_reason: string | null;
  notes: string | null;
  inscription_id: string | null;
  season_id: string | null;
  created_at: string;
  updated_at: string;
  partner?: { name: string } | null;
}

export const EXPANSION_CHANNELS = [
  { key: "cpf" as const, label: "CPF", description: "Compte Personnel de Formation" },
  { key: "b2b" as const, label: "B2B Alpespace", description: "Entreprises & écoles de ski" },
  { key: "dsf" as const, label: "DSF", description: "Fédération & projets" },
];

export const LEAD_STATUSES = [
  { key: "nouveau", label: "Nouveau", color: "bg-blue-500" },
  { key: "contacte", label: "Contacté", color: "bg-amber-500" },
  { key: "en_negociation", label: "En négociation", color: "bg-purple-500" },
  { key: "converti", label: "Converti", color: "bg-green-500" },
  { key: "perdu", label: "Perdu", color: "bg-destructive" },
] as const;

export const LEAD_SOURCES = [
  { key: "site_web", label: "Site web" },
  { key: "esf", label: "ESF / Partenaire" },
  { key: "bouche_a_oreille", label: "Bouche à oreille" },
  { key: "salon", label: "Salon / Événement" },
  { key: "autre", label: "Autre" },
] as const;

export function isActionOverdue(nextActionDate: string | null): boolean {
  if (!nextActionDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(nextActionDate) < today;
}

export function useLeads(filters?: {
  status?: string;
  source?: string;
  search?: string;
  expansion_channel?: ExpansionChannel;
}) {
  return useQuery({
    queryKey: ["leads", filters],
    queryFn: async () => {
      let query = supabase
        .from("leads")
        .select("*, partner:partner_id(name)")
        .order("created_at", { ascending: false });

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }
      if (filters?.source && filters.source !== "all") {
        query = query.eq("source", filters.source);
      }
      if (filters?.expansion_channel) {
        query = query.eq("expansion_channel", filters.expansion_channel);
      }
      if (filters?.search) {
        query = query.or(
          `contact_name.ilike.%${filters.search}%,company.ilike.%${filters.search}%,contact_email.ilike.%${filters.search}%,project_name.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Lead[];
    },
  });
}

export function useLeadKPIs(channel?: ExpansionChannel) {
  return useQuery({
    queryKey: ["lead-kpis", channel],
    queryFn: async () => {
      let query = supabase
        .from("leads")
        .select("status, estimated_revenue, source, expansion_channel, created_at, updated_at, next_action_date");

      if (channel) {
        query = query.eq("expansion_channel", channel);
      }

      const { data: leads, error } = await query;
      if (error) throw error;

      const all = leads || [];
      const total = all.length;
      const converted = all.filter((l) => l.status === "converti");
      const lost = all.filter((l) => l.status === "perdu");
      const conversionRate =
        total > 0 ? (converted.length / (converted.length + lost.length || 1)) * 100 : 0;

      const pipelineByStatus: Record<string, number> = {};
      for (const l of all) {
        pipelineByStatus[l.status] =
          (pipelineByStatus[l.status] || 0) + Number(l.estimated_revenue || 0);
      }

      const conversionTimes = converted.map((l) => {
        const created = new Date(l.created_at).getTime();
        const updated = new Date(l.updated_at).getTime();
        return (updated - created) / (1000 * 60 * 60 * 24);
      });
      const avgConversionDays =
        conversionTimes.length > 0
          ? conversionTimes.reduce((a, b) => a + b, 0) / conversionTimes.length
          : 0;

      const byChannel: Record<string, number> = {};
      const sourceCount: Record<string, number> = {};
      for (const l of all) {
        const ch = l.expansion_channel || "cpf";
        byChannel[ch] = (byChannel[ch] || 0) + 1;
        sourceCount[l.source] = (sourceCount[l.source] || 0) + 1;
      }

      const overdueActions = all.filter(
        (l) =>
          !["converti", "perdu"].includes(l.status) && isActionOverdue(l.next_action_date)
      ).length;

      return {
        total,
        convertedCount: converted.length,
        lostCount: lost.length,
        conversionRate,
        pipelineByStatus,
        avgConversionDays,
        byChannel,
        sourceCount,
        overdueActions,
        totalPipelineRevenue: all
          .filter((l) => !["converti", "perdu"].includes(l.status))
          .reduce((s, l) => s + Number(l.estimated_revenue || 0), 0),
      };
    },
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (lead: Partial<Lead> & { contact_name: string }) => {
      const { data, error } = await supabase.from("leads").insert(lead).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead-kpis"] });
    },
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Lead> & { id: string }) => {
      const { data, error } = await supabase.from("leads").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead-kpis"] });
    },
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead-kpis"] });
    },
  });
}

const LANGUAGE_MAP: Record<string, string> = {
  francais: "Français",
  anglais: "Anglais",
  espagnol: "Espagnol",
  portugais: "Portugais",
  italien: "Italien",
  allemand: "Allemand",
};

export function useConvertLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (lead: Lead) => {
      if (!lead.contact_email) {
        throw new Error("Email requis pour convertir le lead en inscription");
      }

      const email = lead.contact_email.trim().toLowerCase();
      const nameParts = lead.contact_name.trim().split(/\s+/);
      const firstName = nameParts[0] || lead.contact_name;
      const lastName = nameParts.slice(1).join(" ") || "—";

      let studentId: string;
      const { data: existing } = await supabase
        .from("students")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (existing) {
        studentId = existing.id;
      } else {
        const { data: newStudent, error: studentError } = await supabase
          .from("students")
          .insert({
            first_name: firstName,
            last_name: lastName,
            email,
            phone: lead.contact_phone,
            company: lead.company,
          })
          .select("id")
          .single();
        if (studentError) throw studentError;
        studentId = newStudent.id;
      }

      const { data: season } = await supabase
        .from("seasons")
        .select("id, start_date, end_date")
        .eq("is_current", true)
        .maybeSingle();

      const { data: code, error: codeError } = await supabase.rpc("generate_inscription_code");
      if (codeError) throw codeError;

      const language = LANGUAGE_MAP[lead.language_interest || ""] || "Anglais";
      const startDate = season?.start_date || new Date().toISOString().split("T")[0];
      const endDate = season?.end_date || startDate;

      const { data: inscription, error: inscError } = await supabase
        .from("inscriptions")
        .insert({
          code,
          student_id: studentId,
          language,
          start_date: startDate,
          end_date: endDate,
          price: lead.estimated_revenue,
          season_id: season?.id || lead.season_id,
          partner_id: lead.partner_id,
          status: "brouillon",
          observations: [
            `Converti depuis lead ${lead.expansion_channel.toUpperCase()}`,
            lead.project_name ? `Projet: ${lead.project_name}` : null,
            lead.course_interest ? `Formation: ${lead.course_interest}` : null,
          ]
            .filter(Boolean)
            .join("\n"),
        })
        .select("id, code")
        .single();

      if (inscError) throw inscError;

      const { error: leadError } = await supabase
        .from("leads")
        .update({
          status: "converti",
          inscription_id: inscription.id,
        })
        .eq("id", lead.id);

      if (leadError) throw leadError;

      return { inscriptionId: inscription.id, inscriptionCode: inscription.code };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead-kpis"] });
      qc.invalidateQueries({ queryKey: ["inscriptions"] });
    },
  });
}
