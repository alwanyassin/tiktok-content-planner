import { Env } from '../types';
import { ensureDbInitialized, parseProfile } from '../db';

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
    const body: any = await context.request.json();

    await ensureDbInitialized(db);

    const existing = await db
      .prepare('SELECT * FROM account_profiles WHERE id = ?')
      .bind(id)
      .first();

    if (!existing) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const displayName = body.display_name !== undefined ? String(body.display_name).trim() : existing.display_name;
    const handle = body.handle !== undefined ? (body.handle ? String(body.handle).trim() : null) : existing.handle;
    const niche = body.niche !== undefined ? String(body.niche).trim() : existing.niche;
    const audience = body.audience !== undefined ? String(body.audience).trim() : existing.audience;
    const language = body.language !== undefined ? String(body.language).trim() : existing.language;
    const tone = body.tone !== undefined ? String(body.tone).trim() : existing.tone;
    const ctaStyle = body.cta_style !== undefined ? String(body.cta_style).trim() : existing.cta_style;
    const active = body.active !== undefined ? (body.active ? 1 : 0) : existing.active;

    const contentPillarsJson = body.content_pillars !== undefined
      ? JSON.stringify(body.content_pillars)
      : existing.content_pillars_json;

    const avoidListJson = body.avoid_list !== undefined
      ? JSON.stringify(body.avoid_list)
      : existing.avoid_list_json;

    const preferredFormatsJson = body.preferred_formats !== undefined
      ? JSON.stringify(body.preferred_formats)
      : existing.preferred_formats_json;

    const now = new Date().toISOString();

    await db.prepare(`
      UPDATE account_profiles
      SET display_name = ?, handle = ?, niche = ?, audience = ?, language = ?, tone = ?,
          content_pillars_json = ?, avoid_list_json = ?, preferred_formats_json = ?,
          cta_style = ?, active = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      displayName, handle, niche, audience, language, tone,
      contentPillarsJson, avoidListJson, preferredFormatsJson,
      ctaStyle, active, now, id
    ).run();

    const updated = await db
      .prepare('SELECT * FROM account_profiles WHERE id = ?')
      .bind(id)
      .first();

    return new Response(JSON.stringify({ profile: parseProfile(updated) }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to update profile' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
