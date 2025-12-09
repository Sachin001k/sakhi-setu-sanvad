-- Create a dedicated table for landing page contact submissions
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'landing_page',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
