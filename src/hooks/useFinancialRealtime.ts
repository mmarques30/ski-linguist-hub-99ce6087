import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useFinancialRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('financial-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'invoices' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['financial-kpis'] });
          queryClient.invalidateQueries({ queryKey: ['ca-by-month'] });
          queryClient.invalidateQueries({ queryKey: ['ca-by-type'] });
          queryClient.invalidateQueries({ queryKey: ['pending-invoices'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['financial-kpis'] });
          queryClient.invalidateQueries({ queryKey: ['pending-invoices'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'formation_costs' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['financial-kpis'] });
          queryClient.invalidateQueries({ queryKey: ['instructor-balance'] });
          queryClient.invalidateQueries({ queryKey: ['formation-profitability'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'instructor_payments' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['financial-kpis'] });
          queryClient.invalidateQueries({ queryKey: ['instructor-balance'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fixed_costs' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['fixed-costs'] });
          queryClient.invalidateQueries({ queryKey: ['tresorerie'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
