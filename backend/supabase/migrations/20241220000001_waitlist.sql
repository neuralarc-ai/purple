-- Create waitlist table
CREATE TABLE IF NOT EXISTS public.waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    notified_at TIMESTAMPTZ,
    is_notified BOOLEAN DEFAULT FALSE,
    
    CONSTRAINT waitlist_full_name_not_empty CHECK (LENGTH(TRIM(full_name)) > 0),
    CONSTRAINT waitlist_email_not_empty CHECK (LENGTH(TRIM(email)) > 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_joined_at ON waitlist(joined_at);
CREATE INDEX IF NOT EXISTS idx_waitlist_is_notified ON waitlist(is_notified);

-- Enable RLS
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can insert into waitlist" ON waitlist
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Only admins can read waitlist" ON waitlist
    FOR SELECT USING (auth.role() = 'admin');

CREATE POLICY "Only admins can update waitlist" ON waitlist
    FOR UPDATE USING (auth.role() = 'admin');
