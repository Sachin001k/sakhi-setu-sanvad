import React, { useState, useEffect } from 'react';
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
  MessageCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useGemini } from '@/hooks/useGemini';
import { toast } from 'sonner';

interface AnalyticsData {
  totalSymptoms: number;
  averageSeverity: number;
  symptomTrends: { [key: string]: number };
  weeklyPattern: { day: string; severity: number }[];
  recommendations: {
    category: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    icon: any;
  }[];
  insights: {
    type: 'positive' | 'warning' | 'info';
    title: string;
    description: string;
    action?: string;
  }[];
}

export const AIAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [showAiChat, setShowAiChat] = useState(false);
  const { user } = useAuth();
  
  const { 
    isLoading: aiLoading, 
    generateWellnessAdvice, 
    analyzeSymptoms,
    generateHealthReport 
  } = useGemini({
    suppressToasts: true
  });

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch symptoms data
      const { data: symptoms, error: symptomsError } = await supabase
        .from('symptoms')
        .select('*')
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: false })
        .limit(100);

      if (symptomsError) throw symptomsError;

      // Process analytics data
      const analyticsData = await processAnalyticsData(symptoms || []);
      setAnalytics(analyticsData);
    } catch (error) {
      const fallbackAnalytics = await processAnalyticsData([]);
      setAnalytics(fallbackAnalytics);
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = async (symptoms: any[]): Promise<AnalyticsData> => {
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

    // Generate AI recommendations
    const recommendations = await generateRecommendations(symptoms, averageSeverity);
    
    // Generate insights
    const insights = generateInsights(symptoms, averageSeverity, symptomTrends);

    return {
      totalSymptoms,
      averageSeverity: Math.round(averageSeverity * 10) / 10,
      symptomTrends,
      weeklyPattern,
      recommendations,
      insights
    };
  };

  const generateRecommendations = async (symptoms: any[], avgSeverity: number) => {
    const recommendations = [];

    // Get AI-powered recommendations based on actual symptoms (not trend)
    try {
      if (symptoms.length === 0) {
        return generateStaticRecommendations(symptoms, avgSeverity);
      }
      
      // Create detailed symptom list with severity for AI analysis - BASED ONLY ON SYMPTOMS AND SEVERITY
      const symptomDetails = symptoms.map(s => {
        const symptomName = s.symptom_type.replace('_', ' ');
        return `${symptomName} with severity ${s.severity}/10`;
      }).join(', ');
      
      const symptomTypes = symptoms.map(s => s.symptom_type);
      const highSeveritySymptoms = symptoms.filter(s => s.severity >= 7);
      const mediumSeveritySymptoms = symptoms.filter(s => s.severity >= 4 && s.severity < 7);
      const lowSeveritySymptoms = symptoms.filter(s => s.severity < 4);
      
      // Build prompt focusing ONLY on symptoms and their severity, NOT trends
      const aiPrompt = `You are a menopause health advisor. Based ONLY on the following logged symptoms and their severity levels:

SYMPTOMS AND SEVERITY:
${symptomDetails}

SYMPTOM BREAKDOWN:
- Total symptoms logged: ${symptoms.length}
- Average severity: ${avgSeverity.toFixed(1)}/10
- High severity symptoms (7-10): ${highSeveritySymptoms.length > 0 ? highSeveritySymptoms.map(s => `${s.symptom_type.replace('_', ' ')} (${s.severity}/10)`).join(', ') : 'None'}
- Medium severity symptoms (4-6): ${mediumSeveritySymptoms.length > 0 ? mediumSeveritySymptoms.map(s => `${s.symptom_type.replace('_', ' ')} (${s.severity}/10)`).join(', ') : 'None'}
- Low severity symptoms (1-3): ${lowSeveritySymptoms.length > 0 ? lowSeveritySymptoms.map(s => `${s.symptom_type.replace('_', ' ')} (${s.severity}/10)`).join(', ') : 'None'}

IMPORTANT: Provide recommendations based ONLY on the symptoms and their severity levels listed above. Do NOT consider trends, patterns, or changes over time. Focus on managing the specific symptoms at their current severity levels.`;
      
      const aiAdvice = await generateWellnessAdvice(
        aiPrompt,
        {
          age: 45, // You can make this dynamic
          symptoms: symptomTypes,
          concerns: ['symptom management', 'quality of life', 'menopause support']
        }
      );

      // Parse AI response and create recommendations
      const aiLines = aiAdvice.split('\n').filter(line => line.trim());
      aiLines.slice(0, 4).forEach((line, index) => {
        if (line.includes('hot') || line.includes('flash')) {
          recommendations.push({
            category: 'Hot Flashes',
            title: 'AI-Recommended Cooling',
            description: line.trim(),
            priority: 'high' as const,
            icon: Thermometer
          });
        } else if (line.includes('sleep') || line.includes('insomnia')) {
          recommendations.push({
            category: 'Sleep',
            title: 'AI Sleep Strategy',
            description: line.trim(),
            priority: 'high' as const,
            icon: Moon
          });
        } else if (line.includes('mood') || line.includes('anxiety') || line.includes('stress')) {
          recommendations.push({
            category: 'Mood',
            title: 'AI Mood Support',
            description: line.trim(),
            priority: 'medium' as const,
            icon: Heart
          });
        } else {
          recommendations.push({
            category: 'General',
            title: `AI Recommendation ${index + 1}`,
            description: line.trim(),
            priority: 'medium' as const,
            icon: Brain
          });
        }
      });
    } catch (error) {
      return generateStaticRecommendations(symptoms, avgSeverity);
    }

    return recommendations.slice(0, 4);
  };

  const generateStaticRecommendations = (symptoms: any[], avgSeverity: number) => {
    const recommendations = [];

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

  const generateInsights = (symptoms: any[], avgSeverity: number, trends: { [key: string]: number }) => {
    const insights = [];

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

    try {
      // Build context based ONLY on symptoms and severity, not trends
      if (!analytics) {
        toast.error('Please wait for analytics to load');
        return;
      }

      // Fetch actual symptoms with severity for context
      const { data: symptoms } = await supabase
        .from('symptoms')
        .select('symptom_type, severity')
        .eq('user_id', user?.id)
        .order('recorded_at', { ascending: false })
        .limit(20);

      const symptomContext = symptoms && symptoms.length > 0
        ? `Current logged symptoms: ${symptoms.map(s => `${s.symptom_type.replace('_', ' ')} (severity: ${s.severity}/10)`).join(', ')}. Average severity: ${analytics.averageSeverity}/10.`
        : 'No symptoms logged yet.';
      
      const enhancedQuery = `${aiQuery}\n\nContext: ${symptomContext} Please provide recommendations based ONLY on the symptoms and their severity levels, not on trends or patterns over time.`;
      
      const response = await generateWellnessAdvice(enhancedQuery, {
        age: 45,
        symptoms: analytics?.symptomTrends ? Object.keys(analytics.symptomTrends) : [],
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
      // Intentionally silenced to avoid UI noise.
    }
  };

  const handleSymptomAnalysis = async () => {
    if (!analytics) return;

    try {
      const symptoms = Object.keys(analytics.symptomTrends);
      const response = await analyzeSymptoms(symptoms, `Average severity: ${analytics.averageSeverity}/10`);
      setAiResponse(response);
      setShowAiChat(true);
    } catch (error) {
      // Suppressed to keep the tab experience consistent.
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
          <Loader2 className="w-8 h-8 animate-spin text-neon-pink" />
          <p className="text-gray-600">Analyzing your data...</p>
        </motion.div>
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
            <div className="text-3xl font-bold text-neon-purple mb-1">{analytics.recommendations.length}</div>
            <div className="text-sm text-gray-600">AI Recommendations</div>
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
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-neon-pink" />
              Personalized Recommendations
            </CardTitle>
            <CardDescription>
              AI-generated suggestions to help manage your symptoms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {analytics.recommendations.map((rec, index) => {
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
