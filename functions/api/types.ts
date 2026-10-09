// Types for TikTok Content Planner

export type DraftStatus = 'idea' | 'draft' | 'needs_review' | 'ready' | 'posted' | 'archived';
export type DraftFormat = 'carousel' | 'short_video_outline';

export interface AccountProfile {
  id: string;
  slug: string;
  display_name: string;
  handle: string | null;
  niche: string;
  audience: string;
  language: string;
  tone: string;
  content_pillars_json: string; // stored as JSON string in D1
  avoid_list_json: string; // stored as JSON string in D1
  preferred_formats_json: string; // stored as JSON string in D1
  cta_style: string;
  active: number; // 0 or 1
  created_at: string;
  updated_at: string;

  // Parsed helpers for client
  content_pillars?: string[];
  avoid_list?: string[];
  preferred_formats?: DraftFormat[];
}

export interface SlideItem {
  position: number;
  text: string;
  visual_direction: string;
}

export interface ContentDraftOutput {
  title: string;
  format: DraftFormat;
  hook: string;
  slides: SlideItem[];
  caption: string;
  hashtags: string[];
  source_notes: string[];
  claims_to_verify: string[];
  disclosure_reminder: string | null;
  checklist: string[];
}

export interface ProductContext {
  productName?: string;
  facts?: string[];
  sourceNotes?: string[];
  affiliateDisclosureNeeded?: boolean;
}

export interface ContentDraft {
  id: string;
  profile_id: string;
  target_date: string; // YYYY-MM-DD
  status: DraftStatus;
  format: DraftFormat;
  topic: string;
  product_context_json: string; // JSON string
  output_json: string; // JSON string
  user_rating: number | null;
  user_notes: string;
  version: number;
  generated_at: string | null;
  posted_at: string | null;
  created_at: string;
  updated_at: string;

  // Parsed helpers
  profile?: AccountProfile;
  product_context?: ProductContext;
  output?: ContentDraftOutput;
}

export interface GenerationRecord {
  id: string;
  draft_id: string | null;
  profile_id: string;
  provider_name: string;
  model_id: string;
  prompt_version: string;
  outcome: 'success' | 'provider_error' | 'schema_error' | 'validation_error';
  latency_ms: number | null;
  input_tokens: number | null;
  output_tokens: number | null;
  error_code: string | null;
  created_at: string;
}

export interface DraftGenerationRequest {
  profileId: string;
  targetDate: string;
  format: DraftFormat;
  topic?: string;
  productContext?: ProductContext;
}

export interface DraftUpdateRequest {
  status?: DraftStatus;
  format?: DraftFormat;
  topic?: string;
  output?: ContentDraftOutput;
  user_rating?: number | null;
  user_notes?: string;
  posted_at?: string | null;
  expectedVersion: number;
}

export interface RegenerateRequest {
  scope: 'all' | 'hook' | 'slides' | 'caption' | 'checklist';
  slidePosition?: number;
  expectedVersion: number;
}

export interface Env {
  DB: D1Database;
  AI_BASE_URL?: string;
  AI_MODEL_ID?: string;
  AI_API_KEY?: string;
  PROMPT_VERSION?: string;
}
