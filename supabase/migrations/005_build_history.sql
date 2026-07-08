-- ============================================================
-- BUILD HISTORY TABLE
-- Track snapshots of room files over time for version history
-- ============================================================

CREATE TABLE IF NOT EXISTS build_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_name TEXT DEFAULT 'Auto-save',
  files JSONB NOT NULL DEFAULT '{}'::jsonb, -- Stores file paths and contents
  model_used TEXT DEFAULT '',
  provider_used TEXT DEFAULT '',
  prompt_context TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by room
CREATE INDEX IF NOT EXISTS idx_build_history_room ON build_history(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_build_history_user ON build_history(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE build_history ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view builds in their rooms" ON build_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rooms WHERE rooms.id = build_history.room_id
    )
  );

CREATE POLICY "Users can create builds" ON build_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their builds" ON build_history
  FOR DELETE USING (auth.uid() = user_id);

-- Function to get build history for a room
CREATE OR REPLACE FUNCTION get_room_build_history(p_room_id UUID, p_limit INT DEFAULT 20)
RETURNS TABLE (
  id UUID,
  snapshot_name TEXT,
  model_used TEXT,
  provider_used TEXT,
  prompt_context TEXT,
  created_at TIMESTAMPTZ,
  file_count INT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    bh.id,
    bh.snapshot_name,
    bh.model_used,
    bh.provider_used,
    bh.prompt_context,
    bh.created_at,
    jsonb_array_length(
      CASE 
        WHEN jsonb_typeof(bh.files) = 'object' THEN jsonb_object_keys(bh.files)
        ELSE '[]'::jsonb
      END
    )::INT as file_count
  FROM build_history bh
  WHERE bh.room_id = p_room_id
  ORDER BY bh.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Function to save a build snapshot
CREATE OR REPLACE FUNCTION save_build_snapshot(
  p_room_id UUID,
  p_files JSONB,
  p_model TEXT DEFAULT '',
  p_provider TEXT DEFAULT '',
  p_prompt_context TEXT DEFAULT NULL,
  p_snapshot_name TEXT DEFAULT 'Auto-save'
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_build_id UUID;
BEGIN
  INSERT INTO build_history (room_id, user_id, snapshot_name, files, model_used, provider_used, prompt_context)
  VALUES (p_room_id, auth.uid(), p_snapshot_name, p_files, p_model, p_provider, p_prompt_context)
  RETURNING id INTO v_build_id;
  
  RETURN v_build_id;
END;
$$;
