-- Sample invite codes for testing
-- You can run these in your Supabase SQL editor or via migrations

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
