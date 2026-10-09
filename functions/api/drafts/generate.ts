import { Env, DraftGenerationRequest } from '../types';
import { ensureDbInitialized, generateId, parseDraft, parseProfile } from '../db';
import { generateWithAIProvider } from '../ai-adapter';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database binding DB not found' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await ensureDbInitialized(db);

    const body: DraftGenerationRequest = await context.request.json();

    if (!body.profileId) {
      return new Response(JSON.stringify({ error: 'profileId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!body.targetDate || !/^\d{4}-\d{2}-\d{2}$/.test(body.targetDate)) {
      return new Response(JSON.stringify({ error: 'Valid targetDate (YYYY-MM-DD) is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const format = body.format === 'short_video_outline' ? 'short_video_outline' : 'carousel';

    // Load account profile
    const rawProfile = await db
      .prepare('SELECT * FROM account_profiles WHERE id = ?')
      .bind(body.profileId)
      .first();

    if (!rawProfile) {
      return new Response(JSON.stringify({ error: 'Account profile not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const profile = parseProfile(rawProfile);

    // Call AI provider with adapter
    const genResult = await generateWithAIProvider(
      {
        profileId: body.profileId,
        targetDate: body.targetDate,
        format,
        topic: body.topic,
        productContext: body.productContext,
      },
      profile,
      context.env
    );

    const draftId = generateId('draft');
    const genRecordId = generateId('gen');
    const now = new Date().toISOString();

    const outputJson = JSON.stringify(genResult.output);
    const productContextJson = JSON.stringify(body.productContext || {});

    // Save draft
    await db.prepare(`
      INSERT INTO content_drafts (
        id, profile_id, target_date, status, format, topic,
        product_context_json, output_json, user_rating, user_notes,
        version, generated_at, posted_at, created_at, updated_at
      ) VALUES (?, ?, ?, 'draft', ?, ?, ?, ?, NULL, '', 1, ?, NULL, ?, ?)
    `).bind(
      draftId, body.profileId, body.targetDate, format, body.topic || '',
      productContextJson, outputJson, now, now, now
    ).run();

    // Save generation record
    await db.prepare(`
      INSERT INTO generation_records (
        id, draft_id, profile_id, provider_name, model_id, prompt_version,
        outcome, latency_ms, input_tokens, output_tokens, error_code, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      genRecordId, draftId, body.profileId, genResult.providerName, genResult.modelId,
      genResult.promptVersion, genResult.outcome, genResult.latencyMs,
      genResult.inputTokens || null, genResult.outputTokens || null,
      genResult.errorCode || null, now
    ).run();

    const createdRaw = await db
      .prepare(`
        SELECT d.*, 
               p.slug as profile_slug, p.display_name as profile_display_name,
               p.handle as profile_handle, p.niche as profile_niche,
               p.cta_style as profile_cta_style
        FROM content_drafts d
        JOIN account_profiles p ON d.profile_id = p.id
        WHERE d.id = ?
      `)
      .bind(draftId)
      .first();

    const draft = parseDraft(createdRaw, profile);

    return new Response(JSON.stringify({ draft, generationRecord: genResult }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Generation failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
