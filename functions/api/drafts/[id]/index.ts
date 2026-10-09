import { Env, DraftUpdateRequest, DraftStatus } from '../../types';
import { ensureDbInitialized, parseDraft } from '../../db';

const VALID_STATUSES: DraftStatus[] = ['idea', 'draft', 'needs_review', 'ready', 'posted', 'archived'];

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database binding DB not found' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const id = context.params.id as string;
    await ensureDbInitialized(db);

    const raw = await db
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

    if (!raw) {
      return new Response(JSON.stringify({ error: 'Draft not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ draft: parseDraft(raw) }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to retrieve draft' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database binding DB not found' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const id = context.params.id as string;
    const body: DraftUpdateRequest = await context.request.json();

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

    // Optimistic concurrency check
    if (body.expectedVersion !== undefined && Number(current.version) !== Number(body.expectedVersion)) {
      return new Response(
        JSON.stringify({
          error: 'Conflict: Draft has been modified by another action',
          code: 'CONCURRENCY_CONFLICT',
          currentVersion: current.version,
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let status = current.status;
    if (body.status) {
      if (!VALID_STATUSES.includes(body.status)) {
        return new Response(JSON.stringify({ error: `Invalid status: ${body.status}` }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      status = body.status;
    }

    const format = body.format ? body.format : current.format;
    const topic = body.topic !== undefined ? String(body.topic) : current.topic;
    const outputJson = body.output ? JSON.stringify(body.output) : current.output_json;
    const userRating = body.user_rating !== undefined ? body.user_rating : current.user_rating;
    const userNotes = body.user_notes !== undefined ? String(body.user_notes) : current.user_notes;

    let postedAt = current.posted_at;
    if (body.status === 'posted' && !current.posted_at) {
      postedAt = body.posted_at || new Date().toISOString();
    } else if (body.status && body.status !== 'posted') {
      postedAt = null; // reset if reverted from posted
    }

    const newVersion = Number(current.version) + 1;
    const now = new Date().toISOString();

    await db.prepare(`
      UPDATE content_drafts
      SET status = ?, format = ?, topic = ?, output_json = ?,
          user_rating = ?, user_notes = ?, version = ?,
          posted_at = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      status, format, topic, outputJson,
      userRating, userNotes, newVersion,
      postedAt, now, id
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
      JSON.stringify({ error: error.message || 'Failed to update draft' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database binding DB not found' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const id = context.params.id as string;
    await ensureDbInitialized(db);

    const now = new Date().toISOString();

    // Default to soft archive per spec §2.3 and §4.4
    await db.prepare(`
      UPDATE content_drafts
      SET status = 'archived', updated_at = ?
      WHERE id = ?
    `).bind(now, id).run();

    return new Response(JSON.stringify({ success: true, archived: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to archive draft' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
