BEGIN;

-- Add avatar column to existing user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS avatar TEXT;

-- Add comment for the new column
COMMENT ON COLUMN user_profiles.avatar IS 'Stores the selected avatar configuration as JSON string';

COMMIT;
