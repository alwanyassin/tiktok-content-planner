import { Env } from '../types';
import { ensureDbInitialized, parseProfile } from '../db';

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

    const { results } = await db
      .prepare('SELECT * FROM account_profiles ORDER BY created_at ASC')
      .all();

    const profiles = (results || []).map(parseProfile);

    return new Response(JSON.stringify({ profiles }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch profiles' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
