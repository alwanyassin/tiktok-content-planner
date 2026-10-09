import { Env, RegenerateRequest, ContentDraftOutput } from '../../types';
import { ensureDbInitialized, generateId, parseDraft, parseProfile } from '../../db';
import { generateWithAIProvider } from '../../ai-adapter';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database binding DB not found' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const id = context.params.id as string;
    const body: RegenerateRequest = await context.request.json();

    if (!body.scope) {
      return new Response(JSON.stringify({ error: 'Scope is required (all, hook, slides, caption, checklist)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await ensureDbInitialized(db);

    const current: any = await db
      .prepare('SELECT * FROM content_drafts WHERE id = ?')
      .bind(id)
      .first();

    if (!current) {
      return new Response(JSON.stringify({ error: 'Draft not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (body.expectedVersion !== undefined && Number(current.version) !== Number(body.expectedVersion)) {
      return new Response(
        JSON.stringify({
          error: 'Conflict: Draft has been modified. Please reload before regenerating.',
          code: 'CONCURRENCY_CONFLICT',
          currentVersion: current.version,
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const rawProfile = await db
      .prepare('SELECT * FROM account_profiles WHERE id = ?')
      .bind(current.profile_id)
      .first();

    const profile = parseProfile(rawProfile);
    const productContext = JSON.parse(current.product_context_json || '{}');
    const existingOutput: ContentDraftOutput = JSON.parse(current.output_json || '{}');

    // Generate fresh draft using AI adapter
    const genResult = await generateWithAIProvider(
      {
        profileId: current.profile_id,
        targetDate: current.target_date,
        format: current.format,
        topic: current.topic,
        productContext,
      },
      profile,
      context.env
    );

    // Merge based on scope to strictly preserve non-targeted edits
    let mergedOutput: ContentDraftOutput = { ...existingOutput };

    if (body.scope === 'all') {
      mergedOutput = genResult.output;
    } else if (body.scope === 'hook') {
      mergedOutput.hook = genResult.output.hook;
      mergedOutput.title = genResult.output.title;
    } else if (body.scope === 'slides') {
      if (body.slidePosition !== undefined) {
        // Regenerate single slide
        const targetPos = body.slidePosition;
        const newSlide = genResult.output.slides.find(s => s.position === targetPos) || genResult.output.slides[0];
        mergedOutput.slides = (mergedOutput.slides || []).map(s => {
          if (s.position === targetPos) {
            return { ...s, text: newSlide.text, visual_direction: newSlide.visual_direction };
          }
          return s;
        });
      } else {
        mergedOutput.slides = genResult.output.slides;
      }
    } else if (body.scope === 'caption') {
      mergedOutput.caption = genResult.output.caption;
      mergedOutput.hashtags = genResult.output.hashtags;
    } else if (body.scope === 'checklist') {
      mergedOutput.checklist = genResult.output.checklist;
      mergedOutput.claims_to_verify = genResult.output.claims_to_verify;
    }

    const newVersion = Number(current.version) + 1;
    const now = new Date().toISOString();
    const outputJson = JSON.stringify(mergedOutput);

    await db.prepare(`
      UPDATE content_drafts
      SET output_json = ?, version = ?, updated_at = ?
      WHERE id = ?
    `).bind(outputJson, newVersion, now, id).run();

    // Record generation
    const genRecordId = generateId('gen');
    await db.prepare(`
      INSERT INTO generation_records (
        id, draft_id, profile_id, provider_name, model_id, prompt_version,
        outcome, latency_ms, input_tokens, output_tokens, error_code, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      genRecordId, id, current.profile_id, genResult.providerName, genResult.modelId,
      genResult.promptVersion, genResult.outcome, genResult.latencyMs,
      genResult.inputTokens || null, genResult.outputTokens || null,
      genResult.errorCode || null, now
    ).run();

    const updatedRaw = await db
      .prepare(`
        SELECT d.*, 
               p.slug as profile_slug, p.display_name as profile_display_name,
               p.handle as profile_handle, p.niche as profile_niche,
               p.cta_style as profile_cta_style
        FROM content_drafts d
        JOIN account_profiles p ON d.profile_id = p.id
        WHERE d.id = ?
      `)
      .bind(id)
      .first();

    return new Response(JSON.stringify({ draft: parseDraft(updatedRaw) }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Regeneration failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
