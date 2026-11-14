-- Colonnes de debug Fapshi + accès Super-Admin sur fapshi_payments
-- Ne supprime aucune table existante.

ALTER TABLE public.fapshi_payments
  ADD COLUMN IF NOT EXISTS fapshi_status text NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS fapshi_error text,
  ADD COLUMN IF NOT EXISTS operator text,
  ADD COLUMN IF NOT EXISTS phone_sent text;

DROP POLICY IF EXISTS "fapshi_payments_admin_select" ON public.fapshi_payments;
CREATE POLICY "fapshi_payments_admin_select"
  ON public.fapshi_payments
  FOR SELECT
  USING (public.is_platform_admin());

DROP POLICY IF EXISTS "fapshi_payments_admin_update" ON public.fapshi_payments;
CREATE POLICY "fapshi_payments_admin_update"
  ON public.fapshi_payments
  FOR UPDATE
  USING (public.is_platform_admin());
