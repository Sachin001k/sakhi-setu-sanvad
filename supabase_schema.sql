-- Sakhi Setu Sanvad - Unified Supabase schema
-- Run this script in the Supabase SQL Editor to set up tables, RLS policies,
-- storage policies, and initial sample content.

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Base profile table extending auth.users
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  preferred_language TEXT DEFAULT 'en',
  age INTEGER,
  location TEXT,
  phone TEXT,
  emergency_contact TEXT,
  medical_conditions TEXT[],
  current_medications TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Symptom tracking
CREATE TABLE IF NOT EXISTS public.symptoms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  symptom_type TEXT NOT NULL,
  severity INTEGER NOT NULL CHECK (severity >= 1 AND severity <= 10),
  notes TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wellness tips (public content)
CREATE TABLE IF NOT EXISTS public.wellness_tips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  language TEXT NOT NULL,
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community posts
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resource library
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  language TEXT NOT NULL,
  category TEXT NOT NULL,
  duration_minutes INTEGER,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health reports
CREATE TABLE IF NOT EXISTS public.health_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  symptoms_summary JSONB,
  recommendations JSONB,
  insights JSONB,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reminders
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_time TIME NOT NULL,
  days_of_week INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Primary Health Center directory
CREATE TABLE IF NOT EXISTS public.phc_directory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT,
  phone TEXT,
  email TEXT,
  services TEXT[],
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chatbot message history
CREATE TABLE IF NOT EXISTS public.chatbot_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  message TEXT NOT NULL,
  response TEXT,
  language TEXT DEFAULT 'en',
  is_user_message BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voice notes
CREATE TABLE IF NOT EXISTS public.voice_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT,
  transcript TEXT,
  audio_url TEXT,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Goals
CREATE TABLE IF NOT EXISTS public.user_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_value INTEGER,
  current_value INTEGER DEFAULT 0,
  unit TEXT,
  target_date DATE,
  is_achieved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contact messages submissions
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'landing_page',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enhanced profile table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  bio TEXT,
  location TEXT,
  website TEXT,
  social_links JSONB DEFAULT '{}',
  interests TEXT[] DEFAULT '{}',
  privacy_settings JSONB DEFAULT '{}',
  profile_views INTEGER DEFAULT 0,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video library
CREATE TABLE IF NOT EXISTS public.video_library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  category TEXT NOT NULL DEFAULT 'wellness',
  tags TEXT[] DEFAULT '{}',
  published_date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat rooms
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  reply_to UUID REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_symptoms_user_id ON public.symptoms(user_id);
CREATE INDEX IF NOT EXISTS idx_symptoms_recorded_at ON public.symptoms(recorded_at);
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON public.reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_scheduled_time ON public.reminders(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_health_reports_user_id ON public.health_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_phc_directory_location ON public.phc_directory(city, state);
CREATE INDEX IF NOT EXISTS idx_video_library_user_id ON public.video_library(user_id);
CREATE INDEX IF NOT EXISTS idx_video_library_category ON public.video_library(category);
CREATE INDEX IF NOT EXISTS idx_video_library_public ON public.video_library(is_public);
CREATE INDEX IF NOT EXISTS idx_video_library_created_at ON public.video_library(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON public.chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_avatar_url ON public.user_profiles(avatar_url);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phc_directory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies: users
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies: symptoms
DROP POLICY IF EXISTS "Users can view own symptoms" ON public.symptoms;
DROP POLICY IF EXISTS "Users can insert own symptoms" ON public.symptoms;
DROP POLICY IF EXISTS "Users can update own symptoms" ON public.symptoms;
DROP POLICY IF EXISTS "Users can delete own symptoms" ON public.symptoms;
CREATE POLICY "Users can view own symptoms" ON public.symptoms
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own symptoms" ON public.symptoms
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own symptoms" ON public.symptoms
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own symptoms" ON public.symptoms
  FOR DELETE USING (auth.uid() = user_id);

-- Policies: wellness tips
DROP POLICY IF EXISTS "Anyone can view wellness tips" ON public.wellness_tips;
CREATE POLICY "Anyone can view wellness tips" ON public.wellness_tips
  FOR SELECT USING (true);

-- Policies: community posts
DROP POLICY IF EXISTS "Anyone can view community posts" ON public.community_posts;
DROP POLICY IF EXISTS "Users can insert community posts" ON public.community_posts;
DROP POLICY IF EXISTS "Users can update own community posts" ON public.community_posts;
DROP POLICY IF EXISTS "Users can delete own community posts" ON public.community_posts;
CREATE POLICY "Anyone can view community posts" ON public.community_posts
  FOR SELECT USING (true);
CREATE POLICY "Users can insert community posts" ON public.community_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own community posts" ON public.community_posts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own community posts" ON public.community_posts
  FOR DELETE USING (auth.uid() = user_id);

-- Policies: resources
DROP POLICY IF EXISTS "Anyone can view resources" ON public.resources;
CREATE POLICY "Anyone can view resources" ON public.resources
  FOR SELECT USING (true);

-- Policies: health reports
DROP POLICY IF EXISTS "Users can view own health reports" ON public.health_reports;
DROP POLICY IF EXISTS "Users can insert own health reports" ON public.health_reports;
CREATE POLICY "Users can view own health reports" ON public.health_reports
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own health reports" ON public.health_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies: reminders
DROP POLICY IF EXISTS "Users can view own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can insert own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can update own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can delete own reminders" ON public.reminders;
CREATE POLICY "Users can view own reminders" ON public.reminders
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reminders" ON public.reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reminders" ON public.reminders
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reminders" ON public.reminders
  FOR DELETE USING (auth.uid() = user_id);

-- Policies: PHC directory
DROP POLICY IF EXISTS "Anyone can view PHC directory" ON public.phc_directory;
CREATE POLICY "Anyone can view PHC directory" ON public.phc_directory
  FOR SELECT USING (is_active = true);

-- Policies: chatbot conversations
DROP POLICY IF EXISTS "Users can view own chatbot conversations" ON public.chatbot_conversations;
DROP POLICY IF EXISTS "Users can insert chatbot conversations" ON public.chatbot_conversations;
CREATE POLICY "Users can view own chatbot conversations" ON public.chatbot_conversations
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can insert chatbot conversations" ON public.chatbot_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Policies: voice notes
DROP POLICY IF EXISTS "Users can view own voice notes" ON public.voice_notes;
DROP POLICY IF EXISTS "Users can insert own voice notes" ON public.voice_notes;
DROP POLICY IF EXISTS "Users can update own voice notes" ON public.voice_notes;
DROP POLICY IF EXISTS "Users can delete own voice notes" ON public.voice_notes;
CREATE POLICY "Users can view own voice notes" ON public.voice_notes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own voice notes" ON public.voice_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own voice notes" ON public.voice_notes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own voice notes" ON public.voice_notes
  FOR DELETE USING (auth.uid() = user_id);

-- Policies: user goals
DROP POLICY IF EXISTS "Users can view own goals" ON public.user_goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON public.user_goals;
DROP POLICY IF EXISTS "Users can update own goals" ON public.user_goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON public.user_goals;
CREATE POLICY "Users can view own goals" ON public.user_goals
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON public.user_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.user_goals
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON public.user_goals
  FOR DELETE USING (auth.uid() = user_id);

-- Policies: notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies: video library
DROP POLICY IF EXISTS "Public videos are viewable by everyone" ON public.video_library;
DROP POLICY IF EXISTS "Users can insert their own videos" ON public.video_library;
DROP POLICY IF EXISTS "Users can update their own videos" ON public.video_library;
DROP POLICY IF EXISTS "Users can delete their own videos" ON public.video_library;
CREATE POLICY "Public videos are viewable by everyone" ON public.video_library
  FOR SELECT USING (is_public = true);
CREATE POLICY "Users can insert their own videos" ON public.video_library
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own videos" ON public.video_library
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own videos" ON public.video_library
  FOR DELETE USING (auth.uid() = user_id);

-- Policies: chat rooms
DROP POLICY IF EXISTS "Public rooms are viewable by everyone" ON public.chat_rooms;
DROP POLICY IF EXISTS "Authenticated users can create rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Room creators can update their rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Room creators can delete their rooms" ON public.chat_rooms;
CREATE POLICY "Public rooms are viewable by everyone" ON public.chat_rooms
  FOR SELECT USING (is_public = true);
CREATE POLICY "Authenticated users can create rooms" ON public.chat_rooms
  FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Room creators can update their rooms" ON public.chat_rooms
  FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Room creators can delete their rooms" ON public.chat_rooms
  FOR DELETE USING (auth.uid() = created_by);

-- Policies: chat messages
DROP POLICY IF EXISTS "Users can view messages in public rooms" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.chat_messages;
CREATE POLICY "Users can view messages in public rooms" ON public.chat_messages
  FOR SELECT USING (
    room_id IN (SELECT id FROM public.chat_rooms WHERE is_public = true)
  );
CREATE POLICY "Users can insert messages" ON public.chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own messages" ON public.chat_messages
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own messages" ON public.chat_messages
  FOR DELETE USING (auth.uid() = user_id);

-- Policies: user profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.user_profiles;
CREATE POLICY "Users can view all profiles" ON public.user_profiles
  FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own profile" ON public.user_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Functions and triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_video_library_updated_at ON public.video_library;
CREATE TRIGGER update_video_library_updated_at
  BEFORE UPDATE ON public.video_library
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, preferred_language)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', 'en')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_profiles (user_id, bio, location, website, social_links, interests, privacy_settings, profile_views, avatar_url)
  VALUES (NEW.id, '', '', '', '{}', '{}', '{}', 0, NULL)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_user_avatar_url()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.user_profiles
  SET avatar_url = NEW.name,
      updated_at = NOW()
  WHERE user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_avatar_upload ON storage.objects;
CREATE TRIGGER on_avatar_upload
  AFTER INSERT ON storage.objects
  FOR EACH ROW
  WHEN (NEW.bucket_id = 'avatars')
  EXECUTE FUNCTION public.update_user_avatar_url();

-- Storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public)
VALUES ('video-thumbnails', 'video-thumbnails', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Storage policies for avatars
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT TO authenticated, anon WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE TO authenticated, anon USING (bucket_id = 'avatars') WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE TO authenticated, anon USING (bucket_id = 'avatars');

-- Storage policies for video thumbnails
DROP POLICY IF EXISTS "Video thumbnails are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload video thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can update video thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete video thumbnails" ON storage.objects;
CREATE POLICY "Video thumbnails are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'video-thumbnails');
CREATE POLICY "Users can upload video thumbnails" ON storage.objects
  FOR INSERT TO authenticated, anon WITH CHECK (bucket_id = 'video-thumbnails');
CREATE POLICY "Users can update video thumbnails" ON storage.objects
  FOR UPDATE TO authenticated, anon USING (bucket_id = 'video-thumbnails') WITH CHECK (bucket_id = 'video-thumbnails');
CREATE POLICY "Users can delete video thumbnails" ON storage.objects
  FOR DELETE TO authenticated, anon USING (bucket_id = 'video-thumbnails');

-- Seed minimal content
INSERT INTO public.wellness_tips (title, content, category, language)
SELECT 'Morning Yoga for Menopause', 'Start your day with gentle yoga poses like cat-cow stretch and child pose to reduce stiffness and improve circulation.', 'exercise', 'en'
WHERE NOT EXISTS (
  SELECT 1 FROM public.wellness_tips WHERE title = 'Morning Yoga for Menopause' AND language = 'en'
);
INSERT INTO public.wellness_tips (title, content, category, language)
SELECT 'Hydration Tips', 'Drink 8-10 glasses of water daily. Add lemon or cucumber for flavor and extra nutrients.', 'nutrition', 'en'
WHERE NOT EXISTS (
  SELECT 1 FROM public.wellness_tips WHERE title = 'Hydration Tips' AND language = 'en'
);

INSERT INTO public.resources (title, description, type, url, language, category, duration_minutes)
SELECT 'Yoga for Menopause Relief', 'A comprehensive 30-minute yoga session designed specifically for women experiencing menopause symptoms.', 'video', 'https://www.youtube.com/watch?v=example1', 'en', 'exercise', 30
WHERE NOT EXISTS (
  SELECT 1 FROM public.resources WHERE title = 'Yoga for Menopause Relief'
);
INSERT INTO public.resources (title, description, type, url, language, category, duration_minutes)
SELECT 'Nutritional Guidelines', 'Essential dietary recommendations to support your body during menopause transition.', 'article', 'https://example.com/nutrition-guide', 'en', 'nutrition', 5
WHERE NOT EXISTS (
  SELECT 1 FROM public.resources WHERE title = 'Nutritional Guidelines'
);

INSERT INTO public.phc_directory (name, address, city, state, pincode, phone, services)
SELECT 'Primary Health Center - Pune', '123 Main Street, Pune', 'Pune', 'Maharashtra', '411001', '+91-20-12345678', ARRAY['General Medicine', 'Gynecology', 'Mental Health']
WHERE NOT EXISTS (
  SELECT 1 FROM public.phc_directory WHERE name = 'Primary Health Center - Pune'
);
INSERT INTO public.phc_directory (name, address, city, state, pincode, phone, services)
SELECT 'Community Health Center - Mumbai', '456 Health Lane, Mumbai', 'Mumbai', 'Maharashtra', '400001', '+91-22-87654321', ARRAY['General Medicine', 'Gynecology', 'Nutrition Counseling']
WHERE NOT EXISTS (
  SELECT 1 FROM public.phc_directory WHERE name = 'Community Health Center - Mumbai'
);
INSERT INTO public.phc_directory (name, address, city, state, pincode, phone, services)
SELECT 'Rural Health Center - Nashik', '789 Village Road, Nashik', 'Nashik', 'Maharashtra', '422001', '+91-253-9876543', ARRAY['General Medicine', 'Maternal Health', 'Community Health']
WHERE NOT EXISTS (
  SELECT 1 FROM public.phc_directory WHERE name = 'Rural Health Center - Nashik'
);

DO $$
DECLARE
  default_user UUID;
BEGIN
  SELECT id INTO default_user FROM auth.users LIMIT 1;
  IF default_user IS NOT NULL THEN
    INSERT INTO public.chat_rooms (name, description, is_public, created_by)
    SELECT 'General Wellness', 'General discussion about wellness and health', true, default_user
    WHERE NOT EXISTS (SELECT 1 FROM public.chat_rooms WHERE name = 'General Wellness');
    INSERT INTO public.chat_rooms (name, description, is_public, created_by)
    SELECT 'Menopause Support', 'Support group for menopause-related discussions', true, default_user
    WHERE NOT EXISTS (SELECT 1 FROM public.chat_rooms WHERE name = 'Menopause Support');
    INSERT INTO public.chat_rooms (name, description, is_public, created_by)
    SELECT 'Nutrition & Diet', 'Share healthy recipes and nutrition tips', true, default_user
    WHERE NOT EXISTS (SELECT 1 FROM public.chat_rooms WHERE name = 'Nutrition & Diet');
    INSERT INTO public.chat_rooms (name, description, is_public, created_by)
    SELECT 'Exercise & Fitness', 'Fitness routines and exercise discussions', true, default_user
    WHERE NOT EXISTS (SELECT 1 FROM public.chat_rooms WHERE name = 'Exercise & Fitness');
  END IF;
END $$;

-- Grants
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;
