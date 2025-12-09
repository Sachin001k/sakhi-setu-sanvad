import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import { CommunityChat } from "@/components/CommunityChat";
import VoiceAssistant from "@/components/VoiceAssistant";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

const Community = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [showAssistant, setShowAssistant] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary-light/20 to-primary-glow/30 pb-24">
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="pt-8 pb-6 px-6"
      >
        <div className="flex items-center gap-4 mb-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/")}
            className="hover:bg-primary/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <motion.div 
              className="p-2 bg-secondary/20 rounded-xl"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <MessageCircle className="w-6 h-6 text-secondary" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold text-black">Community Chat</h1>
              <p className="text-black/70 mt-1 dark:text-black">Together we are stronger</p>
            </div>
          </div>
        </div>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-6 space-y-8"
      >
        <div className="rounded-3xl bg-white/80 dark:bg-gray-900/60 p-6 shadow-2xl">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-foreground dark:text-white">Community Conversations</h2>
            <p className="text-black/70 mt-1 dark:text-white/70">
              Share updates, tips, and encouragement with women across the community.
            </p>
          </div>
          <CommunityChat />
        </div>
        <div className="rounded-3xl bg-white/80 dark:bg-gray-900/60 p-6 shadow-2xl">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-foreground dark:text-white">AI Assistant</h2>
              <p className="text-black/70 dark:text-white/70 mt-1">
                Ask questions, get reminders, or chat through menopause moments with AI.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAssistant((prev) => !prev)}
              className="text-xs"
            >
              {showAssistant ? 'Hide AI Assistant' : 'Show AI Assistant'}
            </Button>
          </div>
          {showAssistant ? (
            <VoiceAssistant />
          ) : (
            <p className="text-gray-600 dark:text-gray-300">
              Tap “Show AI Assistant” to open the voice bot without leaving the community space.
            </p>
          )}
        </div>
      </motion.div>

      <Navigation />
    </div>
  );
};

export default Community;
