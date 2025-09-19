BEGIN;

-- Create user_dagad_entries table
CREATE TABLE IF NOT EXISTS user_dagad_entries (
    entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT,
    image_url TEXT,
    image_alt_text TEXT,
    image_metadata JSONB DEFAULT '{}',
    -- File support
    file_url TEXT,
    file_name TEXT,
    file_size INTEGER,
    file_mime_type TEXT,
    file_metadata JSONB DEFAULT '{}',
    source_type TEXT,
    category VARCHAR(50) DEFAULT 'general' CHECK (category IN ('instructions', 'preferences', 'rules', 'notes', 'general')),
    priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 3),
    is_active BOOLEAN DEFAULT TRUE,
    is_global BOOLEAN DEFAULT FALSE,
    auto_inject BOOLEAN DEFAULT FALSE,
    trigger_keywords TEXT[] DEFAULT '{}',
    trigger_patterns TEXT[] DEFAULT '{}',
    context_conditions JSONB DEFAULT '{}',
    content_tokens INTEGER,
    folder_id UUID REFERENCES user_dagad_folders(folder_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    
    CONSTRAINT user_dagad_entries_title_not_empty CHECK (LENGTH(TRIM(title)) > 0),
    CONSTRAINT user_dagad_entries_content_or_image_required CHECK (
        (content IS NOT NULL AND LENGTH(TRIM(content)) > 0) OR 
        (image_url IS NOT NULL AND LENGTH(TRIM(image_url)) > 0) OR
        (file_url IS NOT NULL AND LENGTH(TRIM(file_url)) > 0)
    )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_dagad_entries_user_id ON user_dagad_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_user_dagad_entries_category ON user_dagad_entries(category);
CREATE INDEX IF NOT EXISTS idx_user_dagad_entries_is_active ON user_dagad_entries(is_active);
CREATE INDEX IF NOT EXISTS idx_user_dagad_entries_priority ON user_dagad_entries(priority);
CREATE INDEX IF NOT EXISTS idx_user_dagad_entries_created_at ON user_dagad_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_user_dagad_entries_folder_id ON user_dagad_entries(folder_id);
CREATE INDEX IF NOT EXISTS idx_user_dagad_entries_image_url ON user_dagad_entries(image_url);

-- Enable RLS
ALTER TABLE user_dagad_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own entries" ON user_dagad_entries
    FOR ALL USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_dagad_entries_updated_at ON user_dagad_entries;
CREATE TRIGGER update_user_dagad_entries_updated_at
    BEFORE UPDATE ON user_dagad_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate content tokens
CREATE OR REPLACE FUNCTION calculate_dagad_content_tokens()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.content IS NOT NULL THEN
        NEW.content_tokens = LENGTH(NEW.content) / 4;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_dagad_entries_calculate_tokens
    BEFORE INSERT OR UPDATE ON user_dagad_entries
    FOR EACH ROW EXECUTE FUNCTION calculate_dagad_content_tokens();

COMMIT;
