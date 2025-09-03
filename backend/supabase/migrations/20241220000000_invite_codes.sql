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

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_invite_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.used_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_invite_codes_used_at ON invite_codes;
CREATE TRIGGER update_invite_codes_used_at
    BEFORE UPDATE ON invite_codes
    FOR EACH ROW EXECUTE FUNCTION update_invite_codes_used_at();
