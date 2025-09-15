BEGIN;

-- Create smart DAGAD context function that includes image data
CREATE OR REPLACE FUNCTION get_smart_user_dagad_context(
    p_user_id UUID,
    p_user_input TEXT,
    p_thread_context TEXT DEFAULT NULL,
    p_max_tokens INTEGER DEFAULT 2000
)
RETURNS TEXT
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    context_text TEXT := '';
    entry_record RECORD;
    current_tokens INTEGER := 0;
    estimated_tokens INTEGER;
    input_lower TEXT;
    context_lower TEXT;
BEGIN
    -- Convert inputs to lowercase for matching
    input_lower := LOWER(p_user_input);
    context_lower := LOWER(COALESCE(p_thread_context, ''));
    
    -- Loop through DAGAD entries and find relevant ones
    FOR entry_record IN
        SELECT 
            entry_id,
            title,
            description,
            content,
            image_url,
            image_alt_text,
            category,
            priority,
            trigger_keywords,
            trigger_patterns,
            context_conditions,
            content_tokens
        FROM user_dagad_entries
        WHERE user_id = p_user_id
        AND is_active = TRUE
        AND (
            -- Auto-inject entries
            auto_inject = TRUE
            OR
            -- Keyword matching
            EXISTS (
                SELECT 1 FROM unnest(trigger_keywords) AS keyword 
                WHERE LOWER(keyword) = ANY(string_to_array(input_lower, ' '))
            )
            OR
            -- Pattern matching (simple LIKE patterns)
            EXISTS (
                SELECT 1 FROM unnest(trigger_patterns) AS pattern 
                WHERE input_lower LIKE '%' || LOWER(pattern) || '%'
            )
            OR
            -- Context matching
            (context_lower != '' AND EXISTS (
                SELECT 1 FROM unnest(trigger_keywords) AS keyword 
                WHERE LOWER(keyword) = ANY(string_to_array(context_lower, ' '))
            ))
        )
        ORDER BY priority ASC, created_at DESC
    LOOP
        -- Estimate tokens (rough approximation: 4 characters per token)
        estimated_tokens := COALESCE(entry_record.content_tokens, LENGTH(COALESCE(entry_record.content, '')) / 4);
        
        -- Add image token estimate if present (rough estimate for image description)
        IF entry_record.image_url IS NOT NULL THEN
            estimated_tokens := estimated_tokens + 50; -- Rough estimate for image context
        END IF;
        
        -- Check if we exceed token limit
        IF current_tokens + estimated_tokens > p_max_tokens THEN
            EXIT;
        END IF;
        
        -- Build context entry
        context_text := context_text || E'\n\n## ' || entry_record.title || E'\n';
        context_text := context_text || '**Category:** ' || entry_record.category || E'\n';
        
        IF entry_record.description IS NOT NULL AND entry_record.description != '' THEN
            context_text := context_text || '**Description:** ' || entry_record.description || E'\n';
        END IF;
        
        -- Add image information if present
        IF entry_record.image_url IS NOT NULL THEN
            context_text := context_text || E'\n**Image:** ' || entry_record.image_url;
            IF entry_record.image_alt_text IS NOT NULL AND entry_record.image_alt_text != '' THEN
                context_text := context_text || E'\n**Image Description:** ' || entry_record.image_alt_text;
            END IF;
            context_text := context_text || E'\n';
        END IF;
        
        -- Add content if present
        IF entry_record.content IS NOT NULL AND entry_record.content != '' THEN
            context_text := context_text || E'\n' || entry_record.content;
        END IF;
        
        current_tokens := current_tokens + estimated_tokens;
        
        -- Update last_used_at timestamp
        UPDATE user_dagad_entries 
        SET last_used_at = NOW() 
        WHERE entry_id = entry_record.entry_id;
    END LOOP;
    
    -- Return formatted context or NULL if empty
    RETURN CASE 
        WHEN context_text = '' THEN NULL
        ELSE E'# USER PERSONAL INSTRUCTIONS (DAGAD)\n\nThe following are your personal instructions and preferences. Use this information to provide more personalized and relevant responses:' || context_text
    END;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_smart_user_dagad_context(UUID, TEXT, TEXT, INTEGER) TO authenticated;

COMMIT;
