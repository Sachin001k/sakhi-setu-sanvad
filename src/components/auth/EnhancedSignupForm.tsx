import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  Loader2, 
  Heart, 
  CheckCircle,
  Calendar,
  MapPin,
  Phone,
  Shield,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Check
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface FormData {
  // Basic Info
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  
  // Personal Details
  age: string;
  location: string;
  phone: string;
  emergencyContact: string;
  
  // Health Info
  medicalConditions: string[];
  currentMedications: string[];
  
  // Preferences
  preferredLanguage: string;
  notifications: boolean;
  dataSharing: boolean;
  
  // Terms
  agreedToTerms: boolean;
  agreedToPrivacy: boolean;
}

const EnhancedSignupForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const { signUp } = useAuth();

  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    location: '',
    phone: '',
    emergencyContact: '',
    medicalConditions: [],
    currentMedications: [],
    preferredLanguage: 'en',
    notifications: true,
    dataSharing: false,
    agreedToTerms: false,
    agreedToPrivacy: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = [
    { number: 1, title: 'Basic Info', description: 'Your account details' },
    { number: 2, title: 'Personal Details', description: 'About yourself' },
    { number: 3, title: 'Health Info', description: 'Medical background' },
    { number: 4, title: 'Preferences', description: 'App settings' },
    { number: 5, title: 'Review', description: 'Confirm details' }
  ];

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'hi', label: 'हिन्दी (Hindi)' },
    { value: 'mr', label: 'मराठी (Marathi)' }
  ];

  const medicalConditionsOptions = [
    'Diabetes', 'Hypertension', 'Heart Disease', 'Thyroid Issues',
    'Arthritis', 'Osteoporosis', 'Depression', 'Anxiety',
    'Migraine', 'Asthma', 'Other'
  ];

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
        if (!formData.password) newErrors.password = 'Password is required';
        else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        break;
      case 2:
        if (!formData.age) newErrors.age = 'Age is required';
        else if (parseInt(formData.age) < 18 || parseInt(formData.age) > 100) newErrors.age = 'Age must be between 18 and 100';
        if (!formData.location.trim()) newErrors.location = 'Location is required';
        break;
      case 3:
        // Health info is optional, no validation needed
        break;
      case 4:
        if (!formData.preferredLanguage) newErrors.preferredLanguage = 'Please select a language';
        break;
      case 5:
        if (!formData.agreedToTerms) newErrors.agreedToTerms = 'You must agree to the terms';
        if (!formData.agreedToPrivacy) newErrors.agreedToPrivacy = 'You must agree to the privacy policy';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) return;

    setSaving(true);
    try {
      const { data, error } = await signUp(formData.email, formData.password, {
        full_name: formData.fullName,
        age: parseInt(formData.age),
        location: formData.location,
        phone: formData.phone,
        emergency_contact: formData.emergencyContact,
        medical_conditions: formData.medicalConditions,
        current_medications: formData.currentMedications,
        preferred_language: formData.preferredLanguage,
        notifications_enabled: formData.notifications,
        data_sharing_consent: formData.dataSharing
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Account created successfully! Please check your email to verify your account.');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleArrayChange = (field: 'medicalConditions' | 'currentMedications', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const progress = (passwordStrength / 5) * 100;

  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      {/* Progress Bar - Mobile Responsive */}
      <div className="mb-6 md:mb-8">
        {/* Desktop Progress Bar */}
        <div className="hidden md:flex items-center justify-center mb-4">
          <div className="flex items-center max-w-md w-full">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step.number
                    ? 'bg-pink-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > step.number ? <Check className="w-4 h-4" /> : step.number}
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    currentStep > step.number ? 'bg-pink-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Progress Bar */}
        <div className="md:hidden mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Step {currentStep} of {steps.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((currentStep / steps.length) * 100)}%
            </span>
          </div>
          <Progress value={(currentStep / steps.length) * 100} className="h-2" />
        </div>

        <div className="text-center">
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
            {steps[currentStep - 1].title}
          </h3>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-300">
            {steps[currentStep - 1].description}
          </p>
        </div>
      </div>

      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
        <CardContent className="p-4 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Your Account</h2>
                    <p className="text-gray-600 dark:text-gray-300">Let's start with your basic information</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-sm md:text-base">Full Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="fullName"
                          value={formData.fullName}
                          onChange={(e) => handleInputChange('fullName', e.target.value)}
                          placeholder="Enter your full name"
                          className="pl-10 h-11 md:h-12 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-neon-pink focus:ring-neon-pink/20 text-black dark:text-white"
                        />
                      </div>
                      {errors.fullName && <p className="text-sm text-red-500">{errors.fullName}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm md:text-base">Email Address *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="Enter your email"
                          className="pl-10 h-11 md:h-12 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-neon-pink focus:ring-neon-pink/20 text-black dark:text-white"
                        />
                      </div>
                      {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm md:text-base">Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="Create a strong password"
                        className="pl-10 pr-10 h-11 md:h-12 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-neon-pink focus:ring-neon-pink/20 text-black dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {formData.password && (
                      <div className="space-y-2">
                        <Progress value={progress} className="h-2" />
                        <div className="flex justify-between text-xs">
                          <span className={passwordStrength >= 1 ? 'text-green-600' : 'text-gray-400'}>8+ characters</span>
                          <span className={passwordStrength >= 2 ? 'text-green-600' : 'text-gray-400'}>Uppercase</span>
                          <span className={passwordStrength >= 3 ? 'text-green-600' : 'text-gray-400'}>Lowercase</span>
                          <span className={passwordStrength >= 4 ? 'text-green-600' : 'text-gray-400'}>Number</span>
                          <span className={passwordStrength >= 5 ? 'text-green-600' : 'text-gray-400'}>Special</span>
                        </div>
                      </div>
                    )}
                    {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm md:text-base">Confirm Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        placeholder="Confirm your password"
                        className="pl-10 pr-10 h-11 md:h-12 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-neon-pink focus:ring-neon-pink/20 text-black dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
                  </div>
                </div>
              )}

              {/* Step 2: Personal Details */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Personal Details</h2>
                    <p className="text-gray-600 dark:text-gray-300">Tell us more about yourself</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="age" className="text-sm md:text-base">Age *</Label>
                      <Input
                        id="age"
                        type="number"
                        value={formData.age}
                        onChange={(e) => handleInputChange('age', e.target.value)}
                        placeholder="Enter your age"
                        min="18"
                        max="100"
                        className="h-11 md:h-12 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-neon-pink focus:ring-neon-pink/20 text-black dark:text-white"
                      />
                      {errors.age && <p className="text-sm text-red-500">{errors.age}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-sm md:text-base">Location *</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                          placeholder="City, State"
                          className="pl-10 h-11 md:h-12 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-neon-pink focus:ring-neon-pink/20 text-black dark:text-white"
                        />
                      </div>
                      {errors.location && <p className="text-sm text-red-500">{errors.location}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm md:text-base">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
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
                        value={formData.emergencyContact}
                        onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                        placeholder="Emergency contact name & number"
                        className="h-11 md:h-12 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-neon-pink focus:ring-neon-pink/20 text-black dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Health Info */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Heart className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Health Information</h2>
                    <p className="text-gray-600 dark:text-gray-300">Help us provide better recommendations</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-medium">Medical Conditions (Optional)</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Select any conditions you currently have</p>
                      <div className="flex flex-wrap gap-2 md:gap-3">
                        {medicalConditionsOptions.map((condition) => (
                          <button
                            key={condition}
                            type="button"
                            onClick={() => handleArrayChange('medicalConditions', condition)}
                            className={`px-3 py-2 md:px-4 md:py-2.5 rounded-lg text-xs md:text-sm border transition-all whitespace-nowrap flex-shrink-0 ${
                              formData.medicalConditions.includes(condition)
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
                        value={formData.currentMedications.join(', ')}
                        onChange={(e) => handleInputChange('currentMedications', e.target.value.split(',').map(m => m.trim()).filter(m => m))}
                        placeholder="List your current medications (comma separated)"
                        rows={3}
                        className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-neon-pink focus:ring-neon-pink/20 text-black dark:text-white text-sm md:text-base"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Preferences */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Preferences</h2>
                    <p className="text-gray-600 dark:text-gray-300">Customize your app experience</p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="language">Preferred Language *</Label>
                      <Select value={formData.preferredLanguage} onValueChange={(value) => handleInputChange('preferredLanguage', value)}>
                        <SelectTrigger className="bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 focus:border-pink-500 focus:ring-pink-500/20">
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
                      {errors.preferredLanguage && <p className="text-sm text-red-500">{errors.preferredLanguage}</p>}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">Push Notifications</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Receive reminders and updates</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleInputChange('notifications', !formData.notifications)}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            formData.notifications ? 'bg-pink-500' : 'bg-gray-300'
                          }`}
                        >
                          <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                            formData.notifications ? 'translate-x-6' : 'translate-x-0.5'
                          }`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">Data Sharing</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Help improve our AI recommendations</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleInputChange('dataSharing', !formData.dataSharing)}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            formData.dataSharing ? 'bg-pink-500' : 'bg-gray-300'
                          }`}
                        >
                          <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                            formData.dataSharing ? 'translate-x-6' : 'translate-x-0.5'
                          }`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Review */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Review Your Information</h2>
                    <p className="text-gray-600 dark:text-gray-300">Please review and confirm your details</p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      <div className="p-3 md:p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2 text-sm md:text-base">Basic Information</h4>
                        <div className="space-y-1">
                          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300">
                            <span className="font-medium">Name:</span> {formData.fullName}
                          </p>
                          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 break-all">
                            <span className="font-medium">Email:</span> {formData.email}
                          </p>
                          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300">
                            <span className="font-medium">Age:</span> {formData.age} years
                          </p>
                        </div>
                      </div>

                      <div className="p-3 md:p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2 text-sm md:text-base">Location & Contact</h4>
                        <div className="space-y-1">
                          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300">
                            <span className="font-medium">Location:</span> {formData.location}
                          </p>
                          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300">
                            <span className="font-medium">Phone:</span> {formData.phone || 'Not provided'}
                          </p>
                          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 break-words">
                            <span className="font-medium">Emergency:</span> {formData.emergencyContact || 'Not provided'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 md:p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2 text-sm md:text-base">Health Information</h4>
                      <div className="space-y-1">
                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300">
                          <span className="font-medium">Medical Conditions:</span> 
                          <span className="ml-1">
                            {formData.medicalConditions.length > 0 ? (
                              <span className="break-words">{formData.medicalConditions.join(', ')}</span>
                            ) : (
                              'None specified'
                            )}
                          </span>
                        </p>
                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300">
                          <span className="font-medium">Medications:</span> 
                          <span className="ml-1">
                            {formData.currentMedications.length > 0 ? (
                              <span className="break-words">{formData.currentMedications.join(', ')}</span>
                            ) : (
                              'None specified'
                            )}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="p-3 md:p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2 text-sm md:text-base">Preferences</h4>
                      <div className="space-y-1">
                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300">
                          <span className="font-medium">Language:</span> {languages.find(l => l.value === formData.preferredLanguage)?.label}
                        </p>
                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300">
                          <span className="font-medium">Notifications:</span> {formData.notifications ? 'Enabled' : 'Disabled'}
                        </p>
                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300">
                          <span className="font-medium">Data Sharing:</span> {formData.dataSharing ? 'Enabled' : 'Disabled'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="terms"
                        checked={formData.agreedToTerms}
                        onChange={(e) => handleInputChange('agreedToTerms', e.target.checked)}
                        className="mt-1 rounded border-gray-300 text-pink-500 focus:ring-pink-500"
                      />
                      <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-300">
                        I agree to the{' '}
                        <button type="button" className="text-pink-600 dark:text-pink-400 hover:underline">
                          Terms of Service
                        </button>
                      </label>
                    </div>
                    {errors.agreedToTerms && <p className="text-sm text-red-500">{errors.agreedToTerms}</p>}

                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="privacy"
                        checked={formData.agreedToPrivacy}
                        onChange={(e) => handleInputChange('agreedToPrivacy', e.target.checked)}
                        className="mt-1 rounded border-gray-300 text-pink-500 focus:ring-pink-500"
                      />
                      <label htmlFor="privacy" className="text-sm text-gray-600 dark:text-gray-300">
                        I agree to the{' '}
                        <button type="button" className="text-pink-600 dark:text-pink-400 hover:underline">
                          Privacy Policy
                        </button>
                      </label>
                    </div>
                    {errors.agreedToPrivacy && <p className="text-sm text-red-500">{errors.agreedToPrivacy}</p>}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons - Mobile Responsive */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 mt-6 md:mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex items-center justify-center gap-2 h-11 md:h-12 order-2 sm:order-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Back</span>
            </Button>

            {currentStep < 5 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white flex items-center justify-center gap-2 h-11 md:h-12 order-1 sm:order-2"
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">Continue</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white flex items-center justify-center gap-2 h-11 md:h-12 order-1 sm:order-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">Creating Account...</span>
                    <span className="sm:hidden">Creating...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Create Account</span>
                    <span className="sm:hidden">Create</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedSignupForm;
