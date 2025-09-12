BEGIN;

-- Add image support to user_dagad_entries table
ALTER TABLE user_dagad_entries 
ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE user_dagad_entries 
ADD COLUMN IF NOT EXISTS image_alt_text TEXT;

ALTER TABLE user_dagad_entries 
ADD COLUMN IF NOT EXISTS image_metadata JSONB DEFAULT '{}';

-- Create index for image_url for performance
CREATE INDEX IF NOT EXISTS idx_user_dagad_entries_image_url ON user_dagad_entries(image_url);

-- Add constraint to ensure image_url is a valid URL when provided
ALTER TABLE user_dagad_entries 
ADD CONSTRAINT user_dagad_entries_valid_image_url 
CHECK (image_url IS NULL OR image_url ~ '^https?://.*');

-- Update the content constraint to allow empty content when image is provided
ALTER TABLE user_dagad_entries 
DROP CONSTRAINT IF EXISTS user_dagad_entries_content_not_empty;

ALTER TABLE user_dagad_entries 
ADD CONSTRAINT user_dagad_entries_content_or_image_required 
CHECK (
    (content IS NOT NULL AND LENGTH(TRIM(content)) > 0) OR 
    (image_url IS NOT NULL AND LENGTH(TRIM(image_url)) > 0)
);

COMMIT;
