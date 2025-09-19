BEGIN;

-- Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES basejump.accounts(id) ON DELETE CASCADE,
    issue_type VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    shared_link TEXT,
    email VARCHAR(255) NOT NULL,
    screenshot_path TEXT,
    screenshot_url TEXT,
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT feedback_tickets_issue_type_check CHECK (LENGTH(TRIM(issue_type)) > 0),
    CONSTRAINT feedback_tickets_description_check CHECK (LENGTH(TRIM(description)) > 0),
    CONSTRAINT feedback_tickets_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Enable RLS
ALTER TABLE public.feedback_tickets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own feedback tickets" ON public.feedback_tickets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create feedback tickets" ON public.feedback_tickets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback tickets" ON public.feedback_tickets
    FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_feedback_tickets_user_id ON public.feedback_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_tickets_account_id ON public.feedback_tickets(account_id);
CREATE INDEX IF NOT EXISTS idx_feedback_tickets_status ON public.feedback_tickets(status);
CREATE INDEX IF NOT EXISTS idx_feedback_tickets_created_at ON public.feedback_tickets(created_at);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_feedback_tickets_updated_at ON public.feedback_tickets;
CREATE TRIGGER update_feedback_tickets_updated_at
    BEFORE UPDATE ON public.feedback_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create feedback-screenshots storage bucket
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES (
    'feedback-screenshots',
    'feedback-screenshots', 
    true,
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']::text[],
    10485760 -- 10MB limit
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for feedback screenshots
DROP POLICY IF EXISTS "Users can upload feedback screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can view feedback screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete feedback screenshots" ON storage.objects;

CREATE POLICY "Users can upload feedback screenshots" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'feedback-screenshots' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can view feedback screenshots" ON storage.objects
FOR SELECT USING (
    bucket_id = 'feedback-screenshots' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete feedback screenshots" ON storage.objects
FOR DELETE USING (
    bucket_id = 'feedback-screenshots' 
    AND auth.role() = 'authenticated'
);

COMMIT;
