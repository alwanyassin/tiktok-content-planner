import { Env } from '../types';
import { ensureDbInitialized, parseDraft } from '../db';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database binding DB not found' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await ensureDbInitialized(db);

    const url = new URL(context.request.url);
    const date = url.searchParams.get('date');
    const profileId = url.searchParams.get('profileId');
    const status = url.searchParams.get('status');
    const includeArchived = url.searchParams.get('includeArchived') === 'true';

    let query = `
      SELECT d.*, 
             p.slug as profile_slug, p.display_name as profile_display_name,
             p.handle as profile_handle, p.niche as profile_niche,
             p.cta_style as profile_cta_style
      FROM content_drafts d
      JOIN account_profiles p ON d.profile_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (date) {
      query += ` AND d.target_date = ?`;
      params.push(date);
    }

    if (profileId) {
      query += ` AND d.profile_id = ?`;
      params.push(profileId);
    }

    if (status) {
      query += ` AND d.status = ?`;
      params.push(status);
    } else if (!includeArchived) {
      query += ` AND d.status != 'archived'`;
    }

    query += ` ORDER BY d.target_date DESC, d.created_at DESC`;

    const stmt = db.prepare(query);
    const { results } = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();

    const drafts = (results || []).map((r: any) => parseDraft(r));

    return new Response(JSON.stringify({ drafts }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch drafts' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
