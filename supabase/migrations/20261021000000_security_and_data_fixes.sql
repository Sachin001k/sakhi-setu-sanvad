-- Security and data-integrity fixes.
-- Safe to run more than once. Apply in the Supabase SQL Editor (or `supabase db push`).

-- ---------------------------------------------------------------------------
-- 1. Contact form: anyone may submit, nobody may read through the API
-- ---------------------------------------------------------------------------
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can submit contact messages" ON public.contact_messages;
CREATE POLICY "Anyone can submit contact messages" ON public.contact_messages
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 2. Chatbot history: no more shared "user_id IS NULL" rows
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own chatbot conversations" ON public.chatbot_conversations;
DROP POLICY IF EXISTS "Users can insert chatbot conversations" ON public.chatbot_conversations;
DROP POLICY IF EXISTS "Users can delete own chatbot conversations" ON public.chatbot_conversations;
CREATE POLICY "Users can view own chatbot conversations" ON public.chatbot_conversations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert chatbot conversations" ON public.chatbot_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own chatbot conversations" ON public.chatbot_conversations
  FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 3. Profiles: only the owner reads the full row; others use public_profiles
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile row" ON public.user_profiles;
CREATE POLICY "Users can view own profile row" ON public.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Name + avatar only, for showing authors in community / chat.
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT
  u.id,
  u.full_name,
  COALESCE(up.avatar_url, u.avatar_url) AS avatar_url
FROM public.users u
LEFT JOIN public.user_profiles up ON up.user_id = u.id;

-- ---------------------------------------------------------------------------
-- 4. Community posts: hide author of anonymous posts, real likes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.post_likes (
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own likes" ON public.post_likes;
CREATE POLICY "Users can view own likes" ON public.post_likes
  FOR SELECT USING (auth.uid() = user_id);

-- The base table is now owner-only; everyone else reads community_posts_public.
DROP POLICY IF EXISTS "Anyone can view community posts" ON public.community_posts;
DROP POLICY IF EXISTS "Users can view own community posts" ON public.community_posts;
CREATE POLICY "Users can view own community posts" ON public.community_posts
  FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE VIEW public.community_posts_public AS
SELECT
  p.id,
  CASE WHEN p.is_anonymous THEN NULL ELSE p.user_id END AS user_id,
  CASE WHEN p.is_anonymous THEN NULL ELSE u.full_name END AS author_name,
  CASE WHEN p.is_anonymous THEN NULL ELSE COALESCE(up.avatar_url, u.avatar_url) END AS author_avatar_url,
  p.title,
  p.content,
  COALESCE(p.likes, 0) AS likes,
  COALESCE(p.is_anonymous, false) AS is_anonymous,
  p.created_at,
  (p.user_id = auth.uid()) AS is_own,
  EXISTS (
    SELECT 1 FROM public.post_likes l
    WHERE l.post_id = p.id AND l.user_id = auth.uid()
  ) AS liked_by_me
FROM public.community_posts p
LEFT JOIN public.users u ON u.id = p.user_id
LEFT JOIN public.user_profiles up ON up.user_id = p.user_id;

-- Like / unlike. Returns the new state so the UI can trust it.
CREATE OR REPLACE FUNCTION public.toggle_post_like(p_post_id UUID)
RETURNS TABLE (liked BOOLEAN, likes INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_liked BOOLEAN;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  DELETE FROM public.post_likes WHERE post_id = p_post_id AND user_id = v_uid;
  IF FOUND THEN
    v_liked := false;
  ELSE
    INSERT INTO public.post_likes (post_id, user_id) VALUES (p_post_id, v_uid);
    v_liked := true;
  END IF;

  UPDATE public.community_posts
  SET likes = (SELECT COUNT(*) FROM public.post_likes WHERE post_id = p_post_id)
  WHERE id = p_post_id;

  RETURN QUERY
  SELECT v_liked, p.likes FROM public.community_posts p WHERE p.id = p_post_id;
END;
$$;

-- Realtime: the base table is owner-only, so postgres_changes would no longer
-- reach other users. Broadcast a minimal, anonymous payload instead; clients
-- re-read the row from community_posts_public.
CREATE OR REPLACE FUNCTION public.broadcast_community_post_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    PERFORM realtime.send(
      jsonb_build_object(
        'id', COALESCE(NEW.id, OLD.id),
        'likes', CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE NEW.likes END
      ),
      lower(TG_OP),
      'community-posts',
      false
    );
  EXCEPTION WHEN OTHERS THEN
    -- Never block a write because realtime is unavailable.
    NULL;
  END;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS on_community_post_change ON public.community_posts;
CREATE TRIGGER on_community_post_change
  AFTER INSERT OR UPDATE OR DELETE ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.broadcast_community_post_change();

-- ---------------------------------------------------------------------------
-- 5. Chat messages with author names (chat_messages.user_id -> auth.users,
--    so PostgREST can't embed public.users directly)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.chat_messages_public AS
SELECT
  m.id,
  m.user_id,
  m.content,
  m.message_type,
  m.room_id,
  m.reply_to,
  m.created_at,
  u.full_name AS author_name,
  COALESCE(up.avatar_url, u.avatar_url) AS author_avatar_url
FROM public.chat_messages m
JOIN public.chat_rooms r ON r.id = m.room_id AND r.is_public = true
LEFT JOIN public.users u ON u.id = m.user_id
LEFT JOIN public.user_profiles up ON up.user_id = m.user_id;

-- ---------------------------------------------------------------------------
-- 6. Video library: owners can see their own private videos
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public videos are viewable by everyone" ON public.video_library;
CREATE POLICY "Public videos are viewable by everyone" ON public.video_library
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

-- Only http(s) links may be stored (blocks javascript: URLs).
ALTER TABLE public.video_library DROP CONSTRAINT IF EXISTS video_library_video_url_http;
ALTER TABLE public.video_library ADD CONSTRAINT video_library_video_url_http
  CHECK (video_url ~* '^https?://') NOT VALID;

-- ---------------------------------------------------------------------------
-- 7. Signup: copy every signup field from auth metadata, seed one welcome
--    notification. The client no longer inserts into public.users itself.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta JSONB := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
BEGIN
  INSERT INTO public.users (
    id, email, full_name, preferred_language, age, location, phone,
    emergency_contact, medical_conditions, current_medications
  )
  VALUES (
    NEW.id,
    NEW.email,
    meta->>'full_name',
    COALESCE(NULLIF(meta->>'preferred_language', ''), 'en'),
    CASE WHEN meta->>'age' ~ '^\d{1,3}$' THEN (meta->>'age')::INTEGER END,
    NULLIF(meta->>'location', ''),
    NULLIF(meta->>'phone', ''),
    NULLIF(meta->>'emergency_contact', ''),
    CASE WHEN jsonb_typeof(meta->'medical_conditions') = 'array'
      THEN ARRAY(SELECT jsonb_array_elements_text(meta->'medical_conditions'))
      ELSE '{}'::TEXT[] END,
    CASE WHEN jsonb_typeof(meta->'current_medications') = 'array'
      THEN ARRAY(SELECT jsonb_array_elements_text(meta->'current_medications'))
      ELSE '{}'::TEXT[] END
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_profiles (user_id, bio, location, website, social_links, interests, privacy_settings, profile_views, avatar_url)
  VALUES (NEW.id, '', COALESCE(NULLIF(meta->>'location', ''), ''), '', '{}', '{}', '{}', 0, NULL)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (NEW.id, 'Welcome to MyMenoSakhi!', 'Start tracking your symptoms to get personalized insights.', 'tip');

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 8. Avatars: stop writing the storage object path over the avatar URL
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_avatar_upload ON storage.objects;
DROP FUNCTION IF EXISTS public.update_user_avatar_url();

-- ---------------------------------------------------------------------------
-- 9. Storage: signed-in users may only write inside their own folder
--    (<bucket>/<user id>/<file>)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can upload video thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can update video thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete video thumbnails" ON storage.objects;
CREATE POLICY "Users can upload video thumbnails" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'video-thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update video thumbnails" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'video-thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'video-thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete video thumbnails" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'video-thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- 10. Grants: logged-out visitors get only what the landing page needs.
--     RLS still applies on top of these for every role.
-- ---------------------------------------------------------------------------
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;
GRANT SELECT ON public.wellness_tips, public.resources, public.phc_directory TO anon;
GRANT INSERT ON public.contact_messages TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
REVOKE ALL ON public.contact_messages FROM authenticated;
GRANT INSERT ON public.contact_messages TO authenticated;
-- Likes only change through toggle_post_like().
REVOKE INSERT, UPDATE, DELETE ON public.post_likes FROM authenticated;
-- Views are read-only.
REVOKE ALL ON public.public_profiles, public.community_posts_public, public.chat_messages_public FROM anon, authenticated;
GRANT SELECT ON public.public_profiles, public.community_posts_public, public.chat_messages_public TO authenticated;

REVOKE ALL ON FUNCTION public.toggle_post_like(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.toggle_post_like(UUID) TO authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.broadcast_community_post_change() FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 11. Remove placeholder seed resources (fake example.com / example1 links)
-- ---------------------------------------------------------------------------
DELETE FROM public.resources
WHERE url IN ('https://www.youtube.com/watch?v=example1', 'https://example.com/nutrition-guide');
