-- Table d'historique des paiements Fapshi Direct Pay (InnovTech MHA Infinity)
-- Ne supprime aucune table existante.

CREATE TABLE IF NOT EXISTS public.fapshi_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  nom text NOT NULL,
  phone text NOT NULL,
  montant integer NOT NULL,
  methode text NOT NULL,
  plan_id text NOT NULL DEFAULT 'pro',
  trans_id text,
  external_id text NOT NULL,
  statut text NOT NULL DEFAULT 'En attente',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fapshi_payments_user_date
  ON public.fapshi_payments (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_fapshi_payments_trans_id
  ON public.fapshi_payments (trans_id);

ALTER TABLE public.fapshi_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fapshi_payments_select_own" ON public.fapshi_payments;
CREATE POLICY "fapshi_payments_select_own"
  ON public.fapshi_payments
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "fapshi_payments_insert_own" ON public.fapshi_payments;
CREATE POLICY "fapshi_payments_insert_own"
  ON public.fapshi_payments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "fapshi_payments_update_own" ON public.fapshi_payments;
CREATE POLICY "fapshi_payments_update_own"
  ON public.fapshi_payments
  FOR UPDATE
  USING (auth.uid() = user_id);
