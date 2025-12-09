import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/Navigation";
import { User, Settings, Bell, Shield, Heart, LogOut, ChevronRight, ArrowLeft, FileText, Video } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import HealthReports from "@/components/HealthReports";
import PHCDirectory from "@/components/PHCDirectory";
import { EditProfileForm } from "@/components/EditProfileForm";
import EnhancedProfile from "@/components/EnhancedProfile";
import VideoLibrary from "@/components/VideoLibrary";
import EnhancedChat from "@/components/EnhancedChat";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      setProfileLoading(true);
      // Fetch from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        throw userError;
      }

      // Fetch from user_profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      setUserProfile({
        ...(userData || {}),
        ...(profileData || {}),
        email: user.email,
        avatar_url: user.user_metadata?.avatar_url
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to load profile data');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleEditProfile = () => {
    setActiveTab("edit");
  };

  const handleLogout = async () => {
    await signOut();
    toast.success("Logged out successfully!", {
      description: "See you soon! Take care of yourself.",
    });
  };

  // All hooks must be called before any conditional returns
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  useEffect(() => {
    const handleSwitchToEditTab = () => {
      setActiveTab('edit');
    };

    window.addEventListener('switchToEditTab', handleSwitchToEditTab);
    return () => {
      window.removeEventListener('switchToEditTab', handleSwitchToEditTab);
    };
  }, []);

  // Now handle conditional rendering after all hooks
  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }
  
  const menuItems = [
    { 
      icon: Settings, 
      label: "Settings",
      onClick: () => toast.info("Settings page coming soon!"),
    },
    { 
      icon: Bell, 
      label: "Notifications",
      onClick: () => toast.info("Notification preferences coming soon!"),
    },
    { 
      icon: Shield, 
      label: "Privacy",
      onClick: () => toast.info("Privacy settings coming soon!"),
    },
    { 
      icon: Heart, 
      label: "Wellness Goals",
      onClick: () => toast.success("Set your wellness goals!"),
    },
    { 
      icon: LogOut, 
      label: "Sign Out",
      onClick: handleLogout,
      isDestructive: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-glow/20 to-accent/30 pb-24">
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="pt-4 sm:pt-8 pb-4 sm:pb-6 px-4 sm:px-6"
      >
        <div className="flex items-center gap-2 sm:gap-4 mb-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/dashboard")}
            className="hover:bg-primary/10 h-8 w-8 sm:h-10 sm:w-10"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold">My Profile</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">Manage your information</p>
          </div>
          <div className="flex gap-1 sm:gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  title="Sign Out"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 sm:h-10 sm:w-10"
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
                    onClick={handleLogout}
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


      {/* Tabs for different sections */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="px-4 sm:px-6"
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 gap-3 h-auto overflow-x-auto">
            <TabsTrigger value="profile" className="flex flex-col items-center justify-center gap-1 text-xs sm:text-sm py-3 px-2 rounded-xl">
              <User className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="edit" className="flex flex-col items-center justify-center gap-1 text-xs sm:text-sm py-3 px-2 rounded-xl">
              <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Edit</span>
            </TabsTrigger>
            <TabsTrigger value="library" className="flex flex-col items-center justify-center gap-1 text-xs sm:text-sm py-3 px-2 rounded-xl">
              <Video className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Videos</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex flex-col items-center justify-center gap-1 text-xs sm:text-sm py-3 px-2 rounded-xl">
              <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="mt-6">
            <EnhancedProfile />
          </TabsContent>
          
          <TabsContent value="edit" className="mt-6">
            <EditProfileForm />
          </TabsContent>
          
          <TabsContent value="library" className="mt-6">
            <VideoLibrary />
          </TabsContent>
          
          {/* Chat tab hidden but kept for future use */}
          {/* <TabsContent value="chat" className="mt-6">
            <EnhancedChat />
          </TabsContent> */}
          
          <TabsContent value="reports" className="mt-6">
            <HealthReports />
          </TabsContent>
          
          
        </Tabs>
      </motion.div>

      <Navigation />
    </div>
  );
};

export default Profile;
