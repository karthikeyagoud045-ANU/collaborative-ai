-- 11. User API Key Pool (for round-robin load balancing)
-- Users can add multiple keys per provider; route picks the least-recently-used key

CREATE TABLE IF NOT EXISTS public.user_key_pool (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- 'openai', 'anthropic', 'google', 'groq', 'openrouter', 'nvidia'
    key_value TEXT NOT NULL, -- encrypted at application layer if needed
    key_label TEXT DEFAULT '', -- user-friendly label like "My OpenAI Key #1"
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT '2000-01-01',
    total_requests INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_key_pool ENABLE ROW LEVEL SECURITY;

-- Users can only see/manage their own keys
CREATE POLICY "Users can manage own api keys" ON public.user_key_pool
    FOR ALL USING (auth.uid() = user_id);

-- Index for fast round-robin selection
CREATE INDEX idx_key_pool_round_robin ON public.user_key_pool(user_id, provider, is_active, last_used_at ASC);

-- Function: get next key for round-robin (atomic select + update)
CREATE OR REPLACE FUNCTION get_next_api_key(p_user_id UUID, p_provider TEXT)
RETURNS TABLE (key_id UUID, key_val TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    UPDATE public.user_key_pool
    SET last_used_at = now(), total_requests = total_requests + 1
    WHERE id = (
        SELECT id FROM public.user_key_pool
        WHERE user_id = p_user_id
          AND provider = p_provider
          AND is_active = true
        ORDER BY last_used_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
    )
    RETURNING id, key_value;
END;
$$;

-- Function: increment error count for a key
CREATE OR REPLACE FUNCTION increment_error_count(p_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.user_key_pool SET error_count = error_count + 1 WHERE id = p_id;
END;
$$;
