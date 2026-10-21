import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Camera, 
  Upload, 
  X, 
  Loader2, 
  User,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { uploadAvatar, getAvatarUrl } from '@/lib/storage';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface AvatarUploadProps {
  currentAvatar?: string | null;
  onAvatarUpdate?: (avatarUrl: string) => void;
  size?: 'sm' | 'md' | 'lg';
  showUploadButton?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32'
};

const iconSizes = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-12 h-12'
};

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatar,
  onAvatarUpdate,
  size = 'md',
  showUploadButton = true,
  className = ''
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!user) {
      toast.error('Please log in to upload an avatar');
      return;
    }

    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      // Upload to Supabase storage
      const uploadResult = await uploadAvatar(file, user.id);
      
      if (uploadResult.error) {
        setError(uploadResult.error);
        toast.error(uploadResult.error);
        return;
      }

      if (!uploadResult.url) {
        setError('Failed to upload avatar');
        toast.error('Failed to upload avatar');
        return;
      }

      // Save the public URL on the profile row (creates the row if it is missing)
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert(
          { user_id: user.id, avatar_url: uploadResult.url, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );

      if (profileError) {
        console.error('Profile avatar update error:', profileError);
        setError('Failed to update profile');
        toast.error('Failed to update profile');
        return;
      }

      // Success
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      toast.success('Avatar updated successfully!');
      onAvatarUpdate?.(uploadResult.url);
      
    } catch (error) {
      console.error('Avatar upload error:', error);
      setError('Failed to upload avatar');
      toast.error('Failed to upload avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePreview = () => {
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayAvatar = previewUrl || currentAvatar || getAvatarUrl({ full_name: user?.user_metadata?.full_name });

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* Avatar Display */}
      <div className="relative">
        <Card className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700`}>
          <CardContent className="p-0 h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30">
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt="Profile Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className={`${iconSizes[size]} text-gray-400`} />
            )}
          </CardContent>
        </Card>

        {/* Upload Overlay */}
        {showUploadButton && (
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="absolute -bottom-2 -right-2"
          >
            <Button
              size="sm"
              className="w-8 h-8 rounded-full bg-purple-500 hover:bg-purple-600 text-white shadow-lg"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </Button>
          </motion.div>
        )}
      </div>

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Preview Actions */}
      {previewUrl && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2"
        >
          <Button
            onClick={handleUpload}
            disabled={isUploading}
            size="sm"
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </>
            )}
          </Button>
          <Button
            onClick={handleRemovePreview}
            variant="outline"
            size="sm"
            className="text-red-500 border-red-500 hover:bg-red-50"
          >
            <X className="w-4 h-4" />
          </Button>
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-red-500 text-sm"
        >
          <AlertCircle className="w-4 h-4" />
          {error}
        </motion.div>
      )}

      {/* Success Message */}
      {!error && !isUploading && previewUrl && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-green-500 text-sm"
        >
          <CheckCircle className="w-4 h-4" />
          Ready to upload
        </motion.div>
      )}
    </div>
  );
};

export default AvatarUpload;
