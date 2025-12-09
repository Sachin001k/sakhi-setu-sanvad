import { Link, useLocation } from "react-router-dom";
import { Home, Activity, Users, BookOpen, User, Video } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const Navigation = () => {
  const location = useLocation();
  const { user } = useAuth();

  // Don't show navigation if user is not authenticated
  if (!user) {
    return null;
  }
  
        const navItems = [
          { path: "/dashboard", icon: Home, label: "Home" },
          { path: "/tracker", icon: Activity, label: "Tracker" },
          { path: "/community", icon: Users, label: "Community Chat" },
          { path: "/resources", icon: BookOpen, label: "Resources" },
          { path: "/library", icon: Video, label: "Community Contributions" },
          { path: "/profile", icon: User, label: "Profile" },
        ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-50 safe-area-pb">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex justify-around items-center py-2 sm:py-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link key={item.path} to={item.path} className="relative flex-1">
                <motion.div
                  className={`flex flex-col items-center gap-1 px-2 sm:px-4 py-2 rounded-xl transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-primary/10 rounded-xl"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 relative z-10" />
                  <span className="text-xs font-medium relative z-10 hidden xs:block">{item.label}</span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
