-- Run this in your Supabase SQL Editor to create the tables and insert sample invite codes

-- Create invite_codes table
CREATE TABLE IF NOT EXISTS public.invite_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    max_uses INTEGER DEFAULT 1,
    current_uses INTEGER DEFAULT 0,
    
    CONSTRAINT invite_codes_code_not_empty CHECK (LENGTH(TRIM(code)) > 0),
    CONSTRAINT invite_codes_max_uses_positive CHECK (max_uses > 0),
    CONSTRAINT invite_codes_current_uses_valid CHECK (current_uses >= 0 AND current_uses <= max_uses)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_is_used ON invite_codes(is_used);
CREATE INDEX IF NOT EXISTS idx_invite_codes_expires_at ON invite_codes(expires_at);

-- Enable RLS
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can read invite codes" ON invite_codes
    FOR SELECT USING (true);

CREATE POLICY "Only admins can insert invite codes" ON invite_codes
    FOR INSERT WITH CHECK (auth.role() = 'admin');

CREATE POLICY "Only admins can update invite codes" ON invite_codes
    FOR UPDATE USING (auth.role() = 'admin');

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

-- Insert sample invite codes (1 week expiration, max 1 use each)
INSERT INTO invite_codes (code, max_uses, expires_at) VALUES
('HELIUM2024', 1, NOW() + INTERVAL '7 days'),
('EARLYBIRD', 1, NOW() + INTERVAL '7 days'),
('BETAACCESS', 1, NOW() + INTERVAL '7 days'),
('FOUNDER', 1, NOW() + INTERVAL '7 days'),
('PIONEER', 1, NOW() + INTERVAL '7 days'),
('INNOVATOR', 1, NOW() + INTERVAL '7 days'),
('TRAILBLAZER', 1, NOW() + INTERVAL '7 days'),
('VISIONARY', 1, NOW() + INTERVAL '7 days'),
('FUTURE', 1, NOW() + INTERVAL '7 days'),
('NEXTGEN', 1, NOW() + INTERVAL '7 days')
ON CONFLICT (code) DO NOTHING;
