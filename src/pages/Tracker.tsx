import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { SymptomTracker } from "@/components/SymptomTracker";
import { AIAnalytics } from "@/components/AIAnalytics";
import Reminders from "@/components/Reminders";
import { Activity, ArrowLeft, Brain, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Tracker = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 pb-24">
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
            className="hover:bg-purple-500/20 text-gray-700 hover:text-purple-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Health Tracker</h1>
            <p className="text-purple-600 mt-1">Track symptoms and get AI insights</p>
          </div>
        </div>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-6"
      >
        <Tabs defaultValue="tracker" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tracker" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Track Symptoms
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Analytics
          </TabsTrigger>
          <TabsTrigger value="reminders" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Reminders
          </TabsTrigger>
        </TabsList>
          
        <TabsContent value="tracker" className="mt-6">
          <SymptomTracker />
        </TabsContent>
         
        <TabsContent value="analytics" className="mt-6">
          <AIAnalytics />
        </TabsContent>
        
        <TabsContent value="reminders" className="mt-6">
          <Reminders />
        </TabsContent>
      </Tabs>
      </motion.div>

      <Navigation />
    </div>
  );
};

export default Tracker;
