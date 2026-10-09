# TikTok Content Planner — Product & Technical Specification

**Status:** Draft for review  
**Version:** 0.1  
**Date:** 9 October 2026  
**Decision owner:** Yaseen / account owner  
**Product type:** Single-user web app for preparing niche-consistent TikTok content  
**Deployment target:** Cloudflare Pages + Pages Functions (or Workers) + D1

> This document is a prepared specification, not implementation, deployment, security review, or test evidence. Product assumptions and open decisions are marked explicitly.

## 1. PRD

### 1.1 Summary

A lightweight web app prepares a daily content package for four TikTok accounts. For each account, it proposes an original post idea, a slide-by-slide carousel draft (and optionally short-video outline), caption, relevant hashtags, and a pre-publish checklist. The user edits, approves, copies, and posts manually in TikTok.

The app's job is to help keep each account focused on its niche. It does not automate likes, follows, comments, or publishing, and it does not connect to TikTok.

### 1.2 Problem

The user manages four new affiliate-oriented accounts with distinct themes. Daily decisions about what to post and writing each post take time, and accidental niche mixing can undermine clear account positioning. User needs a repeatable daily preparation workflow.

### 1.3 Users and needs

**Primary user:** one operator managing four accounts.

Needs:
- See today's content tasks for all four accounts in one place.
- Generate drafts from stable account templates and configurable topics.
- Review and edit AI output before use.
- Keep drafts, schedule dates, and statuses organized.
- Copy content without granting the app access to TikTok.

### 1.4 Account profiles (seed data)

1. **Beauty & Personal Care** — skincare, makeup; education, ingredient/product selection, routines, makeup tips.
2. **Fashion Wanita** — jeans, tops, corsets, and related wear; outfit ideas, fit, sizing, styling.
3. **Techno** — gadgets, phones, smartwatches, cases; feature explainers, buying guides, spec comparisons.
4. **Fashion Pria** — formal wear, tees, jeans; outfit combinations, fit, fabric, smart-casual/formal guidance.

Account names/handles remain editable. Proposed names in earlier conversation were brainstorming only; do not treat them as approved branding.

### 1.5 Goals and success measures

**Goals**
- Prepare usable, niche-aligned drafts with minimal daily effort.
- Make human review and editing explicit.
- Preserve user content in D1 and allow retrieval across sessions/devices.

**MVP measures (instrument in app, review after 2–4 weeks)**
- At least 4 drafts can be generated for a selected day, one per active profile.
- User can edit/save/copy a draft and change its status without data loss.
- At least 80% of generated drafts are judged on-niche after user review (manual rating; no claim before collecting results).
- Track generation success/failure and user edits; do not log secrets or unnecessary personal data.

### 1.6 Scope

**MVP in scope**
- Dashboard with four account cards and content for selected date.
- Editable account profile: niche description, audience, tone, language, content pillars, avoid-list, preferred format, CTA style.
- AI-assisted draft generation from versioned templates.
- Output fields: hook/title, slide copy (default 5–7 slides), caption, hashtag suggestions, visual direction, factual/source notes, disclosure reminder where relevant, checklist.
- Content calendar and status: Idea, Draft, Needs review, Ready, Posted, Archived.
- Edit, save, regenerate selected section, duplicate draft, copy individual fields / copy package.
- Generation history metadata: prompt version, provider/model identifier, timestamp, validation result.
- D1 persistence; responsive UI.
- Manual product/topic inputs; no TikTok connection.

**Explicitly out of scope**
- Auto-posting, scheduling/publishing to TikTok, or TikTok API integration.
- Automated engagement (likes, comments, follows, DMs), fake engagement, or account warming automation.
- Claiming product was personally tested; inventing reviews, prices, ratings, ingredients, specifications, or results.
- Image/video generation, asset hosting, affiliate link management, analytics ingestion, team roles, multi-tenant billing.
- Guaranteed reach, virality, account segmentation, or algorithm outcomes.

### 1.7 Core requirements

**Functional**
- FR-01: User can view four seeded account profiles and edit them.
- FR-02: User selects a date and generates content for one account or all active accounts.
- FR-03: Generation returns schema-valid structured content; invalid responses are not shown as completed drafts.
- FR-04: User can edit generated fields independently and save at any time.
- FR-05: User can see and change status; status never implies content was published externally.
- FR-06: User can copy output to clipboard and mark it Posted manually.
- FR-07: User can browse/filter drafts by date, account, and status.
- FR-08: AI output should distinguish supplied facts from suggestions and flag missing product facts; no unsupported first-person experience or claims.
- FR-09: Generation errors are visible with retry guidance; never silently replace user edits.
- FR-10: App stores only needed account/content data; provider secret is never exposed to browser.

**Quality and security**
- NFR-01: Mobile-first responsive layout; core workflow usable at 360 px width.
- NFR-02: Accessible labels, keyboard navigation, visible focus, sufficient contrast.
- NFR-03: API validation, bounded request size/rate, safe error messages.
- NFR-04: D1 migrations version-controlled; backups/export path considered before launch.
- NFR-05: Model/provider can be changed through server-side config without changing UI contract.
- NFR-06: Personal data minimal. No user login in initial single-user MVP unless deployment is reachable publicly; see security decision below.

### 1.8 AI behavior and generation workflow

**Can this use Hermes Agent?** Not by default. A Cloudflare-hosted app cannot call this chat session's Hermes Agent unless a separate, authenticated and reachable Hermes service/API is deliberately provided. No such endpoint is established in this request. Do not make the app depend on an assumed Hermes endpoint.

**MVP recommendation:** call an OpenAI-compatible model API from a Pages Function, using a configurable provider endpoint/model and a secret stored in Cloudflare environment secrets (for example, the user's configured 9router endpoint if it is reachable from Cloudflare and suitable credentials/routing are set). Keep provider calls behind one server-side module. Hermes Agent can help author prompts, evaluate drafts, and maintain the project; that is different from the deployed app invoking Hermes at runtime.

**Generation steps**
1. User picks account, date, format, optional topic/product, facts, and source notes.
2. Server loads account profile and a versioned prompt template. User-provided data is treated as untrusted content, never as system instructions.
3. Server calls configured model with exact configured model ID, timeout, bounded retry for transient failures, and token limits.
4. Model returns JSON matching `ContentDraftOutput` schema. Validate server-side.
5. If schema fails, make at most one repair request with validation errors. If still invalid, return an error and preserve existing draft.
6. Server applies deterministic checks: required fields, slide count, banned first-person trial claims unless explicitly supplied as true, unsupported numeric claims, and disclosure reminder for affiliate-related content.
7. Save as Draft; show as AI-generated, unreviewed. User reviews/edits before copying or marking Ready.

**Prompt artifacts** should live as versioned files (e.g. `prompts/content-draft/v1.md`), with system rules, task template, and injected account/context data separated. Record prompt version and provider/model with each generation. Do not scrape prose with regex. Keep secrets out of prompts and logs.

**Initial output schema (conceptual)**
```json
{
  "title": "string",
  "format": "carousel | short_video_outline",
  "hook": "string",
  "slides": [{"position": 1, "text": "string", "visual_direction": "string"}],
  "caption": "string",
  "hashtags": ["string"],
  "source_notes": ["string"],
  "claims_to_verify": ["string"],
  "disclosure_reminder": "string | null",
  "checklist": ["string"]
}
```

For a short-video outline, `slides` may be replaced with structured `beats`; define a discriminated schema before implementation. Do not accept arbitrary model-returned HTML.

### 1.9 Risks and mitigations

- **Unsupported product facts:** require user-supplied facts or source notes; mark claims to verify; avoid invented claims.
- **Poor niche fit:** constrain by editable pillars/avoid-list; review outputs; collect user rating and edits.
- **Provider/API unavailable:** show retryable error; preserve drafts; provider is configurable.
- **Public unauthenticated deployment:** protect app with Cloudflare Access or implement authentication before exposing it publicly; private data must not be treated as safe merely because URL is obscure.
- **AI cost/latency:** generate per account on demand; cap output; show loading/errors; no hidden background generation.
- **Copyright/asset reuse:** provide visual direction, not copied images; user uses assets they own or have permission to use.
- **Changes in TikTok rules:** no claims that platform policy/access is guaranteed; user verifies current rules before posting.

### 1.10 Open decisions

1. Which exact model/provider endpoint and model ID should production use? Suggested: OpenAI-compatible provider configured server-side; confirm availability from Cloudflare runtime before implementation.
2. Should the deployed app be protected with Cloudflare Access (recommended for single operator) or have app-level authentication?
3. Default schedule: one post per account per day, editable; confirm preferred frequency.
4. Should format default to carousel only, or allow carousel and short-video outline from day one?
5. Should user be able to export drafts as JSON/CSV for backup? Recommended in MVP if scope permits.

## 2. TRD

### 2.1 Proposed architecture

- **Frontend:** React + TypeScript + Vite (or equivalent static SPA), deployed on Cloudflare Pages.
- **Backend:** Cloudflare Pages Functions (Workers runtime) for API routes and model calls.
- **Database:** Cloudflare D1 using SQLite-compatible SQL and migrations.
- **AI:** server-side provider adapter implementing OpenAI-compatible chat/completions or structured output as supported. Provider/model configured by environment; no browser-side provider key.
- **Auth/access:** Cloudflare Access in front of Pages for the single-user MVP is preferred. If Access cannot be used, add app-level authentication before public deployment.
- **Storage:** no file/object storage in MVP; only text drafts and profile configuration in D1.

### 2.2 Request path

Browser SPA → `/api/*` Pages Function → validate/authenticate → D1 read (profile/template context) → provider adapter for generation (when requested) → schema validation + deterministic checks → D1 write → JSON response to SPA.

No browser-to-provider direct calls. No TikTok API calls.

### 2.3 API contract (initial)

- `GET /api/profiles` — list account profiles.
- `PATCH /api/profiles/:id` — update profile settings.
- `GET /api/drafts?date=YYYY-MM-DD&profileId=&status=` — list drafts.
- `POST /api/drafts/generate` — validate request; generate and save a draft. Body includes profile ID, target date, format, optional topic/product facts/source notes.
- `GET /api/drafts/:id` — retrieve draft.
- `PATCH /api/drafts/:id` — save edits/status; optimistic version check.
- `POST /api/drafts/:id/regenerate` — regenerate whole draft or named section; require explicit scope.
- `DELETE /api/drafts/:id` — archive/delete according to chosen retention behavior; default archive, not hard delete.
- `GET /api/health` — minimal non-sensitive health check.

Use JSON, explicit HTTP status codes, server-side validation, consistent errors (`code`, safe `message`, optional `retryable`). Never return provider keys, internal stack traces, or raw secrets.

### 2.4 Provider boundary

One module owns provider URL, exact model ID, credentials, timeout, retries/backoff, request/response parsing, and telemetry. Environment variables/secrets (names illustrative): `AI_BASE_URL`, `AI_MODEL_ID`, `AI_API_KEY`. In Cloudflare, use secret bindings for key and non-secret vars for endpoint/model where appropriate. Do not commit secrets or expose them in `VITE_*` variables.

Classify failures: timeout, rate limit, transient provider error, invalid request, invalid structured output. Retry only transient/rate-limit failures with bounded backoff; schema repair at most once. Do not retry invalid input or endlessly retry.

### 2.5 D1 schema (initial migration)

Use UUID text IDs generated server-side; timestamps stored UTC ISO-8601. Foreign keys enabled. SQLite constraints and indexes required.

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE account_profiles (
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

CREATE TABLE content_drafts (
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
CREATE INDEX idx_drafts_date_status ON content_drafts(target_date, status);
CREATE INDEX idx_drafts_profile_date ON content_drafts(profile_id, target_date);

CREATE TABLE generation_records (
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
CREATE INDEX idx_generation_created ON generation_records(created_at);
```

Notes: `output_json` and JSON profile columns must be parsed and validated in application code; D1 JSON validation support should not be assumed without confirming current runtime capability. Add `user_id`/tenant column before multi-user support. Do not store full prompts/provider responses by default; if later needed for debugging, redact and set retention explicitly. `generation_records` excludes secrets and prompt content.

### 2.6 Data validation and concurrency

- Validate route parameters, enums, lengths, JSON shape, and date format on server.
- Limit generation input/output sizes.
- Use `version` for optimistic locking on edits; return conflict if stale.
- Use D1 prepared statements/bind values, not SQL string concatenation.
- Prefer atomic writes for draft + generation record; where provider call cannot be part of transaction, record success/failure deliberately.
- Mark status Posted only on explicit user action; this records user's assertion, not observed TikTok publication.

### 2.7 Operational requirements

- D1 database binding configured in Pages project and local dev.
- SQL migrations checked into source control and run through Wrangler workflow.
- Secrets configured through Cloudflare dashboard/CLI; never committed.
- Preview/staging and production environments separated.
- Error logs omit full content and secrets; generation metadata may be retained for cost/reliability analysis.
- Add export/backup before relying on production data.

## 3. App Flow

### 3.1 First visit

1. Access gate/authentication (Cloudflare Access or approved alternative).
2. Dashboard shows four seeded accounts and current date.
3. User opens each account profile, edits name/audience/tone/pillars/avoid-list and saves.
4. User chooses generation defaults: formats, daily target, optional CTA style.

### 3.2 Daily preparation

1. Dashboard: selected date + four account cards, each showing status and “Prepare content”.
2. User chooses one account or “Prepare all active accounts”.
3. Generation form: format, topic (optional), product (optional), facts/source notes (optional), intended audience/goal if needed.
4. User presses Generate; UI shows progress and prevents accidental duplicate click.
5. Backend validates input, loads profile, calls provider, validates output, saves draft.
6. Editor opens with hook, each slide/beat, caption, hashtags, visual notes, claims to verify, checklist.
7. User edits fields; autosave or explicit save with visible saved timestamp.
8. User marks Needs review or Ready; ready requires acknowledging checklist and reviewing factual claims.
9. User copies package/field and posts manually in TikTok.
10. User optionally marks Posted, recording date/time manually. App does not verify external post.

### 3.3 Regeneration and errors

- Regenerate entire draft or selected section only; confirm before replacing any edited text, or generate into a comparison draft.
- Provider failure: retain current draft and edits; show concise retryable error.
- Invalid AI response: one schema repair attempt; if still invalid, no Ready status and show failure with retry option.
- Stale edit: show conflict and let user reload/compare; never silently overwrite.

### 3.4 Calendar and retrieval

Calendar/list filters by date, account, status. Selecting a card opens editor. Duplicate creates a new draft for a chosen date and preserves source linkage if added later. Archived items hidden by default but searchable.

### 3.5 Navigation map

`Dashboard` → `Account Profiles` → `Profile Editor`  
`Dashboard` → `Generate Content` → `Draft Editor` → `Ready` → `Copy & Post Manually` → `Mark Posted`  
`Dashboard` → `Calendar / Draft Library` → `Draft Editor`  
`Settings` → `AI Provider Status / Defaults / Data Export`

## 4. Design Brief

### 4.1 Design objective

Make daily content preparation feel like a clear editorial checklist, not an opaque AI automation tool. The four niches must be visually distinct enough to prevent cross-account mistakes while retaining one consistent interface.

### 4.2 Visual direction

- **Style:** clean, practical, editorial dashboard; light neutral canvas; restrained accent colors.
- **Account cues:** distinct icon and accent per niche, always paired with readable account name (never rely on color alone).
  - Beauty: rose/plum accent.
  - Fashion Wanita: coral/warm pink.
  - Techno: blue/indigo.
  - Fashion Pria: forest/charcoal.
- **Typography:** clear sans-serif, large readable headings and slide text preview.
- **Layout:** desktop two-column dashboard; mobile single-column cards; fixed/visible primary action on mobile where feasible.
- **Components:** account card, date selector, status chip, generation form, slide editor, caption/hashtag panel, claims-to-verify notice, checklist, copy buttons, toast/saved indicator.

### 4.3 Key screens

1. **Dashboard:** date, “Prepare today” action, four account status cards, upcoming drafts.
2. **Profile editor:** niche/audience/tone/pillars/avoid-list/format/CTA.
3. **Generate form:** brief fields with concise examples and optional context.
4. **Draft editor:** editable content, numbered slide cards, live preview, regenerate section, save status.
5. **Calendar/library:** date/status/account filters; list-first responsive view.
6. **Settings:** provider configured/available indicator without exposing key; export; generation defaults.

### 4.4 UX and copy rules

- Clearly label output “AI draft — review before posting”.
- Distinguish “Ready” (user reviewed) from “Posted” (user marked posted); clarify Posted is not independently verified.
- Show factual claims requiring verification prominently.
- For commerce/affiliate content, include an editable reminder to disclose material relationship where required; do not imply app has checked local legal/platform rules.
- Never label generated recommendations as tested or proven unless user provides evidence.
- Destructive actions use confirmation and offer archive over delete.

### 4.5 Accessibility

WCAG 2.2 AA target where practical: contrast, semantic headings, keyboard support, screen-reader labels, non-color status labels, reduced motion, and validation errors announced accessibly.

## 5. Backend Schema

### 5.1 Entities and relationships

- `account_profiles` 1 → many `content_drafts`.
- `content_drafts` 1 → many `generation_records` over revisions/regenerations (if multiple records per draft are retained).
- Initial deployment is single-user behind access control; schema is not yet multi-tenant.

### 5.2 Domain objects

**AccountProfile**
- `id`, `slug`, `displayName`, `handle?`, `niche`, `audience`, `language`, `tone`
- `contentPillars[]`, `avoidList[]`, `preferredFormats[]`, `ctaStyle`, `active`
- timestamps

**DraftGenerationRequest**
- `profileId`, `targetDate`, `format`, `topic?`
- `productContext?`: `productName?`, `facts[]`, `sourceNotes[]`, `affiliateDisclosureNeeded?`
- Optional user constraints (audience, goal, length), bounded and treated as data.

**ContentDraftOutput**
- `title`, `format`, `hook`
- `slides[]` (position, text, visualDirection) OR `beats[]` for video
- `caption`, `hashtags[]`, `sourceNotes[]`, `claimsToVerify[]`, `disclosureReminder?`, `checklist[]`

**ContentDraft**
- persistence fields, output JSON, status, version, rating, notes, timestamps.

**GenerationRecord**
- provider/model/prompt version, outcome, latency/token metadata if returned, error classification, timestamp; no key or full prompt.

### 5.3 Status transition rules

- `idea` → `draft` → `needs_review` → `ready` → `posted`.
- Any non-posted state may be archived.
- `posted` can be reverted only through explicit user action; preserve audit fields.
- AI generation creates `draft`, never `ready` or `posted`.
- A status update is a local record only, not external TikTok evidence.

### 5.4 Future schema extensions (not MVP)

- `users` and `user_id` foreign keys for multi-user accounts.
- `assets` metadata plus R2 object storage if licensed media uploads become necessary.
- `prompt_versions` table if version inventory needs runtime management; initially prompt files in repository are sufficient.
- `draft_revisions` for full version history; initially use optimistic `version` and generation records.
- `posting_records` only if external publication evidence/workflow is later required; no TikTok API assumption.

## 6. Implementation Plan

### Phase 0 — Resolve decisions
- Confirm exact AI provider/model and verify API reachable from Cloudflare Workers/Pages Functions.
- Decide Cloudflare Access vs app authentication.
- Confirm carousel-only vs carousel + short-video outline.
- Confirm daily posting target and whether export is MVP.
- Acceptance: documented decisions, no guessed credentials/endpoints.

### Phase 1 — Bootstrap and foundations
- Create repository/app structure, README, agent instructions, license choice, `.gitignore`, CI skeleton.
- Create Pages SPA and Functions API skeleton; configure local Wrangler and D1 binding.
- Add migration runner and seed four profiles.
- Add access control for preview/prod before exposing app.
- Verify app shell, D1 read/write locally, migration repeatability.

### Phase 2 — Core manual planner
- Implement dashboard, profile editor, draft list/calendar, draft editor.
- Implement CRUD endpoints and server-side validation.
- Add status transitions, optimistic versioning, clipboard actions, archive.
- Add tests for profiles, draft persistence, status rules, and date filters.
- Acceptance: user can create/edit/retrieve drafts without AI and across reloads.

### Phase 3 — AI generation
- Implement provider adapter with configured base URL/model, secret binding, timeout and bounded retry.
- Add versioned prompt files and typed output schema.
- Implement generate endpoint, schema validation, one bounded repair, deterministic claim checks, generation records.
- Add mocked provider tests and golden test cases for four niches; test unsupported product facts and prompt-injection-like text in supplied data.
- Acceptance: valid structured output saved; invalid/provider failure preserves existing edits and is surfaced.

### Phase 4 — Polish and readiness
- Responsive/accessibility pass, empty/loading/error states, user-facing AI disclosure, claims-to-verify panel.
- Add data export/backup if accepted; verify migration/restore procedure.
- Add request rate/size limits and review logs for secret/data leakage.
- Run unit, integration, browser smoke, and production build checks.
- Acceptance: all key flows verified in preview; no claim of TikTok posting integration.

### Phase 5 — Deploy and operate
- Configure D1 and secrets in Cloudflare, deploy Pages preview, verify Access/auth gate, API and database behavior.
- Promote to production only after user approval and observed verification.
- Document rollback/migration recovery and how to rotate provider key.
- Monitor provider error rate, latency and token usage from observed telemetry; keep unreported cost/metrics null.

### Suggested initial verification checklist
- [ ] Four profiles seed exactly once and are editable.
- [ ] D1 migrations apply in local and Cloudflare preview environments.
- [ ] Unauthenticated access is blocked if app is publicly reachable.
- [ ] API validates malformed IDs, dates, statuses, and excessive payloads.
- [ ] Provider key never appears in browser bundle, response, or logs.
- [ ] Valid AI response parses against schema; invalid output fails after one repair attempt.
- [ ] Existing user edits survive provider failure and regeneration flow.
- [ ] Copy, save, reload, filter, archive, and status transitions work on mobile and desktop.
- [ ] “Posted” state is clearly described as user-entered and not externally verified.

## Evidence and next step

Prepared: six requested specification sections, architecture recommendation, initial D1 schema, AI boundary, and phased implementation plan.  
Not observed: repository creation, implementation, tests, Cloudflare configuration, provider connectivity, deployment, or stakeholder approval.  
**Next action:** review open decisions in §1.10; after acceptance, convert this specification into an implementation handoff and build the MVP.