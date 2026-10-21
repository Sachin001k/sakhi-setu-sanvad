import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Heart, 
  Moon, 
  Thermometer,
  Zap,
  Target,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  BarChart3,
  PieChart,
  Calendar,
  Clock,
  Loader2,
  RefreshCw,
  Sparkles,
  Send,
  Bot,
  MessageCircle,
  type LucideIcon
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useGemini } from '@/hooks/useGemini';
import { toast } from 'sonner';

interface SymptomRecord {
  symptom_type: string;
  severity: number;
  recorded_at: string;
}

interface Recommendation {
  category: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  icon: LucideIcon;
}

interface AnalyticsData {
  totalSymptoms: number;
  averageSeverity: number;
  symptomTrends: { [key: string]: number };
  weeklyPattern: { day: string; severity: number }[];
  recommendations: Recommendation[];
  insights: {
    type: 'positive' | 'warning' | 'info';
    title: string;
    description: string;
    action?: string;
  }[];
}

interface SymptomSummary {
  symptom: string;
  count: number;
  averageSeverity: number;
}

// AI recommendations are cached for the browser session (per user + data snapshot)
// so revisiting the tab does not trigger another Gemini call.
const aiRecommendationCache = new Map<string, Recommendation[]>();

const MAX_SYMPTOM_TYPES_FOR_AI = 8;

const formatSymptomName = (symptomType: string) => symptomType.replace(/_/g, ' ');

const summarizeSymptoms = (symptoms: SymptomRecord[]): SymptomSummary[] => {
  const grouped: Record<string, { count: number; total: number }> = {};
  symptoms.forEach((s) => {
    const entry = grouped[s.symptom_type] ?? { count: 0, total: 0 };
    entry.count += 1;
    entry.total += s.severity;
    grouped[s.symptom_type] = entry;
  });
  return Object.entries(grouped)
    .map(([symptom, { count, total }]) => ({
      symptom,
      count,
      averageSeverity: Math.round((total / count) * 10) / 10
    }))
    .sort((a, b) => b.count - a.count || b.averageSeverity - a.averageSeverity);
};

const generateStaticRecommendations = (symptoms: SymptomRecord[], avgSeverity: number): Recommendation[] => {
  const recommendations: Recommendation[] = [];

  // Hot flashes recommendations
  const hotFlashes = symptoms.filter(s => s.symptom_type === 'hot_flashes');
  if (hotFlashes.length > 0) {
    recommendations.push({
      category: 'Hot Flashes',
      title: 'Cooling Strategies',
      description: 'Try wearing layers, using a fan, and avoiding spicy foods during hot flash episodes.',
      priority: 'high' as const,
      icon: Thermometer
    });
  }

  // Sleep recommendations
  const sleepIssues = symptoms.filter(s => s.symptom_type === 'sleep_issues');
  if (sleepIssues.length > 0) {
    recommendations.push({
      category: 'Sleep',
      title: 'Sleep Hygiene',
      description: 'Maintain a consistent sleep schedule and create a cool, dark bedroom environment.',
      priority: 'high' as const,
      icon: Moon
    });
  }

  // Mood recommendations
  const moodIssues = symptoms.filter(s => ['mood_swings', 'anxiety', 'depression'].includes(s.symptom_type));
  if (moodIssues.length > 0) {
    recommendations.push({
      category: 'Mood',
      title: 'Stress Management',
      description: 'Practice deep breathing, meditation, or gentle yoga to help manage mood changes.',
      priority: 'medium' as const,
      icon: Heart
    });
  }

  // General recommendations based on severity
  if (avgSeverity > 6) {
    recommendations.push({
      category: 'General',
      title: 'Professional Support',
      description: 'Consider consulting with a healthcare provider about your symptoms.',
      priority: 'high' as const,
      icon: Target
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      category: 'General',
      title: 'Start Tracking',
      description: 'Log your symptoms to unlock the full AI analytics experience.',
      priority: 'low' as const,
      icon: Lightbulb
    });
  }

  return recommendations.slice(0, 4);
};

const generateInsights = (symptoms: SymptomRecord[], avgSeverity: number, trends: { [key: string]: number }) => {
  const insights: AnalyticsData['insights'] = [];

  if (symptoms.length === 0) {
    insights.push({
      type: 'info' as const,
      title: 'Start Tracking',
      description: 'Begin logging your symptoms to get personalized insights and recommendations.',
      action: 'Track your first symptom'
    });
    return insights;
  }

  // Severity insights
  if (avgSeverity > 7) {
    insights.push({
      type: 'warning' as const,
      title: 'High Symptom Severity',
      description: 'Your symptoms are quite severe. Consider seeking professional medical advice.',
      action: 'Find nearby PHC'
    });
  } else if (avgSeverity < 4) {
    insights.push({
      type: 'positive' as const,
      title: 'Well-Managed Symptoms',
      description: 'Great job! Your symptoms appear to be well-managed. Keep up the good work.',
      action: 'Continue tracking'
    });
  }

  // Pattern insights
  const mostCommonSymptom = Object.entries(trends).sort(([,a], [,b]) => b - a)[0];
  if (mostCommonSymptom) {
    insights.push({
      type: 'info' as const,
      title: 'Most Common Symptom',
      description: `You experience ${mostCommonSymptom[0].replace('_', ' ')} most frequently. Focus on managing this symptom.`,
      action: 'View recommendations'
    });
  }

  // Trend insights
  const recentSymptoms = symptoms.slice(0, 7);
  const olderSymptoms = symptoms.slice(7, 14);
  if (recentSymptoms.length > 0 && olderSymptoms.length > 0) {
    const recentAvg = recentSymptoms.reduce((sum, s) => sum + s.severity, 0) / recentSymptoms.length;
    const olderAvg = olderSymptoms.reduce((sum, s) => sum + s.severity, 0) / olderSymptoms.length;
    
    if (recentAvg > olderAvg * 1.2) {
      insights.push({
        type: 'warning' as const,
        title: 'Symptoms Worsening',
        description: 'Your symptoms have increased in severity recently. Consider adjusting your management strategies.',
        action: 'Review recommendations'
      });
    } else if (recentAvg < olderAvg * 0.8) {
      insights.push({
        type: 'positive' as const,
        title: 'Symptoms Improving',
        description: 'Your symptoms have decreased in severity recently. Your management strategies are working!',
        action: 'Keep tracking'
      });
    }
  }

  return insights.slice(0, 3);
};

const processAnalyticsData = (symptoms: SymptomRecord[]): AnalyticsData => {
  const totalSymptoms = symptoms.length;
  const averageSeverity = symptoms.length > 0
    ? symptoms.reduce((sum, s) => sum + s.severity, 0) / symptoms.length
    : 0;

  // Calculate symptom trends
  const symptomTrends: { [key: string]: number } = {};
  symptoms.forEach(s => {
    symptomTrends[s.symptom_type] = (symptomTrends[s.symptom_type] || 0) + 1;
  });

  // Calculate weekly patterns
  const weeklyPattern = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    .map(day => {
      const daySymptoms = symptoms.filter(s => {
        const date = new Date(s.recorded_at);
        return date.toLocaleDateString('en-US', { weekday: 'long' }) === day;
      });
      const avgSeverity = daySymptoms.length > 0
        ? daySymptoms.reduce((sum, s) => sum + s.severity, 0) / daySymptoms.length
        : 0;
      return { day, severity: avgSeverity };
    });

  return {
    totalSymptoms,
    averageSeverity: Math.round(averageSeverity * 10) / 10,
    symptomTrends,
    weeklyPattern,
    recommendations: generateStaticRecommendations(symptoms, averageSeverity),
    insights: generateInsights(symptoms, averageSeverity, symptomTrends)
  };
};

export const AIAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [symptomSummary, setSymptomSummary] = useState<SymptomSummary[]>([]);
  const [cacheKey, setCacheKey] = useState<string | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<Recommendation[] | null>(null);
  const [aiRecommendationsError, setAiRecommendationsError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [userAge, setUserAge] = useState<number | null>(null);
  const { user } = useAuth();

  const {
    isLoading: aiLoading,
    generateWellnessAdvice,
    analyzeSymptoms
  } = useGemini({
    suppressToasts: true
  });

  const fetchAnalytics = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setLoadError(null);

      const { data, error: symptomsError } = await supabase
        .from('symptoms')
        .select('symptom_type, severity, recorded_at')
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: false })
        .limit(100);

      if (symptomsError) throw symptomsError;

      const symptoms: SymptomRecord[] = data ?? [];
      const key = `${user.id}:${symptoms.length}:${symptoms[0]?.recorded_at ?? 'none'}`;

      setAnalytics(processAnalyticsData(symptoms));
      setSymptomSummary(summarizeSymptoms(symptoms));
      setCacheKey(key);
      setAiRecommendations(aiRecommendationCache.get(key) ?? null);
      setAiRecommendationsError(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalytics(null);
      setLoadError('We could not load your symptom data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    supabase
      .from('users')
      .select('age')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('Error loading user age:', error);
          return;
        }
        setUserAge(typeof data?.age === 'number' ? data.age : null);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const ageContext = userAge !== null ? { age: userAge } : {};

  // Only called on explicit user action; sends an aggregated summary, not raw records.
  const generateAiRecommendations = async () => {
    if (!analytics || !cacheKey || symptomSummary.length === 0) return;

    const cached = aiRecommendationCache.get(cacheKey);
    if (cached) {
      setAiRecommendations(cached);
      return;
    }

    setAiRecommendationsError(false);

    try {
      const topSymptoms = symptomSummary.slice(0, MAX_SYMPTOM_TYPES_FOR_AI);
      const symptomDetails = topSymptoms
        .map((s) => `- ${formatSymptomName(s.symptom)}: logged ${s.count} time(s), average severity ${s.averageSeverity}/10`)
        .join('\n');

      const aiPrompt = `You are a menopause health advisor. Based ONLY on the following summary of logged symptoms and their severity levels:

SYMPTOM SUMMARY:
${symptomDetails}

- Total entries considered: ${analytics.totalSymptoms}
- Overall average severity: ${analytics.averageSeverity}/10

Provide up to 4 short, practical recommendations (one per line) for managing these specific symptoms at their current severity levels.`;

      const aiAdvice = await generateWellnessAdvice(aiPrompt, {
        ...ageContext,
        symptoms: topSymptoms.map((s) => s.symptom),
        concerns: ['symptom management', 'quality of life', 'menopause support']
      });

      const recommendations: Recommendation[] = [];
      const aiLines = aiAdvice.split('\n').filter(line => line.trim());
      aiLines.slice(0, 4).forEach((line, index) => {
        const lower = line.toLowerCase();
        if (lower.includes('hot') || lower.includes('flash')) {
          recommendations.push({
            category: 'Hot Flashes',
            title: 'AI-Recommended Cooling',
            description: line.trim(),
            priority: 'high',
            icon: Thermometer
          });
        } else if (lower.includes('sleep') || lower.includes('insomnia')) {
          recommendations.push({
            category: 'Sleep',
            title: 'AI Sleep Strategy',
            description: line.trim(),
            priority: 'high',
            icon: Moon
          });
        } else if (lower.includes('mood') || lower.includes('anxiety') || lower.includes('stress')) {
          recommendations.push({
            category: 'Mood',
            title: 'AI Mood Support',
            description: line.trim(),
            priority: 'medium',
            icon: Heart
          });
        } else {
          recommendations.push({
            category: 'General',
            title: `AI Recommendation ${index + 1}`,
            description: line.trim(),
            priority: 'medium',
            icon: Brain
          });
        }
      });

      aiRecommendationCache.set(cacheKey, recommendations);
      setAiRecommendations(recommendations);
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      setAiRecommendationsError(true);
      toast.error('Could not generate AI recommendations. Showing general suggestions instead.');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'info': return <Lightbulb className="w-5 h-5 text-blue-500" />;
      default: return <Brain className="w-5 h-5 text-purple-500" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'positive': return 'border-green-200 bg-green-50';
      case 'warning': return 'border-orange-200 bg-orange-50';
      case 'info': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const handleAiQuery = async () => {
    if (!aiQuery.trim()) return;

    if (!analytics) {
      toast.error('Please wait for analytics to load');
      return;
    }

    try {
      const topSymptoms = symptomSummary.slice(0, MAX_SYMPTOM_TYPES_FOR_AI);
      const symptomContext = topSymptoms.length > 0
        ? `Current logged symptoms: ${topSymptoms.map(s => `${formatSymptomName(s.symptom)} (average severity: ${s.averageSeverity}/10)`).join(', ')}. Average severity: ${analytics.averageSeverity}/10.`
        : 'No symptoms logged yet.';

      const enhancedQuery = `${aiQuery}\n\nContext: ${symptomContext} Please provide recommendations based ONLY on the symptoms and their severity levels, not on trends or patterns over time.`;

      const response = await generateWellnessAdvice(enhancedQuery, {
        ...ageContext,
        symptoms: topSymptoms.map(s => s.symptom),
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
      console.error('Error answering AI query:', error);
      toast.error('The AI assistant is unavailable right now. Please try again later.');
    }
  };

  const handleSymptomAnalysis = async () => {
    if (!analytics) return;

    try {
      const symptoms = symptomSummary.slice(0, MAX_SYMPTOM_TYPES_FOR_AI).map(s => s.symptom);
      const response = await analyzeSymptoms(symptoms, `Average severity: ${analytics.averageSeverity}/10`);
      setAiResponse(response);
    } catch (error) {
      console.error('Error analyzing symptoms:', error);
      toast.error('Could not analyze symptoms right now. Please try again later.');
    }
  };

  const displayedRecommendations = aiRecommendations && aiRecommendations.length > 0
    ? aiRecommendations
    : analytics?.recommendations ?? [];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-8 h-8 animate-spin text-neon-pink" />
          <p className="text-gray-600">Analyzing your data...</p>
        </motion.div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
        <h3 className="text-lg font-semibold mb-2">Couldn't Load Analytics</h3>
        <p className="text-gray-600 mb-4">{loadError}</p>
        <Button onClick={fetchAnalytics}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center p-8">
        <Brain className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
        <p className="text-gray-600 mb-4">
          Start tracking your symptoms to get AI-powered insights
        </p>
        <Button onClick={fetchAnalytics}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-6 h-6 text-neon-purple" />
            AI Analytics
          </h2>
          <p className="text-gray-600">AI-powered insights from your symptom data</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleSymptomAnalysis}
            disabled={aiLoading || !analytics}
            size="sm"
            className="bg-gradient-to-r from-neon-purple to-neon-pink hover:from-purple-dark hover:to-pink-dark text-white shadow-lg shadow-neon-purple/25"
          >
            {aiLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Brain className="w-4 h-4 mr-2" />
            )}
            View Recommendations
          </Button>
          <Button
            onClick={() => {
              setRefreshing(true);
              fetchAnalytics().finally(() => setRefreshing(false));
            }}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <Card className="bg-gradient-to-br from-purple-light/20 to-pink-light/20 border border-neon-purple/20">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center mb-3">
              <BarChart3 className="w-8 h-8 text-neon-purple" />
            </div>
            <div className="text-3xl font-bold text-neon-purple mb-1">{analytics.totalSymptoms}</div>
            <div className="text-sm text-gray-600">Symptoms Tracked</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-light/20 to-pink-light/20 border border-neon-pink/20">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center mb-3">
              <Activity className="w-8 h-8 text-neon-pink" />
            </div>
            <div className="text-3xl font-bold text-neon-pink mb-1">{analytics.averageSeverity}/10</div>
            <div className="text-sm text-gray-600">Average Severity</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-light/20 to-pink-light/20 border border-neon-purple/20">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center mb-3">
              <Sparkles className="w-8 h-8 text-neon-purple" />
            </div>
            <div className="text-3xl font-bold text-neon-purple mb-1">{displayedRecommendations.length}</div>
            <div className="text-sm text-gray-600">{aiRecommendations ? 'AI Recommendations' : 'Recommendations'}</div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              AI Insights
            </CardTitle>
            <CardDescription>
              Personalized insights based on your symptom patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <AnimatePresence>
                {analytics.insights.map((insight, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}
                  >
                    <div className="flex items-start gap-3">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {insight.title}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {insight.description}
                        </p>
                        {insight.action && (
                          <Button size="sm" variant="outline" className="text-xs">
                            {insight.action}
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-neon-pink" />
                  Personalized Recommendations
                </CardTitle>
                <CardDescription>
                  {aiRecommendations
                    ? 'AI-generated suggestions based on a summary of your logged symptoms'
                    : 'Suggestions based on the symptoms you have logged'}
                </CardDescription>
              </div>
              {analytics.totalSymptoms > 0 && !aiRecommendations && (
                <Button
                  onClick={generateAiRecommendations}
                  disabled={aiLoading}
                  size="sm"
                  variant="outline"
                >
                  {aiLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  {aiRecommendationsError ? 'Retry AI Recommendations' : 'Get AI Recommendations'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {displayedRecommendations.map((rec, index) => {
                  const Icon = rec.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Icon className="w-5 h-5 text-neon-pink" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900">
                              {rec.title}
                            </h4>
                            <Badge className={`text-xs ${getPriorityColor(rec.priority)}`}>
                              {rec.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {rec.description}
                          </p>
                          <div className="text-xs text-gray-500">
                            {rec.category}
                          </div>
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

      {/* Weekly Pattern */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              Weekly Pattern
            </CardTitle>
            <CardDescription>
              Your symptom severity patterns throughout the week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.weeklyPattern.map((day, index) => (
                <motion.div
                  key={day.day}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-4"
                >
                  <div className="w-20 text-sm font-medium text-gray-600">
                    {day.day}
                  </div>
                  <div className="flex-1">
                    <Progress 
                      value={day.severity * 10} 
                      className="h-2"
                    />
                  </div>
                  <div className="w-12 text-sm text-gray-500 text-right">
                    {day.severity.toFixed(1)}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* AI Chat Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-neon-purple" />
              AI Health Assistant
            </CardTitle>
            <CardDescription>
              Ask questions about your symptoms and get personalized AI recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Textarea
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="Ask me anything about your symptoms, wellness, or menopause..."
                className="flex-1 min-h-[100px]"
                disabled={aiLoading}
              />
              <Button
                onClick={handleAiQuery}
                disabled={aiLoading || !aiQuery.trim()}
                className="self-end"
              >
                {aiLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>

            {aiResponse && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-gradient-to-r from-purple-light/20 to-pink-light/20 rounded-lg border border-neon-purple/30 shadow-lg shadow-neon-purple/10"
                data-ai-response
              >
                <div className="flex items-start gap-3">
                  <Bot className="w-5 h-5 text-neon-purple mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-neon-purple mb-2">
                      AI Recommendation
                    </h4>
                    <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {aiResponse}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Quick Questions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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
    </div>
  );
};
