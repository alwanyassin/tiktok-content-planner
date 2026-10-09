import { Env } from './types';
import { ensureDbInitialized, seedDefaultProfiles } from './db';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const aiKeySet = !!context.env.AI_API_KEY;
  const baseUrl = context.env.AI_BASE_URL || 'https://api.openai.com/v1';
  const modelId = context.env.AI_MODEL_ID || 'gpt-4o-mini';
  const promptVersion = context.env.PROMPT_VERSION || 'v1';

  return new Response(
    JSON.stringify({
      provider: {
        configured: aiKeySet,
        baseUrl,
        modelId,
        promptVersion,
        activeEngine: aiKeySet ? 'OpenAI-Compatible API' : 'Built-in Contextual AI Engine',
      },
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database binding DB not found' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body: any = await context.request.json();

    if (body.action === 'reset_seeds') {
      await ensureDbInitialized(db);
      await seedDefaultProfiles(db);
      return new Response(JSON.stringify({ success: true, message: 'Default profiles reseeded' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Operation failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
