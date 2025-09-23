BEGIN;

-- Add consent tracking fields to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS consent_given BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS consent_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS referral_source TEXT;

-- Create index for consent queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_consent_given ON user_profiles(consent_given);

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.consent_given IS 'Whether user has given consent to terms and privacy policy';
COMMENT ON COLUMN user_profiles.consent_date IS 'Timestamp when consent was given';
COMMENT ON COLUMN user_profiles.referral_source IS 'Source that referred the user to the platform';

COMMIT;
