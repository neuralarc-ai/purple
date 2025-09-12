-- Fix credit exploitation by preventing refund of free/subscription credits on thread deletion
-- 1) Ensure credit_usage.thread_id uses ON DELETE CASCADE so usage rows are removed with thread
-- 2) Introduce usage_logs table (if not present) to persist metered usage per assistant response
--    This table uses ON DELETE NO ACTION to preserve thread_id for deleted threads

BEGIN;

-- Adjust FK on credit_usage.thread_id to CASCADE on thread deletion
ALTER TABLE IF EXISTS public.credit_usage 
DROP CONSTRAINT IF EXISTS credit_usage_thread_id_fkey;

ALTER TABLE IF EXISTS public.credit_usage 
ADD CONSTRAINT credit_usage_thread_id_fkey 
FOREIGN KEY (thread_id) REFERENCES public.threads(thread_id) ON DELETE CASCADE;

-- Create usage_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    thread_id UUID REFERENCES public.threads(thread_id) ON DELETE NO ACTION, -- Keep thread_id for deleted threads
    message_id UUID REFERENCES public.messages(message_id) ON DELETE SET NULL,
    total_prompt_tokens INT NOT NULL,
    total_completion_tokens INT NOT NULL,
    total_tokens INT NOT NULL,
    estimated_cost NUMERIC(10,6) NOT NULL,
    content JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_thread_id ON public.usage_logs(thread_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON public.usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_created ON public.usage_logs(user_id, created_at);

-- Enable RLS
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- Users: SELECT/DELETE own rows
DROP POLICY IF EXISTS "Users can read usage logs" ON public.usage_logs;
CREATE POLICY "Users can read usage logs" ON public.usage_logs
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete usage logs" ON public.usage_logs;
CREATE POLICY "Users can delete usage logs" ON public.usage_logs
    FOR DELETE USING (auth.uid() = user_id);

-- Service role: Full access
DROP POLICY IF EXISTS "Service role can manage usage logs" ON public.usage_logs;
CREATE POLICY "Service role can manage usage logs" ON public.usage_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Add a comment explaining the security fix
COMMENT ON CONSTRAINT credit_usage_thread_id_fkey ON public.credit_usage IS 
'CASCADE deletion prevents credit exploitation through thread deletion. When a thread is deleted, all associated credit usage records are also deleted, preventing users from getting refunded credits.';

COMMENT ON TABLE public.usage_logs IS 
'Durable usage logs that persist thread_id even when threads are deleted. This prevents credit exploitation while maintaining accurate usage history.';

COMMIT;