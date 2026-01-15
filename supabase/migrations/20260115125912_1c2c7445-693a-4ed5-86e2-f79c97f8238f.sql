
-- Add DELETE policies for all tables to allow purging data
CREATE POLICY "Authenticated users can delete payments" ON public.payments FOR DELETE USING (true);
CREATE POLICY "Authenticated users can delete invoices" ON public.invoices FOR DELETE USING (true);
CREATE POLICY "Authenticated users can delete inscriptions" ON public.inscriptions FOR DELETE USING (true);
CREATE POLICY "Authenticated users can delete students" ON public.students FOR DELETE USING (true);
CREATE POLICY "Authenticated users can delete ski_schools" ON public.ski_schools FOR DELETE USING (true);
CREATE POLICY "Authenticated users can delete instructors" ON public.instructors FOR DELETE USING (true);
CREATE POLICY "Authenticated users can delete accommodations" ON public.accommodations FOR DELETE USING (true);
CREATE POLICY "Authenticated users can delete placement_tests" ON public.placement_tests FOR DELETE USING (true);
