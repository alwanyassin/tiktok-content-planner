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
  content_pillars_json: string;
  avoid_list_json: string;
  preferred_formats_json: string;
  cta_style: string;
  active: number;
  created_at: string;
  updated_at: string;

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
  target_date: string;
  status: DraftStatus;
  format: DraftFormat;
  topic: string;
  product_context_json: string;
  output_json: string;
  user_rating: number | null;
  user_notes: string;
  version: number;
  generated_at: string | null;
  posted_at: string | null;
  created_at: string;
  updated_at: string;

  profile?: AccountProfile;
  product_context?: ProductContext;
  output?: ContentDraftOutput;
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
