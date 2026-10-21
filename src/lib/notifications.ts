import { supabase } from '@/integrations/supabase/client';

export type NotificationType = 'symptom' | 'community' | 'report' | 'reminder' | 'tip' | 'achievement';

export const NOTIFICATIONS_CHANGED_EVENT = 'refreshNotifications';

/**
 * Store a notification for the signed-in user and tell any mounted
 * NotificationBell to reload. Safe to call from any page.
 */
export async function createNotification(
  title: string,
  message: string,
  type: NotificationType | string,
  actionUrl?: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from('notifications').insert({
    user_id: user.id,
    title,
    message,
    type,
    is_read: false,
    action_url: actionUrl ?? null,
  });

  if (error) {
    console.error('Error creating notification:', error);
    return;
  }

  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
}
