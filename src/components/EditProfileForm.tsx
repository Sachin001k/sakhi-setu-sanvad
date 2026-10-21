import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  User, 
  Mail, 
  MapPin, 
  Phone, 
  Calendar,
  Save,
  Loader2,
  FileText
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { createNotification } from '@/lib/notifications';

interface UserProfile {
  full_name: string;
  age?: number;
  location?: string;
  phone?: string;
  emergency_contact?: string;
  medical_conditions?: string[];
  current_medications?: string[];
  preferred_language?: string;
  avatar_url?: string;
  bio?: string;
}

interface EditProfileFormProps {
  userProfile?: Partial<UserProfile> | null;
  onProfileUpdate?: () => void;
}

export const EditProfileForm: React.FC<EditProfileFormProps> = ({ userProfile: propUserProfile, onProfileUpdate }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    full_name: '',
    age: undefined,
    location: '',
    phone: '',
    emergency_contact: '',
    medical_conditions: [],
    current_medications: [],
    preferred_language: 'en',
    avatar_url: '',
    bio: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'hi', label: 'Hindi' },
    { value: 'mr', label: 'Marathi' }
  ];

  const medicalConditionsOptions = [
    'Diabetes', 'Hypertension', 'Heart Disease', 'Thyroid', 'Arthritis', 
    'Osteoporosis', 'Depression', 'Anxiety', 'Migraine', 'Asthma', 'Other'
  ];

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      // Fetch from both users and user_profiles tables
      const [usersResult, profilesResult] = await Promise.all([
        supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
          .single(),
        supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()
      ]);

      if (usersResult.error) throw usersResult.error;

      const userData = usersResult.data;
      const profileData = profilesResult.data;

      if (userData) {
        setProfile({
          full_name: userData.full_name || '',
          age: userData.age ?? undefined,
          location: userData.location || '',
          phone: userData.phone || '',
          emergency_contact: userData.emergency_contact || '',
          medical_conditions: userData.medical_conditions || [],
          current_medications: userData.current_medications || [],
          preferred_language: userData.preferred_language || 'en',
          avatar_url: userData.avatar_url || '',
          bio: profileData?.bio || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (propUserProfile) {
      // Use prop data if available
      setProfile({
        full_name: propUserProfile.full_name || '',
        age: propUserProfile.age || undefined,
        location: propUserProfile.location || '',
        phone: propUserProfile.phone || '',
        emergency_contact: propUserProfile.emergency_contact || '',
        medical_conditions: propUserProfile.medical_conditions || [],
        current_medications: propUserProfile.current_medications || [],
        preferred_language: propUserProfile.preferred_language || 'en',
        avatar_url: propUserProfile.avatar_url || '',
        bio: propUserProfile.bio || ''
      });
      setLoading(false);
    } else if (user) {
      fetchProfile();
    }
  }, [user, propUserProfile, fetchProfile]);

  const handleInputChange = <K extends keyof UserProfile>(field: K, value: UserProfile[K]) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleArrayChange = (field: 'medical_conditions' | 'current_medications', value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: prev[field]?.includes(value)
        ? prev[field]?.filter(item => item !== value)
        : [...(prev[field] || []), value]
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!profile.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    if (profile.age && (profile.age < 18 || profile.age > 100)) {
      newErrors.age = 'Age must be between 18 and 100';
    }

    if (!profile.location?.trim()) {
      newErrors.location = 'Location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !validateForm()) return;

    try {
      setSaving(true);
      
      // Update users table. The avatar is managed by the avatar uploader
      // (user_profiles.avatar_url), so it is not written from this form.
      const updateData = {
        full_name: profile.full_name,
        age: profile.age ?? null,
        location: profile.location,
        phone: profile.phone,
        emergency_contact: profile.emergency_contact,
        medical_conditions: profile.medical_conditions,
        current_medications: profile.current_medications,
        preferred_language: profile.preferred_language,
        updated_at: new Date().toISOString()
      };

      const { data: updatedUsers, error: usersError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id)
        .select('id');

      if (usersError) throw usersError;
      if (!updatedUsers || updatedUsers.length === 0) {
        throw new Error('Your account record was not found. Please sign out and sign in again.');
      }

      // Create the user_profiles row if it does not exist yet, otherwise update it
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert(
          {
            user_id: user.id,
            bio: profile.bio,
            location: profile.location,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id' }
        );

      if (profileError) throw profileError;

      toast.success('Profile updated successfully!');

      window.dispatchEvent(new CustomEvent('preferredLanguageUpdated', {
        detail: { language: profile.preferred_language }
      }));

      createNotification(
        'Profile Updated',
        'Your profile information has been updated successfully',
        'profile',
        '/profile?tab=edit'
      );

      if (onProfileUpdate) {
        onProfileUpdate();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
          <p className="text-gray-600 dark:text-gray-300">Loading profile...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-gray-800 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-white">
            <User className="h-6 w-6 text-pink-500" />
            Edit Profile
          </CardTitle>
          <CardDescription className="text-white/80">
            Update your personal information and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Basic Information</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm md:text-base text-white">Full Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="fullName"
                      value={profile.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      placeholder="Enter your full name"
                      className="pl-10 h-11 md:h-12 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-neon-pink focus:ring-neon-pink/20 text-black dark:text-white"
                    />
                  </div>
                  {errors.full_name && <p className="text-sm text-red-500">{errors.full_name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age" className="text-sm md:text-base text-white">Age</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="age"
                      type="number"
                      value={profile.age || ''}
                      onChange={(e) => handleInputChange('age', e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="Enter your age"
                      min="18"
                      max="100"
                      className="pl-10 h-11 md:h-12 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-neon-pink focus:ring-neon-pink/20 text-black dark:text-white"
                    />
                  </div>
                  {errors.age && <p className="text-sm text-red-500">{errors.age}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm md:text-base text-white">Location *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="location"
                    value={profile.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="City, State"
                    className="pl-10 h-11 md:h-12 bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 focus:border-pink-500 focus:ring-pink-500/20"
                  />
                </div>
                {errors.location && <p className="text-sm text-red-500">{errors.location}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-sm md:text-base text-white">About Me</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                  <Textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    className="pl-10 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-neon-pink focus:ring-neon-pink/20 text-black dark:text-white resize-none"
                  />
                </div>
                {errors.bio && <p className="text-sm text-red-500">{errors.bio}</p>}
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Contact Information</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm md:text-base text-white">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="phone"
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Your phone number"
                      className="pl-10 h-11 md:h-12 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-neon-pink focus:ring-neon-pink/20 text-black dark:text-white"
                    />
                  </div>
                </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContact" className="text-sm md:text-base text-white">Emergency Contact</Label>
                <Input
                  id="emergencyContact"
                  value={profile.emergency_contact}
                  onChange={(e) => handleInputChange('emergency_contact', e.target.value)}
                  placeholder="Emergency contact name & number"
                  className="h-11 md:h-12 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-neon-pink focus:ring-neon-pink/20 text-black dark:text-white"
                />
              </div>
            </div>
          </div>


            {/* Health Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Health Information</h3>
              
              <div>
                <Label className="text-sm md:text-base text-white">Medical Conditions (Optional)</Label>
                <p className="text-xs text-white/80 mb-3">Select any conditions you currently have</p>
                <div className="flex flex-wrap gap-2 md:gap-3">
                  {medicalConditionsOptions.map((condition) => (
                    <button
                      key={condition}
                      type="button"
                      onClick={() => handleArrayChange('medical_conditions', condition)}
                      className={`px-3 py-2 md:px-4 md:py-2.5 rounded-lg text-xs md:text-sm border transition-all whitespace-nowrap flex-shrink-0 ${
                        profile.medical_conditions?.includes(condition)
                          ? 'bg-pink-100 border-pink-500 text-pink-700 dark:bg-pink-900/30 dark:border-pink-400 dark:text-pink-300'
                          : 'bg-gray-100 border-gray-200 text-gray-900 hover:bg-gray-200 hover:text-gray-950 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600 dark:hover:text-white'
                      }`}
                    >
                      {condition}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="medications" className="text-sm md:text-base text-white">Current Medications (Optional)</Label>
                <Textarea
                  id="medications"
                  value={profile.current_medications?.join(', ') || ''}
                  onChange={(e) => handleInputChange('current_medications', e.target.value.split(',').map(m => m.trim()).filter(m => m))}
                  placeholder="List your current medications (comma separated)"
                  rows={3}
                  className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-neon-pink focus:ring-neon-pink/20 text-black dark:text-white text-sm md:text-base"
                />
              </div>
            </div>

            {/* Preferences */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Preferences</h3>
              
              <div className="space-y-2">
                <Label htmlFor="language" className="text-sm md:text-base text-white">Preferred Language</Label>
                <Select value={profile.preferred_language} onValueChange={(value) => handleInputChange('preferred_language', value)}>
                  <SelectTrigger className="h-11 md:h-12 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-neon-pink focus:ring-neon-pink/20 text-black dark:text-white">
                    <SelectValue placeholder="Select your preferred language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">

              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-8 h-11 md:h-12"
              >
                {saving ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Save Changes
                  </div>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
