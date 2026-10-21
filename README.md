# Sakhi Setu Sanvad

A Vite + React TypeScript app that delivers menopause support tools like symptom tracking, wellness tips, community rooms, and resource libraries backed by Supabase.

## Local development
- Install: `npm install --legacy-peer-deps`
- Run dev server: `npm run dev`
- Lint: `npm run lint`
- Build: `npm run build`

Set environment variables (or a `.env` file) for your Supabase project:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Never commit `.env` — it is gitignored.

## AI (Gemini)
Gemini calls go through the `gemini` Supabase Edge Function so the API keys never reach the browser:
```sh
supabase functions deploy gemini
supabase secrets set GEMINI_API_KEYS=key1,key2   # comma-separated; rotated on quota errors
```
Only signed-in users can call it.

## Supabase setup
A single end-to-end script now lives at `supabase_schema.sql` (root). Run it once in the Supabase SQL Editor to create:
- All app tables, indexes, RLS policies, and triggers
- Storage buckets/policies for avatars and video thumbnails
- Minimal starter content for tips, resources, PHC listings, and chat rooms (chat rooms seed only if an auth user exists)

Then apply the files in `supabase/migrations/` in order (or `supabase db push`). `20261021000000_security_and_data_fixes.sql` locks down RLS, storage and grants, and adds the views/functions the community and chat features use.

After running the script, upload assets to the `avatars` and `video-thumbnails` buckets as needed and verify RLS policies match your security requirements.
