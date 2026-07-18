import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { ResourceRepository } from "@/components/ResourceRepository";
import { BookOpen, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ResponsiveHeader from "@/components/ResponsiveHeader";

const Resources = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-energy-light/30 pb-24">
      {!user && <ResponsiveHeader />}

      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`pb-4 sm:pb-6 px-4 sm:px-6 ${user ? 'pt-4 sm:pt-8' : 'pt-28 sm:pt-32'}`}
      >
        <div className="flex items-center gap-2 sm:gap-4 mb-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(user ? "/dashboard" : "/")}
            className="hover:bg-primary/10 h-8 w-8 sm:h-10 sm:w-10"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <motion.div 
              className="p-1.5 sm:p-2 bg-energy/20 rounded-xl flex-shrink-0"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <BookOpen className="w-4 h-4 sm:w-6 sm:h-6 text-energy" />
            </motion.div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-3xl font-bold truncate">Resource Center</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                {user ? 'Learn and grow' : 'Browse the same wellness resources before signing in'}
              </p>
            </div>
          </div>
        </div>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-6"
      >
        <ResourceRepository />
      </motion.div>

      {user && <Navigation />}
    </div>
  );
};

export default Resources;
