-- Migration: Multimodal support (voice cloning + chat images)
-- 2026-04-09

-- ── personas: add voice cloning + multimodal config fields ──────────────────
ALTER TABLE public.personas
  ADD COLUMN IF NOT EXISTS voice_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS voice_sample_url TEXT,
  ADD COLUMN IF NOT EXISTS multimodal_config JSONB DEFAULT '{"tts_enabled": true, "image_enabled": true}';

-- ── Storage: voice-samples bucket (private) ──────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
  VALUES ('voice-samples', 'voice-samples', false)
  ON CONFLICT (id) DO NOTHING;

-- Owner-only read (path prefix = userId)
CREATE POLICY "Voice samples owner read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'voice-samples' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Owner-only insert
CREATE POLICY "Voice samples owner insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'voice-samples' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ── Storage: chat-images bucket (public read) ─────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
  VALUES ('chat-images', 'chat-images', true)
  ON CONFLICT (id) DO NOTHING;

-- Public read (CDN-friendly)
CREATE POLICY "Chat images public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-images');

-- Authenticated write
CREATE POLICY "Chat images auth insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'chat-images' AND auth.role() = 'authenticated');
