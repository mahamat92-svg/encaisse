-- Table des conversations de l'IA Guide (InnovTech MHA Infinity)
-- Ne supprime aucune table existante.

CREATE TABLE IF NOT EXISTS public.ia_guide_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question text NOT NULL,
  reponse text NOT NULL,
  service_concerne text NOT NULL DEFAULT 'Général',
  date timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ia_guide_conversations_user_date
  ON public.ia_guide_conversations (user_id, date DESC);

ALTER TABLE public.ia_guide_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ia_guide_select_own" ON public.ia_guide_conversations;
CREATE POLICY "ia_guide_select_own"
  ON public.ia_guide_conversations
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "ia_guide_insert_own" ON public.ia_guide_conversations;
CREATE POLICY "ia_guide_insert_own"
  ON public.ia_guide_conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
