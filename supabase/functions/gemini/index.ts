// Gemini proxy: keeps the API keys on the server.
// Deploy:  supabase functions deploy gemini
// Secrets: supabase secrets set GEMINI_API_KEYS=key1,key2
import { createClient } from 'npm:@supabase/supabase-js@2';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';
const MAX_OUTPUT_TOKENS = 2048;
const MAX_PROMPT_CHARS = 20000;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const apiKeys = (Deno.env.get('GEMINI_API_KEYS') ?? '')
  .split(',')
  .map((key) => key.trim())
  .filter(Boolean);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  // Only signed-in users may spend the quota.
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: 'Sign in to use the AI assistant.' }, 401);

  if (!apiKeys.length) return json({ error: 'GEMINI_API_KEYS is not configured.' }, 500);

  let body: {
    contents?: Array<{ parts?: Array<{ text?: string }> }>;
    generationConfig?: Record<string, unknown> & { maxOutputTokens?: number };
    safetySettings?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const promptChars = (body.contents ?? [])
    .flatMap((c) => c.parts ?? [])
    .reduce((n, p) => n + (p.text?.length ?? 0), 0);
  if (!promptChars) return json({ error: 'Empty prompt' }, 400);
  if (promptChars > MAX_PROMPT_CHARS) return json({ error: 'Prompt too long' }, 413);

  const payload = JSON.stringify({
    contents: body.contents,
    generationConfig: {
      ...body.generationConfig,
      maxOutputTokens: Math.min(body.generationConfig?.maxOutputTokens ?? 748, MAX_OUTPUT_TOKENS),
    },
    safetySettings: body.safetySettings,
  });

  // Try each key in turn; move on only when a key is out of quota.
  let lastQuotaError: unknown = null;
  for (const key of apiKeys) {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: payload,
    });
    const data = await response.json().catch(() => null);

    if (response.ok) return json(data);
    if (response.status === 429) {
      lastQuotaError = data;
      continue;
    }
    return json({ error: 'Gemini request failed', detail: data }, response.status);
  }

  return json({ error: 'quota_exhausted', detail: lastQuotaError }, 429);
});
