-- Enable realtime for financial tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.formation_costs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.instructor_payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fixed_costs;