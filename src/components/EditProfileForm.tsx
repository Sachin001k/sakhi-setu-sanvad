import React, { useState, useEffect } from 'react';
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
  userProfile?: any;
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

  useEffect(() => {
    if (propUserProfile) {
      // Use prop data if available
      setProfile({
        full_name: (propUserProfile as any).full_name || '',
        age: (propUserProfile as any).age || undefined,
        location: (propUserProfile as any).location || '',
        phone: (propUserProfile as any).phone || '',
        emergency_contact: (propUserProfile as any).emergency_contact || '',
        medical_conditions: (propUserProfile as any).medical_conditions || [],
        current_medications: (propUserProfile as any).current_medications || [],
        preferred_language: (propUserProfile as any).preferred_language || 'en',
        avatar_url: (propUserProfile as any).avatar_url || '',
        bio: (propUserProfile as any).bio || ''
      });
      setLoading(false);
    } else if (user) {
      fetchProfile();
    }
  }, [user, propUserProfile]);

  const fetchProfile = async () => {
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
          .single()
      ]);

      if (usersResult.error) throw usersResult.error;

      const userData = usersResult.data;
      const profileData = profilesResult.data;

      if (userData) {
        setProfile({
          full_name: (userData as any).full_name || '',
          age: (userData as any).age || undefined,
          location: (userData as any).location || '',
          phone: (userData as any).phone || '',
          emergency_contact: (userData as any).emergency_contact || '',
          medical_conditions: (userData as any).medical_conditions || [],
          current_medications: (userData as any).current_medications || [],
          preferred_language: (userData as any).preferred_language || 'en',
          avatar_url: (userData as any).avatar_url || '',
          bio: (profileData as any)?.bio || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: any) => {
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
      
      // Update users table
      const updateData = {
        full_name: profile.full_name,
        age: profile.age,
        location: profile.location,
        phone: profile.phone,
        emergency_contact: profile.emergency_contact,
        medical_conditions: profile.medical_conditions,
        current_medications: profile.current_medications,
        preferred_language: profile.preferred_language,
        avatar_url: profile.avatar_url,
        updated_at: new Date().toISOString()
      };

      const { error: usersError } = await (supabase as any)
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      if (usersError) throw usersError;

      // Update or create user_profiles table
      const profileData = {
        bio: profile.bio,
        location: profile.location,
        avatar_url: profile.avatar_url,
        updated_at: new Date().toISOString()
      };

      // First try to update existing record
      const { error: updateError } = await (supabase as any)
        .from('user_profiles')
        .update(profileData)
        .eq('user_id', user.id);

      // If no record exists (PGRST116 = no rows found), create one
      if (updateError && updateError.code === 'PGRST116') {
        console.log('No existing user_profiles record found, creating new one...');
        const { error: insertError } = await (supabase as any)
          .from('user_profiles')
          .insert({
            user_id: user.id,
            ...profileData
          });
        
        if (insertError) {
          console.error('Error creating user_profiles record:', insertError);
          throw insertError;
        }
        console.log('Successfully created user_profiles record');
      } else if (updateError) {
        console.error('Error updating user_profiles record:', updateError);
        throw updateError;
      } else {
        console.log('Successfully updated user_profiles record');
      }

      toast.success('Profile updated successfully!');
      
      // Create notification for profile update
      if ((window as any).createNotification) {
        (window as any).createNotification(
          'Profile Updated',
          'Your profile information has been updated successfully',
          'profile',
          '/profile?tab=edit'
        );
      }
      
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
          <CardTitle className="flex items-center gap-2 text-xl">
            <User className="h-6 w-6 text-pink-500" />
            Edit Profile
          </CardTitle>
          <CardDescription>
            Update your personal information and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Information</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm md:text-base">Full Name *</Label>
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
                  <Label htmlFor="age" className="text-sm md:text-base">Age</Label>
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
                <Label htmlFor="location" className="text-sm md:text-base">Location *</Label>
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
                <Label htmlFor="bio" className="text-sm md:text-base">About Me</Label>
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Contact Information</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm md:text-base">Phone Number</Label>
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
                <Label htmlFor="emergencyContact" className="text-sm md:text-base">Emergency Contact</Label>
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Health Information</h3>
              
              <div>
                <Label className="text-sm md:text-base">Medical Conditions (Optional)</Label>
                <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">Select any conditions you currently have</p>
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
                <Label htmlFor="medications" className="text-sm md:text-base">Current Medications (Optional)</Label>
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Preferences</h3>
              
              <div className="space-y-2">
                <Label htmlFor="language" className="text-sm md:text-base">Preferred Language</Label>
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
