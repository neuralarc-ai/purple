-- Rename avatar column to avatar_url in user_profiles table
BEGIN;

-- Rename the column
ALTER TABLE user_profiles RENAME COLUMN avatar TO avatar_url;

COMMIT;
