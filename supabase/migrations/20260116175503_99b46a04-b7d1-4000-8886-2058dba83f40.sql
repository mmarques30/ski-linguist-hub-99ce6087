-- Add client_type column to invoices table
ALTER TABLE public.invoices 
ADD COLUMN client_type text NOT NULL DEFAULT 'stagiaire';

-- Add comment for documentation
COMMENT ON COLUMN public.invoices.client_type IS 'Type of client: stagiaire, ecole_ski, dsf, autre';