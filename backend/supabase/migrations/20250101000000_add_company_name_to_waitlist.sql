BEGIN;

-- Add company_name column to waitlist table
ALTER TABLE public.waitlist 
ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);

-- Add comment for documentation
COMMENT ON COLUMN public.waitlist.company_name IS 'Optional company name for waitlist entries';

COMMIT;

