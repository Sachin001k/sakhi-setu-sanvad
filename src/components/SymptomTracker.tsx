import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useGemini } from '@/hooks/useGemini';
import { toast } from 'sonner';
import { 
  Calendar, 
  TrendingUp, 
  Activity, 
  Heart,
  Moon,
  Brain,
  Thermometer,
  Zap,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
  BarChart3,
  Clock,
  Target,
  Bot,
  Send,
  MessageCircle,
  Volume2,
  X,
  Archive
} from 'lucide-react';

const symptomTypes = [
  { value: 'hot_flashes', label: 'Hot Flashes', icon: Thermometer, color: 'text-red-500' },
  { value: 'night_sweats', label: 'Night Sweats', icon: Moon, color: 'text-blue-500' },
  { value: 'mood_swings', label: 'Mood Swings', icon: Heart, color: 'text-pink-500' },
  { value: 'sleep_issues', label: 'Sleep Issues', icon: Moon, color: 'text-purple-500' },
  { value: 'anxiety', label: 'Anxiety', icon: Brain, color: 'text-orange-500' },
  { value: 'depression', label: 'Depression', icon: Heart, color: 'text-indigo-500' },
  { value: 'headaches', label: 'Headaches', icon: Zap, color: 'text-yellow-500' },
  { value: 'joint_pain', label: 'Joint Pain', icon: Activity, color: 'text-green-500' },
  { value: 'weight_gain', label: 'Weight Gain', icon: Target, color: 'text-cyan-500' },
  { value: 'memory_issues', label: 'Memory Issues', icon: Brain, color: 'text-amber-500' },
  { value: 'vaginal_dryness', label: 'Vaginal Dryness', icon: Heart, color: 'text-rose-500' },
  { value: 'irregular_periods', label: 'Irregular Periods', icon: Calendar, color: 'text-pink-500' },
  { value: 'fatigue', label: 'Fatigue', icon: Activity, color: 'text-gray-500' },
  { value: 'irritability', label: 'Irritability', icon: Zap, color: 'text-red-600' },
  { value: 'breast_tenderness', label: 'Breast Tenderness', icon: Heart, color: 'text-pink-600' }
];
const symptomLabelMap = Object.fromEntries(symptomTypes.map(({ value, label }) => [value, label]));

const formatSymptomLabel = (symptomKey: string) => {
  if (!symptomKey) {
    return 'Unknown symptom';
  }
  return symptomLabelMap[symptomKey] ?? symptomKey.replace(/_/g, ' ');
};

const symptomDetailInputs: Record<string, {
  label: string;
  placeholder: string;
  unit?: string;
  helperText?: string;
  inputType?: React.HTMLInputTypeAttribute;
  min?: number;
  max?: number;
  step?: number;
}> = {
  weight_gain: {
    label: 'Weight Change',
    placeholder: 'Enter change in kg (use - for loss)',
    unit: 'kg',
    helperText: 'Positive numbers for gain, negative numbers for loss.',
    inputType: 'number',
    min: -20,
    max: 20,
    step: 0.1
  },
  sleep_issues: {
    label: 'Hours Slept',
    placeholder: 'e.g. 5.5',
    unit: 'hrs',
    helperText: 'Approximate total sleep in the last night.',
    inputType: 'number',
    min: 0,
    max: 14,
    step: 0.5
  },
  hot_flashes: {
    label: 'Episodes in 24h',
    placeholder: 'Number of hot flashes',
    helperText: 'Estimate how many episodes occurred today.',
    inputType: 'number',
    min: 0,
    max: 50,
    step: 1
  },
  mood_swings: {
    label: 'Mood trigger or note',
    placeholder: 'e.g. stress, meeting, etc.',
    helperText: 'Optional quick context about what influenced your mood.',
    inputType: 'text'
  }
};

const speechLanguageOverrides: Record<string, string> = {
  en: 'en-US',
  hi: 'hi-IN',
  mr: 'mr-IN',
  bn: 'bn-IN',
  gu: 'gu-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  pa: 'pa-IN',
  ur: 'ur-IN'
};

const resolveSpeechLanguageCode = (language?: string) => {
  if (!language) return 'en-US';
  const normalized = language.split('-')[0].toLowerCase();
  if (speechLanguageOverrides[normalized]) {
    return speechLanguageOverrides[normalized];
  }
  if (language.includes('-')) {
    return language;
  }
  return `${normalized}-${normalized === 'en' ? 'US' : 'IN'}`;
};

export const SymptomTracker: React.FC = () => {
  const { user } = useAuth();
  const [symptoms, setSymptoms] = useState<any[]>([]);
  const [selectedSymptom, setSelectedSymptom] = useState('');
  const [severity, setSeverity] = useState([5]);
  const [notes, setNotes] = useState('');
  const [symptomSpecificValues, setSymptomSpecificValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [showAiChat, setShowAiChat] = useState(false);
  const [stats, setStats] = useState({
    totalEntries: 0,
    averageSeverity: 0,
    mostCommonSymptom: '',
    recentTrend: 'stable'
  });
  const [preferredLanguage, setPreferredLanguage] = useState<string>(() => {
    return (user?.user_metadata?.preferred_language as string) || 'en';
  });
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);
  const [speechSupported, setSpeechSupported] = useState(false);
  const { 
    isLoading: aiLoading, 
    generateWellnessAdvice, 
    analyzeSymptoms
  } = useGemini({
    onSuccess: (response) => setAiResponse(response),
    onError: (error) => console.error('AI Error:', error)
  });

  useEffect(() => {
    if (user) {
      fetchSymptoms();
    }
  }, [user]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechSynthesis(window.speechSynthesis);
      setSpeechSupported(true);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const loadPreferredLanguage = async () => {
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('preferred_language')
          .eq('id', user.id)
          .single();

        if (!userError && userData?.preferred_language) {
          setPreferredLanguage(userData.preferred_language);
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('preferred_language')
          .eq('user_id', user.id)
          .single();

        if (!profileError && profileData?.preferred_language) {
          setPreferredLanguage(profileData.preferred_language);
        }
      } catch (error) {
        console.error('Error fetching preferred language:', error);
      }
    };

    loadPreferredLanguage();
  }, [user]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{ language?: string }>;
      if (customEvent.detail?.language) {
        setPreferredLanguage(customEvent.detail.language);
      }
    };

    window.addEventListener('preferredLanguageUpdated', handler as EventListener);
    return () => {
      window.removeEventListener('preferredLanguageUpdated', handler as EventListener);
    };
  }, []);

  const fetchSymptoms = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('symptoms')
        .select('*')
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: false })
        .limit(50);

      if (error) {
        if (error.code === 'PGRST205') {
          toast.error('Database tables not found. Please run the Supabase setup script first.');
          console.error('Database setup required. Run the SQL script in Supabase dashboard.');
          return;
        }
        throw error;
      }
      setSymptoms(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error fetching symptoms:', error);
      toast.error('Failed to load symptoms. Please check your database connection.');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (symptomData: any[]) => {
    if (symptomData.length === 0) {
      // Set empty stats for new users - no premade data
      setStats({
        totalEntries: 0,
        averageSeverity: 0,
        mostCommonSymptom: '',
        recentTrend: 'stable'
      });
      return;
    }

    const totalEntries = symptomData.length;
    const averageSeverity = symptomData.reduce((sum, s) => sum + s.severity, 0) / totalEntries;
    
    // Find most common symptom
    const symptomCounts: { [key: string]: number } = {};
    symptomData.forEach(s => {
      symptomCounts[s.symptom_type] = (symptomCounts[s.symptom_type] || 0) + 1;
    });
    const mostCommonSymptom = Object.entries(symptomCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

    // Calculate trend based on overall average severity (not comparing recent vs older)
    // Take every log's severity, calculate overall average, then categorize
    let recentTrend = 'stable';
    
    if (symptomData.length > 0) {
      // Calculate overall average of all symptom severities
      const overallAverage = averageSeverity; // Already calculated above
      
      // Categorize based on average severity range (1-10 scale)
      if (overallAverage < 2) {
        recentTrend = 'stable';
      } else if (overallAverage >= 2 && overallAverage < 5) {
        recentTrend = 'moderate';
      } else if (overallAverage >= 5 && overallAverage < 7.5) {
        recentTrend = 'severe';
      } else if (overallAverage >= 7.5) {
        recentTrend = 'worsening';
      }
    }

    setStats({
      totalEntries,
      averageSeverity: Math.round(averageSeverity * 10) / 10,
      mostCommonSymptom,
      recentTrend
    });
  };

  const speakSymptomName = (label: string, severityValue?: number) => {
    if (!speechSynthesis) return;
    try {
      speechSynthesis.cancel();
      const textToSpeak = severityValue
        ? `${label}. Severity ${severityValue} out of ten.`
        : label;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = resolveSpeechLanguageCode(preferredLanguage);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Speech synthesis error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedSymptom) return;

    setSaving(true);
    try {
      const symptomKey = selectedSymptom;
      const detailConfig = symptomKey ? symptomDetailInputs[symptomKey] : undefined;
      const detailValue = symptomKey && detailConfig ? symptomSpecificValues[symptomKey]?.trim() : '';
      const formattedDetail = detailConfig && detailValue
        ? `${detailConfig.label}${detailConfig.unit ? ` (${detailConfig.unit})` : ''}: ${detailValue}`
        : '';
      const combinedNotes = [notes?.trim(), formattedDetail].filter(Boolean).join('\n');

      const { error } = await supabase
        .from('symptoms')
        .insert({
          user_id: user.id,
          symptom_type: selectedSymptom,
          severity: severity[0],
          notes: combinedNotes || null,
          recorded_at: new Date().toISOString(),
        } as any);

      if (error) {
        if (error.code === 'PGRST205') {
          toast.error('Database tables not found. Please run the Supabase setup script first.');
          console.error('Database setup required. Run the SQL script in Supabase dashboard.');
          return;
        }
        throw error;
      }

      toast.success('Symptom recorded successfully!', {
        description: 'Your data has been saved and will be used for AI insights.'
      });

      // Create notification for symptom logging
      if ((window as any).createNotification) {
        const symptomLabel = symptomTypes.find(s => s.value === selectedSymptom)?.label || selectedSymptom;
        (window as any).createNotification(
          'Symptom Tracked',
          `${symptomLabel} (Severity: ${severity[0]}/10) recorded successfully`,
          'symptom',
          '/tracker'
        );
      }

      setSelectedSymptom('');
      setSeverity([5]);
      setNotes('');
      if (symptomKey) {
        setSymptomSpecificValues((prev) => {
          const updated = { ...prev };
          delete updated[symptomKey];
          return updated;
        });
      }
      fetchSymptoms();
    } catch (error) {
      console.error('Error recording symptom:', error);
      toast.error('Failed to record symptom. Please check your database connection.');
    } finally {
      setSaving(false);
    }
  };

  const handleSymptomSelect = (value: string) => {
    setSelectedSymptom(value);
    const symptomLabel = symptomTypes.find(s => s.value === value)?.label;
    if (symptomLabel) {
      speakSymptomName(symptomLabel);
    }
  };

  const currentDetailConfig = selectedSymptom ? symptomDetailInputs[selectedSymptom] : undefined;
  const currentDetailValue = selectedSymptom && currentDetailConfig
    ? symptomSpecificValues[selectedSymptom] || ''
    : '';

  const handleDeleteSymptom = async (symptomId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('symptoms')
        .delete()
        .eq('id', symptomId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting symptom:', error);
        toast.error('Failed to delete symptom entry.');
        return;
      }

      toast.success('Symptom entry cleared', {
        description: 'The entry has been removed from your records.'
      });

      // Refresh symptoms list
      fetchSymptoms();
    } catch (error) {
      console.error('Error deleting symptom:', error);
      toast.error('Failed to delete symptom entry.');
    }
  };

  const handleClearAllSymptoms = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('symptoms')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error clearing all symptoms:', error);
        toast.error('Failed to clear all symptoms.');
        return;
      }

      toast.success('All symptoms cleared', {
        description: 'All symptom entries have been removed from your records.'
      });

      // Refresh symptoms list
      fetchSymptoms();
    } catch (error) {
      console.error('Error clearing all symptoms:', error);
      toast.error('Failed to clear all symptoms.');
    }
  };

  const getSeverityLabel = (value: number) => {
    if (value <= 2) return 'Mild';
    if (value <= 4) return 'Moderate';
    if (value <= 6) return 'Moderate-Severe';
    if (value <= 8) return 'Severe';
    return 'Very Severe';
  };

  const getSeverityColor = (value: number) => {
    if (value <= 2) return 'text-green-600 bg-green-100';
    if (value <= 4) return 'text-yellow-600 bg-yellow-100';
    if (value <= 6) return 'text-orange-600 bg-orange-100';
    if (value <= 8) return 'text-red-600 bg-red-100';
    return 'text-red-800 bg-red-200';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'worsening': return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
      case 'severe': return <TrendingUp className="w-4 h-4 text-orange-500 rotate-180" />;
      case 'moderate': return <Activity className="w-4 h-4 text-yellow-500" />;
      default: return <Activity className="w-4 h-4 text-blue-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-600';
      case 'worsening': return 'text-red-600';
      case 'severe': return 'text-orange-600';
      case 'moderate': return 'text-yellow-600';
      default: return 'text-blue-600';
    }
  };

  const handleDetailInputChange = (symptomKey: string, value: string) => {
    setSymptomSpecificValues((prev) => ({
      ...prev,
      [symptomKey]: value
    }));
  };

  const buildGeminiFallbackMessage = () => {
    const sortedSymptoms = [...symptoms].sort((a, b) => (Number(b.severity) || 0) - (Number(a.severity) || 0));
    const symptomLines = sortedSymptoms.map((symptom) => {
      const severityValue = Math.max(0, Math.min(10, Number(symptom.severity) || 0));
      const severityLabel = getSeverityLabel(severityValue);
      return `• ${formatSymptomLabel(symptom.symptom_type)} — ${severityLabel} (${severityValue}/10)`;
    });

    const symptomHeader = sortedSymptoms.length > 0
      ? `Symptoms sorted by severity (highest first):\n${symptomLines.join('\n')}`
      : 'No symptoms logged yet; please add a symptom entry to unlock more tailored guidance.';

    const trackedSymptomNames = sortedSymptoms.length > 0
      ? sortedSymptoms.map((symptom) => formatSymptomLabel(symptom.symptom_type)).join(', ')
      : 'no symptoms currently tracked';

    const averageSeverityLine = `Average severity across logged symptoms: ${stats.averageSeverity}/10.`;

    const guidanceSections = [
      '',
      `As a menopause health advisor, I can offer general guidance based on the symptoms you've described (${trackedSymptomNames}). ${averageSeverityLine}`,
      '',
      '1. Possible General Causes',
      '* Hormonal Fluctuations: Shifts in estrogen and progesterone during menopause can impact metabolism, inflammation, and sleep.',
      '* Metabolic Changes: Lower estrogen levels can slow metabolism, making weight gain easier and energy harder to sustain.',
      '* Inflammation: Hormonal changes can increase inflammatory sensitivity, which may show up as joint pain or tenderness.',
      '* Lifestyle Factors: Stress, diet, and activity level shifts that often accompany midlife transitions can magnify these symptoms.',
      '',
      '2. When to Seek Medical Attention',
      '* Symptoms worsen significantly or new concerning symptoms emerge.',
      '* Pain becomes severe, limits mobility, or is accompanied by redness or swelling.',
      '* Sleep issues are so disruptive they affect daily focus, mood, or energy.',
      '* You have concerns about underlying conditions or a personal/family history of serious disease.',
      '* You want a personalized management plan that may include treatments, supplements, or therapies.',
      '',
      '3. General Self-Care Recommendations',
      '* For Weight Gain:',
      '  * Balanced Diet: Favor whole foods—fruits, vegetables, lean proteins, and whole grains—while limiting processed or sugary items.',
      '  * Portion Control: Be mindful of portions to keep calorie intake aligned with your energy needs.',
      '  * Regular Physical Activity: Pair aerobic exercise (walking, swimming, cycling) with strength training to support metabolism.',
      '* For Joint Pain:',
      '  * Gentle Exercise: Water aerobics, yoga, tai chi, or stretching can protect joints while improving strength.',
      '  * Maintain a Healthy Weight: Every pound less lessens pressure on weight-bearing joints.',
      '  * Heat or Cold Therapy: Experiment with warm baths or ice packs to ease inflammation and discomfort.',
      '* For Sleep Issues:',
      '  * Sleep Hygiene: Keep a consistent bedtime, reduce screens before sleep, and create a cool, dark environment.',
      '  * Wind-Down Rituals: Mindful breathing, light stretching, or journaling can cue your body that rest is near.',
      '  * Limit Caffeine & Alcohol: These can interfere with deeper sleep cycles, especially later in the day.',
      '',
      'Remember: This is not a medical diagnosis. Please consult your healthcare provider for personalized advice and before starting any new treatment plan.'
    ];

    return `${symptomHeader}\n\n${guidanceSections.join('\n')}`;
  };

  const applyGeminiFallbackAdvice = (error: unknown) => {
    const status = typeof error === 'object' && error !== null ? (error as { status?: number }).status : undefined;
    if (typeof status === 'number' && status >= 400) {
      setAiResponse(buildGeminiFallbackMessage());
      setShowAiChat(true);
      return true;
    }
    return false;
  };

  const handleAiQuery = async () => {
    if (!aiQuery.trim()) return;

    try {
      // Build context based ONLY on symptoms and severity, not trends
      const symptomContext = symptoms.length > 0 
        ? `Current logged symptoms: ${symptoms.map(s => `${s.symptom_type.replace('_', ' ')} (severity: ${s.severity}/10)`).join(', ')}. Average severity: ${stats.averageSeverity}/10.`
        : 'No symptoms logged yet.';
      
      const enhancedQuery = `${aiQuery}\n\nContext: ${symptomContext} Please provide recommendations based ONLY on the symptoms and their severity levels, not on trends.`;
      
      const response = await generateWellnessAdvice(enhancedQuery, {
        age: 45,
        symptoms: symptoms.map(s => s.symptom_type),
        concerns: ['symptom management', 'wellness optimization']
      });
      // Format response by removing markdown formatting
      const formattedResponse = response
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold formatting
        .replace(/\*(.*?)\*/g, '$1') // Remove italic formatting
        .replace(/#{1,6}\s*/g, '') // Remove headers
        .replace(/\n{3,}/g, '\n\n') // Reduce multiple line breaks
        .trim();
      
      setAiResponse(formattedResponse);
      setShowAiChat(true);
      
      // Auto-scroll to AI response after a short delay
      setTimeout(() => {
        const aiResponseElement = document.querySelector('[data-ai-response]');
        if (aiResponseElement) {
          aiResponseElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }, 300);
    } catch (error) {
      const fallbackApplied = applyGeminiFallbackAdvice(error);
      if (fallbackApplied) {
        return;
      }
      console.error('Error generating AI response:', error);
      toast.error('Failed to generate AI response');
    }
  };

  const handleSymptomAnalysis = async () => {
    if (symptoms.length === 0) {
      toast.error('No symptoms to analyze. Please track some symptoms first.');
      return;
    }

    try {
      // Create detailed symptom analysis based ONLY on symptoms and severity (NOT trends)
      const symptomDetails = symptoms.map(s => {
        const symptomName = s.symptom_type.replace('_', ' ');
        return `${symptomName} with severity ${s.severity}/10`;
      }).join(', ');
      
      const highSeverity = symptoms.filter(s => s.severity >= 7);
      const mediumSeverity = symptoms.filter(s => s.severity >= 4 && s.severity < 7);
      const lowSeverity = symptoms.filter(s => s.severity < 4);
      
      const analysisPrompt = `You are a menopause health advisor. Based ONLY on the following logged symptoms and their severity levels:

SYMPTOMS AND SEVERITY:
${symptomDetails}

SYMPTOM BREAKDOWN:
- Total symptoms: ${symptoms.length}
- Average severity: ${stats.averageSeverity}/10
- High severity (7-10): ${highSeverity.length > 0 ? highSeverity.map(s => `${s.symptom_type.replace('_', ' ')} (${s.severity}/10)`).join(', ') : 'None'}
- Medium severity (4-6): ${mediumSeverity.length > 0 ? mediumSeverity.map(s => `${s.symptom_type.replace('_', ' ')} (${s.severity}/10)`).join(', ') : 'None'}
- Low severity (1-3): ${lowSeverity.length > 0 ? lowSeverity.map(s => `${s.symptom_type.replace('_', ' ')} (${s.severity}/10)`).join(', ') : 'None'}

IMPORTANT: Provide recommendations based ONLY on the symptoms and their severity levels. Do NOT consider trends or changes over time. Focus on managing the specific symptoms at their current severity levels.`;
      
      const response = await analyzeSymptoms(
        symptoms.map(s => s.symptom_type), 
        analysisPrompt
      );
      
      // Format response by removing markdown formatting
      const formattedResponse = response
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold formatting
        .replace(/\*(.*?)\*/g, '$1') // Remove italic formatting
        .replace(/#{1,6}\s*/g, '') // Remove headers
        .replace(/\n{3,}/g, '\n\n') // Reduce multiple line breaks
        .trim();
      
      setAiResponse(formattedResponse);
      setShowAiChat(true);
      
      // Auto-scroll to AI response after a short delay
      setTimeout(() => {
        const aiResponseElement = document.querySelector('[data-ai-response]');
        if (aiResponseElement) {
          aiResponseElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }, 300);
    } catch (error) {
      const fallbackApplied = applyGeminiFallbackAdvice(error);
      if (fallbackApplied) {
        return;
      }
      console.error('Error analyzing symptoms:', error);
      toast.error('Failed to analyze symptoms');
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
          <p className="text-gray-600">Loading your symptoms...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center mb-6"
      >
        <Button
          onClick={handleSymptomAnalysis}
          disabled={aiLoading || symptoms.length === 0}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm sm:text-base"
        >
          {aiLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Brain className="w-4 h-4 mr-2" />
          )}
          <span className="hidden xs:inline">Analyze Symptoms</span>
          <span className="xs:hidden">Analyze</span>
        </Button>
        <Button
          onClick={() => {
            console.log('Ask AI button clicked, current showAiChat:', showAiChat);
            setShowAiChat(!showAiChat);
          }}
          variant="outline"
          className="border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-black dark:hover:text-white text-sm sm:text-base transition-colors"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          {showAiChat ? 'Hide AI Chat' : 'Ask AI'}
        </Button>
      </motion.div>

      {/* AI Chat Section - Show at top when opened */}
      {showAiChat && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Card className="bg-gradient-to-br from-purple-50/80 to-pink-50/80 backdrop-blur-sm border border-purple-200 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="w-6 h-6 text-purple-500" />
                  <CardTitle className="text-xl">AI Symptom Assistant</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAiChat(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </Button>
              </div>
              <CardDescription className="text-base">
                Ask questions about your symptoms and get personalized AI recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <Textarea
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  placeholder="Ask me anything about your symptoms, wellness, or menopause..."
                  className="flex-1 min-h-[80px] sm:min-h-[100px] bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-neon-pink focus:ring-neon-pink/20 text-black dark:text-white"
                  disabled={aiLoading}
                />
                <Button
                  onClick={handleAiQuery}
                  disabled={aiLoading || !aiQuery.trim()}
                  className="self-end sm:self-end bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 sm:px-6 py-2 text-sm sm:text-base"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span className="hidden sm:inline">Thinking...</span>
                      <span className="sm:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Ask AI</span>
                      <span className="sm:hidden">Ask</span>
                    </>
                  )}
                </Button>
              </div>

              {aiResponse && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200"
                  data-ai-response
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-purple-900 mb-1 sm:mb-2 text-sm sm:text-base">
                        AI Recommendation
                      </h4>
                      <div className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap leading-relaxed break-words">
                        {aiResponse}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Quick Questions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAiQuery("What can I do to manage hot flashes?")}
                  className="text-xs"
                >
                  Hot Flashes
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAiQuery("How can I improve my sleep during menopause?")}
                  className="text-xs"
                >
                  Sleep Issues
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAiQuery("What exercises help with menopause symptoms?")}
                  className="text-xs"
                >
                  Exercise
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAiQuery("How can I manage mood changes?")}
                  className="text-xs"
                >
                  Mood Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        <Card className="bg-gradient-to-br from-pink-50 to-purple-50">
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="flex items-center justify-center mb-1 sm:mb-2">
              <Calendar className="w-4 h-4 sm:w-6 sm:h-6 text-pink-500" />
            </div>
            <div className="text-lg sm:text-2xl font-bold text-pink-600">{stats.totalEntries}</div>
            <div className="text-xs sm:text-sm text-gray-600">Total Entries</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="flex items-center justify-center mb-1 sm:mb-2">
              <BarChart3 className="w-4 h-4 sm:w-6 sm:h-6 text-blue-500" />
            </div>
            <div className="text-lg sm:text-2xl font-bold text-blue-600">{stats.averageSeverity}/10</div>
            <div className="text-xs sm:text-sm text-gray-600">Avg Severity</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="flex items-center justify-center mb-1 sm:mb-2">
              {getTrendIcon(stats.recentTrend)}
            </div>
            <div className={`text-sm sm:text-lg font-bold ${getTrendColor(stats.recentTrend)} capitalize`}>
              {stats.recentTrend}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Recent Trend</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-red-50">
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="flex items-center justify-center mb-1 sm:mb-2">
              <Target className="w-4 h-4 sm:w-6 sm:h-6 text-orange-500" />
            </div>
            <div className="text-sm sm:text-lg font-bold text-orange-600 truncate">
              {stats.mostCommonSymptom.replace('_', ' ')}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Most Common</div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Symptom Entry Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Activity className="h-6 w-6 text-pink-500" />
              Track Your Symptoms
            </CardTitle>
            <CardDescription>
              Record your menopause symptoms to get personalized AI insights and recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-2"
              >
                <Label htmlFor="symptom" className="text-base font-medium">Symptom Type</Label>
                <Select value={selectedSymptom} onValueChange={handleSymptomSelect}>
                  <SelectTrigger className="h-12 bg-white/50 border-gray-200 focus:border-pink-500 focus:ring-pink-500/20">
                    <SelectValue placeholder="Select a symptom to track" />
                  </SelectTrigger>
                  <SelectContent>
                    {symptomTypes.map((symptom) => {
                      const Icon = symptom.icon;
                      return (
                        <SelectItem key={symptom.value} value={symptom.value}>
                          <div className="flex items-center gap-3">
                            <Icon className={`w-4 h-4 ${symptom.color}`} />
                            <span>{symptom.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </motion.div>

              {currentDetailConfig && selectedSymptom && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 }}
                  className="space-y-2"
                >
                  <Label className="text-base font-medium flex items-center gap-1">
                    {currentDetailConfig.label}
                    {currentDetailConfig.unit && (
                      <span className="text-sm text-gray-500">({currentDetailConfig.unit})</span>
                    )}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type={currentDetailConfig.inputType || 'text'}
                      value={currentDetailValue}
                      onChange={(e) => handleDetailInputChange(selectedSymptom, e.target.value)}
                      placeholder={currentDetailConfig.placeholder}
                      min={currentDetailConfig.min}
                      max={currentDetailConfig.max}
                      step={currentDetailConfig.step}
                      className="flex-1 bg-white/80 border-gray-200 focus:border-pink-500 focus:ring-pink-500/20"
                    />
                    {currentDetailConfig.unit && (
                      <div className="px-3 py-2 rounded-lg bg-gray-100 text-sm text-gray-600">
                        {currentDetailConfig.unit}
                      </div>
                    )}
                  </div>
                  {currentDetailConfig.helperText && (
                    <p className="text-xs text-gray-500">{currentDetailConfig.helperText}</p>
                  )}
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">
                    Severity Level: {severity[0]}/10
                  </Label>
                  <Badge className={`px-3 py-1 ${getSeverityColor(severity[0])}`}>
                    {getSeverityLabel(severity[0])}
                  </Badge>
                </div>
                <Slider
                  value={severity}
                  onValueChange={setSeverity}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Mild (1-2)</span>
                  <span>Moderate (3-4)</span>
                  <span>Severe (5-6)</span>
                  <span>Very Severe (7-10)</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
              >
                <Label htmlFor="notes" className="text-base font-medium">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional details about your symptoms, triggers, or context..."
                  rows={4}
                  className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-neon-pink focus:ring-neon-pink/20 text-black dark:text-white"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button 
                  type="submit" 
                  disabled={saving || !selectedSymptom} 
                  className="w-full h-12 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-medium text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {saving ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Recording Symptom...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="w-5 h-5" />
                      Record Symptom
                    </div>
                  )}
                </Button>
              </motion.div>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Symptoms */}
      {symptoms.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <TrendingUp className="h-6 w-6 text-purple-500" />
                    Recent Symptoms
                  </CardTitle>
                  <CardDescription>
                    Your latest symptom entries and patterns
                  </CardDescription>
                </div>
                {symptoms.length > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
                      >
                        <Archive className="w-4 h-4 mr-2" />
                        Clear All
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Clear All Symptom Entries?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete all {symptoms.length} symptom entries from your records. This action cannot be undone. Are you sure you want to continue?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleClearAllSymptoms}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          Clear Symptoms
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <AnimatePresence>
                  {symptoms.slice(0, 10).map((symptom, index) => {
                    const symptomType = symptomTypes.find(s => s.value === symptom.symptom_type);
                    const Icon = symptomType?.icon || Activity;
                    const color = symptomType?.color || 'text-gray-500';
                    const displayLabel = symptomType?.label || symptom.symptom_type.replace('_', ' ');
                    
                    return (
                      <motion.div
                        key={symptom.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-300 bg-white/50 gap-3"
                      >
                        <div className="flex items-center gap-3 sm:gap-4 flex-1">
                          <div className={`p-2 rounded-lg bg-gray-100 flex-shrink-0`}>
                            <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${color}`} />
                          </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 text-sm sm:text-base">
                                {displayLabel}
                              </div>
                            <div className="text-xs sm:text-sm text-gray-500 flex items-center gap-2">
                              <Clock className="w-3 h-3 flex-shrink-0" />
                              <span className="hidden sm:inline">
                                {new Date(symptom.recorded_at).toLocaleDateString()} at {new Date(symptom.recorded_at).toLocaleTimeString()}
                              </span>
                              <span className="sm:hidden">
                                {new Date(symptom.recorded_at).toLocaleDateString()}
                              </span>
                            </div>
                            {symptom.notes && (
                              <div className="text-xs sm:text-sm text-gray-600 mt-1 italic line-clamp-2">
                                "{symptom.notes}"
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
                          <Badge className={`px-2 sm:px-3 py-1 text-xs sm:text-sm ${getSeverityColor(symptom.severity)}`}>
                            {symptom.severity}/10
                          </Badge>
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="text-right">
                                <div className="text-xs sm:text-sm font-medium text-gray-900">
                                  {getSeverityLabel(symptom.severity)}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={!speechSupported}
                                onClick={() => speakSymptomName(displayLabel, symptom.severity)}
                                className="text-gray-400 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors"
                                title={`Play ${displayLabel}`}
                              >
                                <Volume2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSymptom(symptom.id)}
                                className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                title="Clear Entry"
                              >
                                <Archive className="w-4 h-4" />
                              </Button>
                            </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

    </div>
  );
};
