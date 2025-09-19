BEGIN;

-- Create user_dagad_folders table
CREATE TABLE IF NOT EXISTS user_dagad_folders (
    folder_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT user_dagad_folders_name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_dagad_folders_user_id ON user_dagad_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_user_dagad_folders_created_at ON user_dagad_folders(created_at);

-- Enable RLS
ALTER TABLE user_dagad_folders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own folders" ON user_dagad_folders
    FOR ALL USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_dagad_folders_updated_at ON user_dagad_folders;
CREATE TRIGGER update_user_dagad_folders_updated_at
    BEFORE UPDATE ON user_dagad_folders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
