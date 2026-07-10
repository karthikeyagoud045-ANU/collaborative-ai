-- ============================================================
-- ULTIMATE VIBE CODER — Supabase Database Schema
-- ============================================================

-- ============================================================
-- ROOMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code TEXT UNIQUE NOT NULL,
  name TEXT DEFAULT 'Untitled Room',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  workspace_id UUID DEFAULT NULL,
  is_public BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================
-- ROOM FILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS room_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  content TEXT DEFAULT '',
  language TEXT DEFAULT 'plaintext',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, file_path)
);

-- ============================================================
-- CHAT MESSAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  username TEXT DEFAULT 'Anonymous',
  text TEXT NOT NULL,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AI MESSAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  model TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- WORKSPACES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- WORKSPACE MEMBERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'editor', 'viewer')),
  invited_by TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_rooms_room_code ON rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_rooms_workspace ON rooms(workspace_id);
CREATE INDEX IF NOT EXISTS idx_room_files_room ON room_files(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_messages_room ON ai_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES (public access, no auth required)
-- ============================================================
CREATE POLICY "rooms_select" ON rooms FOR SELECT USING (true);
CREATE POLICY "rooms_insert" ON rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "rooms_update" ON rooms FOR UPDATE USING (true);

CREATE POLICY "room_files_select" ON room_files FOR SELECT USING (true);
CREATE POLICY "room_files_insert" ON room_files FOR INSERT WITH CHECK (true);
CREATE POLICY "room_files_update" ON room_files FOR UPDATE USING (true);
CREATE POLICY "room_files_delete" ON room_files FOR DELETE USING (true);

CREATE POLICY "chat_select" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "chat_insert" ON chat_messages FOR INSERT WITH CHECK (true);

CREATE POLICY "ai_select" ON ai_messages FOR SELECT USING (true);
CREATE POLICY "ai_insert" ON ai_messages FOR INSERT WITH CHECK (true);

CREATE POLICY "workspaces_select" ON workspaces FOR SELECT USING (true);
CREATE POLICY "workspaces_insert" ON workspaces FOR INSERT WITH CHECK (true);
CREATE POLICY "workspaces_update" ON workspaces FOR UPDATE USING (true);

CREATE POLICY "members_select" ON workspace_members FOR SELECT USING (true);
CREATE POLICY "members_insert" ON workspace_members FOR INSERT WITH CHECK (true);

-- ============================================================
-- FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS rooms_updated_at ON rooms;
CREATE TRIGGER rooms_updated_at BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS room_files_updated_at ON room_files;
CREATE TRIGGER room_files_updated_at BEFORE UPDATE ON room_files FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS workspaces_updated_at ON workspaces;
CREATE TRIGGER workspaces_updated_at BEFORE UPDATE ON workspaces FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- ============================================================
-- SUPABASE STORAGE — Bucket Setup
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Create storage bucket for room file uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'room-files',
  'room-files',
  true,
  10485760, -- 10MB limit
  ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml', 'application/pdf', 'text/plain', 'text/html', 'text/css', 'application/javascript', 'application/json']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for artist mode sketches
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'sketches',
  'sketches',
  true,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for workspace avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB limit
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (public access, no auth required)
CREATE POLICY "room_files_select" ON storage.objects FOR SELECT USING (bucket_id = 'room-files');
CREATE POLICY "room_files_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'room-files');
CREATE POLICY "room_files_update" ON storage.objects FOR UPDATE USING (bucket_id = 'room-files');
CREATE POLICY "room_files_delete" ON storage.objects FOR DELETE USING (bucket_id = 'room-files');

CREATE POLICY "sketches_select" ON storage.objects FOR SELECT USING (bucket_id = 'sketches');
CREATE POLICY "sketches_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'sketches');

CREATE POLICY "avatars_select" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
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
$$;-- 11. User API Key Pool (for round-robin load balancing)
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
