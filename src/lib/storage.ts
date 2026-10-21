import { supabase } from '@/integrations/supabase/client';

export interface UploadResult {
  data: { path: string } | null;
  error: Error | null;
}

export interface AvatarUploadResult {
  url: string | null;
  error: string | null;
}

/**
 * Upload avatar image to Supabase storage
 */
export const uploadAvatar = async (
  file: File,
  userId: string
): Promise<AvatarUploadResult> => {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return {
        url: null,
        error: 'Please select a valid image file'
      };
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        url: null,
        error: 'Image size must be less than 5MB'
      };
    }

    // Storage policies only allow writes inside the user's own folder
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/${Date.now()}.${fileExt}`;

    // Upload file to Supabase storage
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return {
        url: null,
        error: error.message
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return {
      url: urlData.publicUrl,
      error: null
    };
  } catch (error) {
    console.error('Avatar upload error:', error);
    return {
      url: null,
      error: 'Failed to upload avatar. Please try again.'
    };
  }
};

/**
 * Delete avatar from Supabase storage
 */
export const deleteAvatar = async (avatarUrl: string): Promise<boolean> => {
  try {
    // Public URLs look like .../storage/v1/object/public/avatars/<user id>/<file>
    const marker = '/object/public/avatars/';
    const { pathname } = new URL(avatarUrl);
    const markerIndex = pathname.indexOf(marker);
    if (markerIndex === -1) return false;
    const filePath = decodeURIComponent(pathname.slice(markerIndex + marker.length));

    const { error } = await supabase.storage
      .from('avatars')
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Avatar delete error:', error);
    return false;
  }
};

/**
 * Get avatar URL from user profile
 */
export const getAvatarUrl = (
  profile: { avatar_url?: string | null; full_name?: string | null } | null | undefined
): string | null => {
  if (profile?.avatar_url) {
    return profile.avatar_url;
  }
  
  // Generate default avatar using user's initials
  if (profile?.full_name) {
    const initials = profile.full_name
      .split(' ')
      .map((name: string) => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    
    // You can use a service like UI Avatars or create a default avatar
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random&color=fff&size=200`;
  }
  
  return null;
};

/**
 * Update user profile with avatar URL
 */
export const updateProfileAvatar = async (
  userId: string,
  avatarUrl: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Upsert: the profile row may not exist yet for older accounts
    const { error } = await supabase
      .from('user_profiles')
      .upsert({ user_id: userId, avatar_url: avatarUrl }, { onConflict: 'user_id' });

    if (!error) {
      // Keep users.avatar_url in sync so author avatars elsewhere match
      await supabase.from('users').update({ avatar_url: avatarUrl }).eq('id', userId);
    }

    if (error) {
      console.error('Profile update error:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Profile avatar update error:', error);
    return {
      success: false,
      error: 'Failed to update profile avatar'
    };
  }
};
