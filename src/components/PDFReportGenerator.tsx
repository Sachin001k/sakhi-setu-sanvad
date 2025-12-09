import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText, Calendar, User, Activity, Video, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface PDFReportGeneratorProps {
  userProfile?: any;
  aiReport?: string;
}

const PDFReportGenerator: React.FC<PDFReportGeneratorProps> = ({ userProfile, aiReport }) => {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const generateReport = async () => {
    if (!user) return;

    setIsGenerating(true);
    try {
      // Fetch user data
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      // Fetch profile data
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Fetch symptoms data for wellness focus
      const { data: symptoms } = await supabase
        .from('symptoms')
        .select('*')
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: false })
        .limit(10);

      // Fetch wellness-related posts only
      const { data: wellnessPosts } = await supabase
        .from('community_posts')
        .select('id, content, created_at')
        .eq('user_id', user.id)
        .or('content.ilike.%wellness%,content.ilike.%health%,content.ilike.%symptom%')
        .order('created_at', { ascending: false })
        .limit(5);

      const reportData = {
        user: userData,
        profile: profileData || {},
        symptoms: symptoms || [],
        wellnessPosts: wellnessPosts || [],
        stats: {
          symptomsCount: symptoms?.length || 0,
          wellnessPostsCount: wellnessPosts?.length || 0
        }
      };

      setReportData(reportData);
      createPDF(reportData);
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const createPDF = (data: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Colors - Updated to match new color scheme
    const primaryColor: [number, number, number] = [70, 189, 182]; // #46bdb6 - Primary (for text)
    const secondaryColor: [number, number, number] = [250, 160, 204]; // #faa0cc - Secondary (for backgrounds)
    const textColor: [number, number, number] = [55, 65, 81]; // Gray

    // Header - using secondary color for background
    doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('MyMenoSakhi', 20, 25);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Wellness Report', 20, 35);

    yPosition = 60;

    // User Information
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Profile Summary', 20, yPosition);
    yPosition += 15;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${data.user?.full_name || 'N/A'}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Email: ${data.user?.email || 'N/A'}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Location: ${data.profile?.location || 'Not specified'}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Bio: ${data.profile?.bio || 'No bio available'}`, 20, yPosition);
    yPosition += 15;

    // AI Generated Health Report
    if (aiReport) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('AI Generated Health Report', 20, yPosition);
      yPosition += 15;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      
      // Remove markdown formatting and split into lines
      const cleanReport = aiReport
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
        .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
        .replace(/#{1,6}\s*/g, '') // Remove headers
        .replace(/- /g, '• ') // Convert dashes to bullets
        .replace(/\n\n/g, '\n') // Remove extra line breaks
        .trim();

      const lines = doc.splitTextToSize(cleanReport, pageWidth - 40);
      
      lines.forEach((line: string) => {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, 20, yPosition);
        yPosition += 6;
      });
      
      yPosition += 15;
    }

    // Wellness Statistics
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Wellness Statistics', 20, yPosition);
    yPosition += 15;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Symptoms Tracked: ${data.stats.symptomsCount}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Wellness Posts: ${data.stats.wellnessPostsCount}`, 20, yPosition);
    yPosition += 15;

    // Recent Symptoms
    if (data.symptoms.length > 0) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Recent Symptoms Tracked', 20, yPosition);
      yPosition += 15;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      data.symptoms.forEach((symptom: any, index: number) => {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = 20;
        }
        
        const symptomDate = new Date(symptom.recorded_at).toLocaleDateString();
        doc.text(`${index + 1}. ${symptom.symptom_type || 'Symptom'} (Severity: ${symptom.severity}/10)`, 20, yPosition);
        yPosition += 6;
        doc.text(`   Recorded on: ${symptomDate}`, 25, yPosition);
        if (symptom.notes) {
          yPosition += 6;
          doc.text(`   Notes: ${symptom.notes.substring(0, 60)}...`, 25, yPosition);
        }
        yPosition += 10;
      });
      yPosition += 10;
    }

    // Recent Wellness Posts
    if (data.wellnessPosts.length > 0) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Recent Wellness Posts', 20, yPosition);
      yPosition += 15;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      data.wellnessPosts.forEach((post: any, index: number) => {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = 20;
        }
        
        const postDate = new Date(post.created_at).toLocaleDateString();
        doc.text(`${index + 1}. ${post.content.substring(0, 80)}...`, 20, yPosition);
        yPosition += 6;
        doc.text(`   Posted on: ${postDate}`, 25, yPosition);
        yPosition += 10;
      });
      yPosition += 10;
    }


    // Footer
    const footerY = pageHeight - 20;
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, footerY);
    doc.text('MyMenoSakhi - Your Wellness Companion', pageWidth - 100, footerY);

    // Download the PDF
    const fileName = `wellness-report-${data.user?.full_name?.replace(/\s+/g, '-').toLowerCase() || 'user'}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    toast.success('Report generated and downloaded successfully!');

    // Create notification for PDF report generation
    if ((window as any).createNotification) {
      (window as any).createNotification(
        'PDF Report Downloaded',
        'Your comprehensive wellness report has been downloaded',
        'report',
        '/profile?tab=reports'
      );
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-800 border-0 shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl text-white">
          <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
          Generate Wellness Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-white/80">
          Generate a comprehensive PDF report of your wellness journey including your profile, 
          activity statistics, and recent posts and videos.
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <Activity className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-medium text-white">Activity Stats</div>
              <div className="text-xs text-white/80">Posts, videos, views</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <MessageCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-medium text-white">Recent Posts</div>
              <div className="text-xs text-white/80">Community activity</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <Video className="w-4 h-4 text-purple-600 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-medium text-white">Video Content</div>
              <div className="text-xs text-white/80">Published videos</div>
            </div>
          </div>
        </div>

        <Button 
          onClick={generateReport}
          disabled={isGenerating}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 h-10 sm:h-11"
        >
          {isGenerating ? (
            <>
              <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              <span className="text-sm sm:text-base">Generating Report...</span>
            </>
          ) : (
            <>
              <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              <span className="text-sm sm:text-base">Download PDF Report</span>
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PDFReportGenerator;
