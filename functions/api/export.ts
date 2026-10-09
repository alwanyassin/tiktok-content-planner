import { Env } from './types';
import { ensureDbInitialized, parseDraft } from './db';

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
    const format = url.searchParams.get('format') || 'json';

    const { results } = await db
      .prepare(`
        SELECT d.*, 
               p.slug as profile_slug, p.display_name as profile_display_name,
               p.handle as profile_handle, p.niche as profile_niche,
               p.cta_style as profile_cta_style
        FROM content_drafts d
        JOIN account_profiles p ON d.profile_id = p.id
        ORDER BY d.target_date DESC, d.created_at DESC
      `)
      .all();

    const drafts = (results || []).map((r: any) => parseDraft(r));

    if (format === 'csv') {
      const headers = ['ID', 'Date', 'Account', 'Niche', 'Status', 'Format', 'Title', 'Hook', 'Caption', 'Hashtags', 'Slides Count', 'Created At'];
      const rows = drafts.map((d: any) => [
        `"${d.id}"`,
        `"${d.target_date}"`,
        `"${(d.profile?.display_name || '').replace(/"/g, '""')}"`,
        `"${(d.profile?.niche || '').replace(/"/g, '""')}"`,
        `"${d.status}"`,
        `"${d.format}"`,
        `"${(d.output?.title || '').replace(/"/g, '""')}"`,
        `"${(d.output?.hook || '').replace(/"/g, '""')}"`,
        `"${(d.output?.caption || '').replace(/"/g, '""')}"`,
        `"${(d.output?.hashtags?.join(' ') || '').replace(/"/g, '""')}"`,
        d.output?.slides?.length || 0,
        `"${d.created_at}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="tiktok-drafts-export-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return new Response(
      JSON.stringify({
        exportedAt: new Date().toISOString(),
        totalDrafts: drafts.length,
        drafts,
      }, null, 2),
      {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="tiktok-drafts-export-${new Date().toISOString().slice(0, 10)}.json"`,
        },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Export failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
