import React, { useState, useEffect } from 'react';
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

interface HealthReport {
  id: string;
  report_type: string;
  period_start: string;
  period_end: string;
  symptoms_summary: any;
  recommendations: any;
  insights: any;
  file_url?: string;
  created_at: string;
}

const HealthReports = () => {
  const { user } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [aiReport, setAiReport] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly'>('weekly');
  
  const { generateHealthReport, isLoading: aiLoading } = useGemini({
    onSuccess: (response) => {
      // Clean AI response by removing markdown formatting
      const cleanResponse = response
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
        .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
        .replace(/#{1,6}\s*/g, '') // Remove headers
        .replace(/- /g, '• ') // Convert dashes to bullets
        .replace(/\n\n+/g, '\n\n') // Clean up multiple line breaks
        .replace(/\*\s/g, '• ') // Convert asterisk lists to bullets
        .trim();
      
      setAiReport(cleanResponse);
      toast.success('AI wellness report generated successfully!');
    },
    onError: (error) => {
      toast.error('Failed to generate AI report');
    }
  });


  const generateReport = async (type: 'weekly' | 'monthly') => {
    if (!user) return;

    setGenerating(true);
    try {
      // Fetch recent symptoms data
      const { data: symptoms, error: symptomsError } = await supabase
        .from('symptoms')
        .select('*')
        .eq('user_id', user.id)
        .gte('recorded_at', new Date(Date.now() - (type === 'weekly' ? 7 : 30) * 24 * 60 * 60 * 1000).toISOString())
        .order('recorded_at', { ascending: false });

      if (symptomsError) throw symptomsError;

      // Prepare wellness-focused data for AI
      const userData = {
        symptoms: symptoms?.map((s: any) => s.symptom_type || s.description || 'Unknown symptom') || [],
        lifestyle: symptoms?.map((s: any) => s.notes || 'No additional notes') || [],
        concerns: symptoms?.filter((s: any) => s.severity > 5).map((s: any) => s.symptom_type || s.description) || [],
        age: user.user_metadata?.age || 30,
        reportType: type,
        period: type === 'weekly' ? '7 days' : '30 days',
        userName: user.user_metadata?.full_name || 'User'
      };

      // Generate AI report using Gemini
      await generateHealthReport(userData);

      // Also create a database entry for tracking
      const reportData = {
        user_id: user.id,
        report_type: type,
        period_start: new Date(Date.now() - (type === 'weekly' ? 7 : 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        period_end: new Date().toISOString().split('T')[0],
        symptoms_summary: {
          total_entries: symptoms?.length || 0,
          average_severity: symptoms?.length ? symptoms.reduce((sum, s: any) => sum + s.severity, 0) / symptoms.length : 0,
          most_common_symptoms: [],
          trends: 'stable'
        },
        recommendations: [],
        insights: []
      };

      const { data, error } = await supabase
        .from('health_reports')
        .insert([reportData] as any)
        .select()
        .single();

      if (error) throw error;

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} report generated successfully!`);

      // Create notification for report generation
      if ((window as any).createNotification) {
        (window as any).createNotification(
          'Wellness Report Generated',
          `Your ${type} wellness report has been generated successfully`,
          'report',
          '/profile?tab=reports'
        );
      }
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
