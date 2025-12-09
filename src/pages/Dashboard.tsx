import { motion } from "framer-motion";
import { Heart, TrendingUp, Users, Sparkles, Calendar, LogOut, FileText, MapPin, Mic, Clock, Video, MessageCircle } from "lucide-react";
import NotificationBell from '@/components/NotificationBell';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import GoogleTranslate from "@/components/GoogleTranslate";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useEffect, useState, useCallback } from "react";
import RecentActivity from "@/components/RecentActivity";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();
  const [wellnessTip, setWellnessTip] = useState<{ title: string; content: string } | null>(null);
  const [hasSymptoms, setHasSymptoms] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const fetchUserData = useCallback(async () => {
    if (!user) return;
    
    try {
      // Check if user has logged any symptoms
      const { data: symptoms, error } = await supabase
        .from('symptoms')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (!error && symptoms && symptoms.length > 0) {
        setHasSymptoms(true);
      } else {
        setHasSymptoms(false);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }, [user]);

  useEffect(() => {
    const fetchTip = async () => {
      if (typeof window === "undefined") return;

      try {
        const { data, error } = await supabase
          .from("wellness_tips")
          .select("title, content")
        

        if (error) {
          console.error("Failed to load wellness tips:", error);
          return;
        }

        if (!data || data.length === 0) return;
        console.log("Wellness tips fetched:", data);

        const randomTip = data[Math.floor(Math.random() * data.length)];
        setWellnessTip({ title: randomTip.title, content: randomTip.content });
      } catch (error) {
        console.error("Failed to fetch wellness tip:", error);
      }
    };

    if (user) {
      fetchUserData();
      fetchTip();
    }
  }, [user, fetchUserData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  const insights = [
    {
      icon: Heart,
      title: "Today's Advice",
      description: "Practice 10 minutes of meditation",
      bgColor: "bg-primary-light",
      iconColor: "text-primary",
      onClick: () => {
        toast.success("Great choice! Let's meditate together");
        navigate("/resources");
      },
    },
    {
      icon: TrendingUp,
      title: "Your Trend",
      description: "Sleep quality has improved",
      bgColor: "bg-energy-light",
      iconColor: "text-energy",
      onClick: () => {
        toast.info("View your detailed progress");
        navigate("/tracker");
      },
    },
    {
      icon: Users,
      title: "Community Chat",
      description: "New messages available",
      bgColor: "bg-secondary-light",
      iconColor: "text-secondary",
      onClick: () => {
        navigate("/community");
      },
    },
  ];

  const quickActions = [
    {
      icon: Calendar,
      title: "Log Symptoms",
      description: "Track your daily symptoms",
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      onClick: () => navigate("/tracker")
    },
    {
      icon: Heart,
      title: "Exercise",
      description: "Start your workout",
      color: "text-green-500",
      bgColor: "bg-green-50",
      onClick: () => navigate("/resources")
    },
    {
      icon: FileText,
      title: "Health Reports",
      description: "View your reports",
      color: "text-purple-500",
      bgColor: "bg-purple-50",
      onClick: () => navigate("/profile")
    },
    {
      icon: MapPin,
      title: "Find PHC",
      description: "Locate health centers",
      color: "text-red-500",
      bgColor: "bg-red-50",
      onClick: () => navigate("/resources")
    },
    {
      icon: Mic,
      title: "Voice Assistant",
      description: "Chat with AI",
      color: "text-orange-500",
      bgColor: "bg-orange-50",
      onClick: () => navigate("/community")
    },
    {
      icon: Clock,
      title: "Reminders",
      description: "Set wellness reminders",
      color: "text-indigo-500",
      bgColor: "bg-indigo-50",
      onClick: () => navigate("/profile")
    },
    {
      icon: Video,
      title: "Community Contributions",
      description: "Share wellness content with others",
      color: "text-pink-500",
      bgColor: "bg-pink-50",
      onClick: () => navigate("/library")
    },
    {
      icon: MessageCircle,
      title: "Community Chat",
      description: "Connect with others",
      color: "text-teal-500",
      bgColor: "bg-teal-50",
      onClick: () => navigate("/community")
    }
  ];

  const handleLearnMore = () => {
    toast.success("Opening wellness insights...");
    setTimeout(() => navigate("/resources"), 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-glow/20 to-secondary-light/30 pb-24">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="pt-4 sm:pt-8 pb-4 sm:pb-6 px-4 sm:px-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground truncate">
              Welcome {user.user_metadata?.full_name || 'User'} 🌸
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1">Your wellness journey starts here</p>
          </div>
          <div className="flex gap-1 sm:gap-2 flex-wrap">
            <GoogleTranslate />
            {/* <ThemeToggle /> */}
            <NotificationBell />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  title="Sign Out"
                  className="h-8 w-8 sm:h-10 sm:w-10"
                >
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="mx-4 max-w-sm sm:max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to sign out?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You will be logged out of your account and redirected to the login page. Any unsaved changes will be lost.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                  <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={signOut}
                    className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                  >
                    Sign Out
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </motion.header>

      {/* Hero Card */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="px-4 sm:px-6 mb-6 sm:mb-8"
      >
        <Card className="glass-card p-4 sm:p-6 relative overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <motion.div 
                className="p-2 sm:p-3 bg-primary/20 rounded-2xl flex-shrink-0"
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
              >
                <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-primary" />
              </motion.div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl font-bold">Today's Wellness Tip</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">AI-powered insight</p>
              </div>
            </div>
            <p className="text-sm sm:text-base text-foreground leading-relaxed">
              {wellnessTip ? (
                <>
                  <span className="font-semibold">{wellnessTip.title}</span>
                  <br />
                  {wellnessTip.content}
                </>
              ) : (
                "Start tracking your symptoms to get personalized wellness insights and recommendations!"
              )}
            </p>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                className="mt-3 sm:mt-4 bg-primary hover:bg-primary/90 text-sm sm:text-base w-full sm:w-auto"
                onClick={handleLearnMore}
              >
                Learn More
              </Button>
            </motion.div>
          </div>
        </Card>
      </motion.div>

      {/* Insights Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="px-4 sm:px-6 mb-6 sm:mb-8"
      >
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Quick Insights</h3>
        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          {insights.map((insight, index) => {
            const Icon = insight.icon;
            return (
              <motion.div key={index} variants={item}>
                <Card 
                  className="glass-card p-3 sm:p-5 hover:shadow-lg transition-all cursor-pointer group"
                  onClick={insight.onClick}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <motion.div 
                      className={`p-2 sm:p-3 ${insight.bgColor} rounded-xl flex-shrink-0`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${insight.iconColor}`} />
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors">
                        {insight.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">{insight.description}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="px-4 sm:px-6"
      >
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  className="p-3 sm:p-4 cursor-pointer hover:shadow-lg transition-all group"
                  onClick={action.onClick}
                >
                  <div className="flex flex-col items-center text-center gap-1 sm:gap-2">
                    <div className={`p-2 sm:p-3 rounded-full ${action.bgColor} group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-4 h-4 sm:w-6 sm:h-6 ${action.color}`} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-medium text-xs sm:text-sm truncate">{action.title}</h4>
                      <p className="text-xs text-gray-600 line-clamp-2">{action.description}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="px-4 sm:px-6 pt-6 sm:pt-8"
      >
        <RecentActivity />
      </motion.div>

      <Navigation />
    </div>
  );
};

export default Dashboard;
