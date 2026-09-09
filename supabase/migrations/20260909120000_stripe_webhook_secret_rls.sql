-- Restrict stripe webhook secret to admins only (edge functions use service role).
DROP POLICY IF EXISTS "Staff can view app_settings" ON public.app_settings;

CREATE POLICY "Staff can view app_settings" ON public.app_settings
  FOR SELECT TO authenticated
  USING (key <> 'stripe_webhook_secret' OR public.is_admin());
