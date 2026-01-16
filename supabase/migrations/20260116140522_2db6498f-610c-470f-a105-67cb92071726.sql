-- Add reminder tracking columns to satisfaction_surveys if not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'satisfaction_surveys' 
    AND column_name = 'reminder_1_sent_at'
  ) THEN
    ALTER TABLE public.satisfaction_surveys 
    ADD COLUMN reminder_1_sent_at TIMESTAMP WITH TIME ZONE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'satisfaction_surveys' 
    AND column_name = 'reminder_2_sent_at'
  ) THEN
    ALTER TABLE public.satisfaction_surveys 
    ADD COLUMN reminder_2_sent_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Create index for faster reminder queries
CREATE INDEX IF NOT EXISTS idx_satisfaction_surveys_reminders 
ON public.satisfaction_surveys (completed_at, reminder_1_sent_at, reminder_2_sent_at, created_at)
WHERE completed_at IS NULL;