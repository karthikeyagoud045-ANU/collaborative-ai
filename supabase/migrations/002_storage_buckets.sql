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
