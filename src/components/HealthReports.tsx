import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Download, 
  Heart, 
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import PDFReportGenerator from './PDFReportGenerator';
import { useGemini } from '@/hooks/useGemini';
import { createNotification } from '@/lib/notifications';

interface SymptomRow {
  symptom_type: string;
  severity: number;
  notes: string | null;
  recorded_at: string;
}

type ReportTrend = 'improving' | 'worsening' | 'stable';

// Clean AI response by removing markdown formatting
const cleanAiResponse = (response: string) =>
  response
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s*/g, '')
    .replace(/- /g, '• ')
    .replace(/\n\n+/g, '\n\n')
    .replace(/\*\s/g, '• ')
    .trim();

/**
 * Compare average severity of the earlier half of the period with the later
 * half. Returns null when there is too little data to say anything honest.
 */
const computeTrend = (symptomsNewestFirst: SymptomRow[]): ReportTrend | null => {
  if (symptomsNewestFirst.length < 4) return null;

  const chronological = [...symptomsNewestFirst].reverse();
  const mid = Math.floor(chronological.length / 2);
  const average = (items: SymptomRow[]) =>
    items.reduce((sum, s) => sum + (Number(s.severity) || 0), 0) / items.length;

  const delta = average(chronological.slice(mid)) - average(chronological.slice(0, mid));
  if (delta >= 1) return 'worsening';
  if (delta <= -1) return 'improving';
  return 'stable';
};

const mostCommonSymptoms = (symptoms: SymptomRow[], limit = 3) => {
  const counts: Record<string, number> = {};
  symptoms.forEach((s) => {
    counts[s.symptom_type] = (counts[s.symptom_type] || 0) + 1;
  });
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([symptom, count]) => ({ symptom, count }));
};

const HealthReports = () => {
  const { user } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [aiReport, setAiReport] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly'>('weekly');
  
  const { generateHealthReport, isLoading: aiLoading } = useGemini({ suppressToasts: true });

  const generateReport = async (type: 'weekly' | 'monthly') => {
    if (!user) return;

    setGenerating(true);
    try {
      const periodStart = new Date(Date.now() - (type === 'weekly' ? 7 : 30) * 24 * 60 * 60 * 1000);

      // Fetch recent symptoms data
      const { data: symptomData, error: symptomsError } = await supabase
        .from('symptoms')
        .select('symptom_type, severity, notes, recorded_at')
        .eq('user_id', user.id)
        .gte('recorded_at', periodStart.toISOString())
        .order('recorded_at', { ascending: false });

      if (symptomsError) throw symptomsError;

      const symptoms: SymptomRow[] = symptomData ?? [];

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('age')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching user age:', profileError);
      }

      const age = typeof profile?.age === 'number' ? profile.age : undefined;

      // Prepare wellness-focused data for AI
      const userData = {
        symptoms: symptoms.map((s) => s.symptom_type || 'Unknown symptom'),
        lifestyle: symptoms.map((s) => s.notes).filter((n): n is string => Boolean(n)),
        concerns: symptoms.filter((s) => s.severity > 5).map((s) => s.symptom_type),
        ...(age !== undefined ? { age } : {}),
      };

      // Generate AI report using Gemini
      const reportText = cleanAiResponse(await generateHealthReport(userData));
      setAiReport(reportText);

      // Also create a database entry for tracking
      const reportData = {
        user_id: user.id,
        report_type: type,
        period_start: periodStart.toISOString().split('T')[0],
        period_end: new Date().toISOString().split('T')[0],
        symptoms_summary: {
          total_entries: symptoms.length,
          average_severity: symptoms.length
            ? Math.round((symptoms.reduce((sum, s) => sum + s.severity, 0) / symptoms.length) * 10) / 10
            : null,
          most_common_symptoms: mostCommonSymptoms(symptoms),
          trends: computeTrend(symptoms)
        },
        recommendations: { text: reportText },
        insights: { text: reportText, source: 'gemini' }
      };

      const { error } = await supabase
        .from('health_reports')
        .insert(reportData);

      if (error) throw error;

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} report generated successfully!`);

      void createNotification(
        'Wellness Report Generated',
        `Your ${type} wellness report has been generated successfully`,
        'report',
        '/profile?tab=reports'
      );
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate health report');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-black">Wellness Reports</h2>
          <p className="text-sm sm:text-base text-black/70 mt-1">AI-powered health insights based on your tracked symptoms</p>
        </div>
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Period Selection */}
          <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 w-full sm:w-auto border border-gray-200 dark:border-gray-600">
            <Button
              onClick={() => setSelectedPeriod('weekly')}
              variant={selectedPeriod === 'weekly' ? 'default' : 'outline'}
              size="sm"
              className="flex-1 sm:flex-none h-9 text-xs sm:text-sm"
            >
              Weekly
            </Button>
          <Button
              onClick={() => setSelectedPeriod('monthly')}
              variant={selectedPeriod === 'monthly' ? 'default' : 'outline'}
            size="sm"
              className="flex-1 sm:flex-none h-9 text-xs sm:text-sm"
          >
              Monthly
          </Button>
          </div>
          
          {/* Generate Button */}
          <Button
            onClick={() => generateReport(selectedPeriod)}
            disabled={generating || aiLoading}
            className="w-full sm:w-auto bg-white from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 h-9 text-xs sm:text-sm text-black"
          >
            {generating || aiLoading ? (
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
            ) : (
              <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            )}
            <span className="hidden xs:inline">Generate </span>
            {selectedPeriod === 'weekly' ? 'Weekly' : 'Monthly'} Report
          </Button>
        </div>
      </div>

      {/* PDF Report Generator */}
      <PDFReportGenerator userProfile={user} aiReport={aiReport} />

      {/* AI Generated Wellness Report */}
      {aiReport && (
        <Card className="mt-6 bg-white  border-0 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl text-black">
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500" />
              <span className="break-words">Wellness Report for {user?.user_metadata?.full_name || 'User'}</span>
                      </CardTitle>
            <CardDescription className="text-sm text-black/80">
              AI-powered health insights based on your {selectedPeriod} symptom tracking
                      </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white dark:bg-gray-700 rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-600">
              <div className="whitespace-pre-wrap text-black dark:text-white leading-relaxed text-sm sm:text-base overflow-x-auto">
                {aiReport}
              </div>
                    </div>
            <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                onClick={() => {
                  const blob = new Blob([aiReport], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `wellness-report-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.txt`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                        variant="outline"
                        size="sm"
                className="w-full sm:w-auto"
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Download Report
                      </Button>
                    </div>
                </CardContent>
              </Card>
      )}

      {/* Old reports section removed - only showing AI generated reports */}
    </div>
  );
};

export default HealthReports;
