import { Env } from './types';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  let dbStatus = 'disconnected';
  if (context.env.DB) {
    try {
      const res = await context.env.DB.prepare('SELECT 1 as test').first();
      if (res) dbStatus = 'connected';
    } catch {
      dbStatus = 'error';
    }
  }

  const aiConfigured = !!context.env.AI_API_KEY;
  const aiProvider = context.env.AI_BASE_URL?.includes('openai.com') ? 'OpenAI' : 'OpenAI-Compatible';
  const modelId = context.env.AI_MODEL_ID || 'gpt-4o-mini';

  return new Response(
    JSON.stringify({
      status: 'ok',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      ai: {
        configured: aiConfigured,
        provider: aiProvider,
        model: modelId,
        mode: aiConfigured ? 'live_provider' : 'contextual_engine_active',
      },
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
