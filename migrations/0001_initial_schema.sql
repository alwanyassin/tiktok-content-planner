-- Migration 0001: Initial Schema
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS account_profiles (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  handle TEXT,
  niche TEXT NOT NULL,
  audience TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL DEFAULT 'id-ID',
  tone TEXT NOT NULL DEFAULT '',
  content_pillars_json TEXT NOT NULL DEFAULT '[]',
  avoid_list_json TEXT NOT NULL DEFAULT '[]',
  preferred_formats_json TEXT NOT NULL DEFAULT '["carousel"]',
  cta_style TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS content_drafts (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES account_profiles(id),
  target_date TEXT NOT NULL, -- YYYY-MM-DD
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('idea','draft','needs_review','ready','posted','archived')),
  format TEXT NOT NULL CHECK (format IN ('carousel','short_video_outline')),
  topic TEXT NOT NULL DEFAULT '',
  product_context_json TEXT NOT NULL DEFAULT '{}',
  output_json TEXT NOT NULL,
  user_rating INTEGER CHECK (user_rating IS NULL OR user_rating BETWEEN 1 AND 5),
  user_notes TEXT NOT NULL DEFAULT '',
  version INTEGER NOT NULL DEFAULT 1,
  generated_at TEXT,
  posted_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_drafts_date_status ON content_drafts(target_date, status);
CREATE INDEX IF NOT EXISTS idx_drafts_profile_date ON content_drafts(profile_id, target_date);

CREATE TABLE IF NOT EXISTS generation_records (
  id TEXT PRIMARY KEY,
  draft_id TEXT REFERENCES content_drafts(id) ON DELETE SET NULL,
  profile_id TEXT NOT NULL REFERENCES account_profiles(id),
  provider_name TEXT NOT NULL,
  model_id TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('success','provider_error','schema_error','validation_error')),
  latency_ms INTEGER,
  input_tokens INTEGER,
  output_tokens INTEGER,
  error_code TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_generation_created ON generation_records(created_at);
