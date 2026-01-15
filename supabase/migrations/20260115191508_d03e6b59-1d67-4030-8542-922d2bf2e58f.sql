-- Add missing columns to test_phrases
ALTER TABLE test_phrases ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE test_phrases ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create unique index on code (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_phrases_code ON test_phrases(code) WHERE code IS NOT NULL;

-- Add missing columns to test_evaluations for section comments
ALTER TABLE test_evaluations ADD COLUMN IF NOT EXISTS comments_introduction TEXT;
ALTER TABLE test_evaluations ADD COLUMN IF NOT EXISTS comments_comprehension TEXT;
ALTER TABLE test_evaluations ADD COLUMN IF NOT EXISTS comments_expression TEXT;
ALTER TABLE test_evaluations ADD COLUMN IF NOT EXISTS comments_grammar TEXT;
ALTER TABLE test_evaluations ADD COLUMN IF NOT EXISTS comments_technique TEXT;
ALTER TABLE test_evaluations ADD COLUMN IF NOT EXISTS comments_conclusion TEXT;

-- Store selected phrase IDs
ALTER TABLE test_evaluations ADD COLUMN IF NOT EXISTS selected_phrase_ids UUID[] DEFAULT '{}';

-- Update trigger for test_phrases updated_at
CREATE OR REPLACE FUNCTION public.update_test_phrases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_test_phrases_updated_at ON test_phrases;
CREATE TRIGGER trigger_update_test_phrases_updated_at
  BEFORE UPDATE ON test_phrases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_test_phrases_updated_at();