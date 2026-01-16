import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Types
export interface FormationCost {
  id: string;
  created_at: string;
  updated_at: string;
  inscription_id: string | null;
  cost_type: 'formateur' | 'hebergement' | 'deplacement' | 'salle' | 'materiel' | 'restauration' | 'autre';
  montant_ht: number;
  montant_tva: number;
  montant_ttc: number;
  instructor_id: string | null;
  description: string | null;
  date_cout: string | null;
  document_url: string | null;
}

export interface InstructorPayment {
  id: string;
  created_at: string;
  updated_at: string;
  instructor_id: string;
  montant: number;
  periode_debut: string;
  periode_fin: string;
  date_paiement: string | null;
  moyen_paiement: 'virement' | 'cheque' | 'especes' | null;
  reference_paiement: string | null;
  statut: 'a_payer' | 'paye';
  notes: string | null;
  instructor?: {
    first_name: string | null;
    last_name: string;
    email: string | null;
  };
}

export interface FixedCost {
  id: string;
  created_at: string;
  mois: string;
  cost_type: string;
  montant: number;
  description: string | null;
  recurrent: boolean;
  paye: boolean;
  date_paiement: string | null;
}

export interface CostTemplate {
  id: string;
  created_at: string;
  cost_type: string;
  montant_mensuel: number;
  description: string | null;
  actif: boolean;
}

// Saison helpers
export function getSaison(date: Date): string {
  const mois = date.getMonth();
  const annee = date.getFullYear();
  
  if (mois >= 6) {
    return `${annee}-${annee + 1}`;
  } else {
    return `${annee - 1}-${annee}`;
  }
}

export function getDebutSaison(saison: string): Date {
  const anneeDebut = parseInt(saison.split('-')[0]);
  return new Date(anneeDebut, 6, 1);
}

export function getFinSaison(saison: string): Date {
  const anneeFin = parseInt(saison.split('-')[1]);
  return new Date(anneeFin, 5, 30);
}

export function getCurrentSaison(): string {
  return getSaison(new Date());
}

// Hooks
export function useFinancialKPIs(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['financial-kpis', startDate, endDate],
    queryFn: async () => {
      // CA Facturé
      const { data: invoices } = await supabase
        .from('invoices')
        .select('amount_ht, amount_ttc, status, invoice_type')
        .gte('invoice_date', startDate)
        .lte('invoice_date', endDate)
        .neq('status', 'cancelled');
      
      const caFacture = invoices?.reduce((sum, inv) => sum + Number(inv.amount_ht || 0), 0) || 0;
      const caTTC = invoices?.reduce((sum, inv) => sum + Number(inv.amount_ttc || inv.amount_ht || 0), 0) || 0;
      
      // Encaissé (factures payées)
      const { data: paidInvoices } = await supabase
        .from('invoices')
        .select('amount_ttc, amount_ht')
        .eq('status', 'paid')
        .gte('payment_date', startDate)
        .lte('payment_date', endDate);
      
      const encaisse = paidInvoices?.reduce((sum, inv) => sum + Number(inv.amount_ttc || inv.amount_ht || 0), 0) || 0;
      
      // En attente
      const enAttente = caTTC - encaisse;
      
      // À payer formateurs
      const { data: instructorCosts } = await supabase
        .from('formation_costs')
        .select('montant_ttc, instructor_id')
        .eq('cost_type', 'formateur')
        .gte('date_cout', startDate)
        .lte('date_cout', endDate);
      
      const { data: instructorPayments } = await supabase
        .from('instructor_payments')
        .select('montant')
        .eq('statut', 'paye')
        .gte('date_paiement', startDate)
        .lte('date_paiement', endDate);
      
      const totalDuFormateurs = instructorCosts?.reduce((sum, c) => sum + Number(c.montant_ttc || 0), 0) || 0;
      const totalPayeFormateurs = instructorPayments?.reduce((sum, p) => sum + Number(p.montant || 0), 0) || 0;
      const aPayerFormateurs = totalDuFormateurs - totalPayeFormateurs;
      
      // Coûts directs
      const { data: allCosts } = await supabase
        .from('formation_costs')
        .select('montant_ht')
        .gte('date_cout', startDate)
        .lte('date_cout', endDate);
      
      const coutsDirects = allCosts?.reduce((sum, c) => sum + Number(c.montant_ht || 0), 0) || 0;
      
      // Marge brute
      const margeBrute = caFacture - coutsDirects;
      const margePourcent = caFacture > 0 ? (margeBrute / caFacture) * 100 : 0;
      
      // Formateurs concernés
      const formateursConcernes = new Set(instructorCosts?.filter(c => c.instructor_id).map(c => c.instructor_id)).size;
      
      return {
        caFacture,
        caTTC,
        encaisse,
        enAttente,
        aPayerFormateurs,
        margeBrute,
        margePourcent,
        formateursConcernes,
        nbFactures: invoices?.length || 0,
      };
    },
  });
}

export function useCAByMonth(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['ca-by-month', startDate, endDate],
    queryFn: async () => {
      const { data: invoices } = await supabase
        .from('invoices')
        .select('invoice_date, amount_ht, invoice_type')
        .gte('invoice_date', startDate)
        .lte('invoice_date', endDate)
        .neq('status', 'cancelled');
      
      // Group by month
      const byMonth = new Map<string, { month: string; total: number; byType: Record<string, number> }>();
      
      invoices?.forEach(inv => {
        const month = inv.invoice_date.substring(0, 7);
        if (!byMonth.has(month)) {
          byMonth.set(month, { month, total: 0, byType: {} });
        }
        const entry = byMonth.get(month)!;
        entry.total += Number(inv.amount_ht || 0);
        entry.byType[inv.invoice_type] = (entry.byType[inv.invoice_type] || 0) + Number(inv.amount_ht || 0);
      });
      
      return Array.from(byMonth.values()).sort((a, b) => a.month.localeCompare(b.month));
    },
  });
}

export function useCAByType(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['ca-by-type', startDate, endDate],
    queryFn: async () => {
      const { data: invoices } = await supabase
        .from('invoices')
        .select('invoice_type, amount_ht')
        .gte('invoice_date', startDate)
        .lte('invoice_date', endDate)
        .neq('status', 'cancelled');
      
      const byType = new Map<string, number>();
      invoices?.forEach(inv => {
        byType.set(inv.invoice_type, (byType.get(inv.invoice_type) || 0) + Number(inv.amount_ht || 0));
      });
      
      const typeLabels: Record<string, string> = {
        'formation': 'Formations',
        'test': 'Tests',
        'soustraitance': 'Sous-traitance',
      };
      
      return Array.from(byType.entries()).map(([type, value]) => ({
        name: typeLabels[type] || type,
        value,
        type,
      }));
    },
  });
}

export function usePendingInvoices() {
  return useQuery({
    queryKey: ['pending-invoices'],
    queryFn: async () => {
      const { data } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          invoice_date,
          due_date,
          amount_ttc,
          amount_ht,
          status,
          inscription:inscription_id (
            id,
            student:student_id (
              first_name,
              last_name,
              company
            )
          )
        `)
        .in('status', ['draft', 'sent'])
        .order('invoice_date', { ascending: true });
      
      return data?.map(inv => ({
        ...inv,
        client_name: inv.inscription?.student?.company || 
          `${inv.inscription?.student?.first_name || ''} ${inv.inscription?.student?.last_name || ''}`.trim() ||
          'Client inconnu',
        days_overdue: inv.due_date ? Math.floor((Date.now() - new Date(inv.due_date).getTime()) / (1000 * 60 * 60 * 24)) : 0,
      })) || [];
    },
  });
}

export function useInstructorBalance() {
  return useQuery({
    queryKey: ['instructor-balance'],
    queryFn: async () => {
      // Get all instructors
      const { data: instructors } = await supabase
        .from('instructors')
        .select('id, first_name, last_name, email')
        .eq('is_active', true);
      
      // Get costs by instructor
      const { data: costs } = await supabase
        .from('formation_costs')
        .select('instructor_id, montant_ttc')
        .eq('cost_type', 'formateur');
      
      // Get payments by instructor
      const { data: payments } = await supabase
        .from('instructor_payments')
        .select('instructor_id, montant')
        .eq('statut', 'paye');
      
      // Calculate balance
      const costsByInstructor = new Map<string, number>();
      costs?.forEach(c => {
        if (c.instructor_id) {
          costsByInstructor.set(c.instructor_id, (costsByInstructor.get(c.instructor_id) || 0) + Number(c.montant_ttc || 0));
        }
      });
      
      const paymentsByInstructor = new Map<string, number>();
      payments?.forEach(p => {
        paymentsByInstructor.set(p.instructor_id, (paymentsByInstructor.get(p.instructor_id) || 0) + Number(p.montant || 0));
      });
      
      return instructors?.map(inst => ({
        ...inst,
        total_du: costsByInstructor.get(inst.id) || 0,
        total_paye: paymentsByInstructor.get(inst.id) || 0,
        a_payer: (costsByInstructor.get(inst.id) || 0) - (paymentsByInstructor.get(inst.id) || 0),
      })).filter(inst => inst.a_payer > 0).sort((a, b) => b.a_payer - a.a_payer) || [];
    },
  });
}

export function useCostTemplates() {
  return useQuery({
    queryKey: ['cost-templates'],
    queryFn: async () => {
      const { data } = await supabase
        .from('cost_templates')
        .select('*')
        .order('cost_type');
      return data as CostTemplate[] || [];
    },
  });
}

export function useFixedCosts(mois?: string) {
  return useQuery({
    queryKey: ['fixed-costs', mois],
    queryFn: async () => {
      let query = supabase.from('fixed_costs').select('*');
      if (mois) {
        query = query.eq('mois', mois);
      }
      const { data } = await query.order('mois', { ascending: false });
      return data as FixedCost[] || [];
    },
  });
}

export function useFormationProfitability(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['formation-profitability', startDate, endDate],
    queryFn: async () => {
      // Get inscriptions with their details
      let inscQuery = supabase
        .from('inscriptions_complete')
        .select('*');
      
      if (startDate) inscQuery = inscQuery.gte('start_date', startDate);
      if (endDate) inscQuery = inscQuery.lte('end_date', endDate);
      
      const { data: inscriptions } = await inscQuery;
      
      // Get invoices for these inscriptions
      const inscriptionIds = inscriptions?.map(i => i.id).filter(Boolean) as string[] || [];
      
      const { data: invoices } = await supabase
        .from('invoices')
        .select('inscription_id, amount_ht')
        .in('inscription_id', inscriptionIds.length > 0 ? inscriptionIds : ['no-match']);
      
      // Get costs for these inscriptions
      const { data: costs } = await supabase
        .from('formation_costs')
        .select('*')
        .in('inscription_id', inscriptionIds.length > 0 ? inscriptionIds : ['no-match']);
      
      // Build profitability data
      const invoicesByInsc = new Map<string, number>();
      invoices?.forEach(inv => {
        if (inv.inscription_id) {
          invoicesByInsc.set(inv.inscription_id, (invoicesByInsc.get(inv.inscription_id) || 0) + Number(inv.amount_ht || 0));
        }
      });
      
      const costsByInsc = new Map<string, { total: number; byType: Record<string, number> }>();
      costs?.forEach(cost => {
        if (cost.inscription_id) {
          if (!costsByInsc.has(cost.inscription_id)) {
            costsByInsc.set(cost.inscription_id, { total: 0, byType: {} });
          }
          const entry = costsByInsc.get(cost.inscription_id)!;
          entry.total += Number(cost.montant_ht || 0);
          entry.byType[cost.cost_type] = (entry.byType[cost.cost_type] || 0) + Number(cost.montant_ht || 0);
        }
      });
      
      return inscriptions?.map(insc => {
        const ca = invoicesByInsc.get(insc.id!) || 0;
        const costsData = costsByInsc.get(insc.id!) || { total: 0, byType: {} };
        const marge = ca - costsData.total;
        const margePourcent = ca > 0 ? (marge / ca) * 100 : 0;
        
        return {
          id: insc.id,
          code: insc.code,
          student_name: insc.student_name,
          language: insc.language,
          start_date: insc.start_date,
          end_date: insc.end_date,
          ca_ht: ca,
          couts_totaux: costsData.total,
          cout_formateur: costsData.byType['formateur'] || 0,
          cout_hebergement: costsData.byType['hebergement'] || 0,
          cout_deplacement: costsData.byType['deplacement'] || 0,
          cout_salle: costsData.byType['salle'] || 0,
          cout_autres: costsData.total - (costsData.byType['formateur'] || 0) - (costsData.byType['hebergement'] || 0) - (costsData.byType['deplacement'] || 0) - (costsData.byType['salle'] || 0),
          marge_brute: marge,
          marge_pourcent: margePourcent,
        };
      }).filter(f => f.ca_ht > 0 || f.couts_totaux > 0).sort((a, b) => (b.start_date || '').localeCompare(a.start_date || '')) || [];
    },
  });
}

export function useCreateFormationCost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (cost: Omit<FormationCost, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('formation_costs').insert(cost).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formation-profitability'] });
      queryClient.invalidateQueries({ queryKey: ['financial-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['instructor-balance'] });
    },
  });
}

export function useCreateInstructorPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payment: Omit<InstructorPayment, 'id' | 'created_at' | 'updated_at' | 'instructor'>) => {
      const { data, error } = await supabase.from('instructor_payments').insert(payment).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-balance'] });
      queryClient.invalidateQueries({ queryKey: ['financial-kpis'] });
    },
  });
}

export function useUpdateCostTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CostTemplate> & { id: string }) => {
      const { data, error } = await supabase.from('cost_templates').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-templates'] });
    },
  });
}

export function useGenerateMonthlyCharges() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mois: string) => {
      // Get active templates
      const { data: templates } = await supabase
        .from('cost_templates')
        .select('*')
        .eq('actif', true);
      
      if (!templates?.length) return [];
      
      // Insert or update fixed costs for the month
      const costs = templates.map(t => ({
        mois,
        cost_type: t.cost_type,
        montant: t.montant_mensuel,
        description: t.description,
        recurrent: true,
        paye: false,
      }));
      
      const { data, error } = await supabase
        .from('fixed_costs')
        .upsert(costs, { onConflict: 'mois,cost_type' })
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixed-costs'] });
    },
  });
}

export function useUpdateFixedCost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FixedCost> & { id: string }) => {
      const { data, error } = await supabase.from('fixed_costs').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixed-costs'] });
    },
  });
}

export function useTresoreriePrevisionnelle(moisCount: number = 6) {
  return useQuery({
    queryKey: ['tresorerie-previsionnelle', moisCount],
    queryFn: async () => {
      const today = new Date();
      const months = [];
      
      for (let i = 0; i < moisCount; i++) {
        const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
        const moisStr = d.toISOString().substring(0, 10);
        const moisLabel = d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
        const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
        const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
        
        months.push({ mois: moisStr, moisLabel, startOfMonth, endOfMonth });
      }
      
      // Get pending invoices (expected income)
      const { data: pendingInvoices } = await supabase
        .from('invoices')
        .select('amount_ttc, amount_ht, due_date')
        .in('status', ['draft', 'sent']);
      
      // Get planned inscriptions (future income)
      const { data: plannedInscriptions } = await supabase
        .from('inscriptions')
        .select('price, start_date')
        .gte('start_date', months[0].startOfMonth);
      
      // Get fixed costs
      const { data: fixedCosts } = await supabase
        .from('fixed_costs')
        .select('*')
        .gte('mois', months[0].mois);
      
      // Get unpaid instructor amounts
      const { data: unpaidInstructors } = await supabase
        .from('instructor_payments')
        .select('montant, periode_fin')
        .eq('statut', 'a_payer');
      
      // Calculate per month
      return months.map(m => {
        // Factures à encaisser (dues this month)
        const facturesAEncaisser = pendingInvoices?.filter(inv => 
          inv.due_date && inv.due_date >= m.startOfMonth && inv.due_date <= m.endOfMonth
        ).reduce((sum, inv) => sum + Number(inv.amount_ttc || inv.amount_ht || 0), 0) || 0;
        
        // Formations planifiées (starting this month)
        const formationsPlanifiees = plannedInscriptions?.filter(ins =>
          ins.start_date && ins.start_date >= m.startOfMonth && ins.start_date <= m.endOfMonth
        ).reduce((sum, ins) => sum + Number(ins.price || 0), 0) || 0;
        
        // Charges fixes
        const chargesFixes = fixedCosts?.filter(fc => fc.mois.startsWith(m.mois.substring(0, 7)) && !fc.paye)
          .reduce((sum, fc) => sum + Number(fc.montant || 0), 0) || 0;
        
        // Formateurs à payer
        const formateursAPayer = unpaidInstructors?.filter(p =>
          p.periode_fin && p.periode_fin <= m.endOfMonth
        ).reduce((sum, p) => sum + Number(p.montant || 0), 0) || 0;
        
        return {
          mois: m.mois,
          moisLabel: m.moisLabel,
          entrees: facturesAEncaisser + formationsPlanifiees,
          facturesAEncaisser,
          formationsPlanifiees,
          sorties: chargesFixes + formateursAPayer,
          chargesFixes,
          formateursAPayer,
          solde: facturesAEncaisser + formationsPlanifiees - chargesFixes - formateursAPayer,
        };
      });
    },
  });
}
