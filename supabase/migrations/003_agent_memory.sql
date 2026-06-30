-- 10. Agent Memory (persistent memory across sessions for AI agents)
CREATE TABLE public.agent_memories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id TEXT NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    agent_role TEXT NOT NULL DEFAULT 'coder',
    memory_type TEXT NOT NULL DEFAULT 'fact',
    content TEXT NOT NULL,
    importance INTEGER DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
    metadata JSONB DEFAULT '{}',
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.agent_memories ENABLE ROW LEVEL SECURITY;

-- Anyone in the room can view memories (collaborative AI team)
CREATE POLICY "Room members can view agent memories" ON public.agent_memories
    FOR SELECT USING (true);

-- Any authenticated user can create memories
CREATE POLICY "Authenticated users can create agent memories" ON public.agent_memories
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Service role can update/delete (for cleanup)
CREATE POLICY "Service role can manage agent memories" ON public.agent_memories
    FOR ALL USING (true);

-- Index for fast retrieval by room + importance
CREATE INDEX idx_agent_memories_room_importance ON public.agent_memories(room_id, importance DESC, created_at DESC);

-- Function: search memories by keyword similarity (using pgvector or ILIKE)
CREATE OR REPLACE FUNCTION search_agent_memories(
  p_room_id TEXT,
  p_query TEXT,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  agent_role TEXT,
  memory_type TEXT,
  content TEXT,
  importance INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    am.id,
    am.agent_role,
    am.memory_type,
    am.content,
    am.importance,
    am.metadata,
    am.created_at
  FROM public.agent_memories am
  WHERE am.room_id = p_room_id
    AND am.content ILIKE '%' || p_query || '%'
  ORDER BY am.importance DESC, am.created_at DESC
  LIMIT p_limit;
END;
$$;