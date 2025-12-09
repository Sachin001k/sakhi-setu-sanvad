import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Heart, Sparkles, Users, Shield, ArrowLeft } from 'lucide-react';
import { LoginForm } from '@/components/auth/LoginForm';
import EnhancedSignupForm from '@/components/auth/EnhancedSignupForm';
import GoogleTranslate from '@/components/GoogleTranslate';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const AuthPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'radial-gradient(circle at center, #ffffff 0%, #ffcdcd 100%)' }}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 border-4 rounded-full animate-spin" style={{ borderColor: 'rgba(250, 160, 204, 0.3)', borderTopColor: '#faa0cc' }}></div>
          <p className="font-medium" style={{ color: '#46bdb6' }}>Loading...</p>
        </motion.div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  const floatingElements = [
    { icon: Heart, delay: 0, x: 20, y: 20 },
    { icon: Sparkles, delay: 0.5, x: -30, y: 40 },
    { icon: Users, delay: 1, x: 40, y: -20 },
    { icon: Shield, delay: 1.5, x: -20, y: -30 },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'radial-gradient(circle at center, #ffffff 0%, #ffcdcd 100%)' }}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Orbs */}
        <motion.div
          className="absolute top-20 left-20 w-72 h-72 rounded-full blur-3xl"
          style={{ backgroundColor: 'rgba(250, 160, 204, 0.3)' }}
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-40 right-20 w-96 h-96 rounded-full blur-3xl"
          style={{ backgroundColor: 'rgba(70, 189, 182, 0.3)' }}
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
            scale: [1, 0.8, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 left-1/3 w-80 h-80 rounded-full blur-3xl"
          style={{ backgroundColor: 'rgba(255, 205, 205, 0.3)' }}
          animate={{
            x: [0, 60, 0],
            y: [0, -40, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Floating Icons */}
        {floatingElements.map((element, index) => {
          const Icon = element.icon;
          return (
            <motion.div
              key={index}
              className="absolute"
              style={{
                left: `${20 + element.x}%`,
                top: `${30 + element.y}%`,
                color: 'rgba(250, 160, 204, 0.2)',
              }}
              animate={{
                y: [0, -20, 0],
                rotate: [0, 10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 4 + index,
                repeat: Infinity,
                ease: "easeInOut",
                delay: element.delay,
              }}
            >
              <Icon className="w-16 h-16" />
            </motion.div>
          );
        })}

        {/* Animated Particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: 'rgba(250, 160, 204, 0.4)',
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 pt-6 pb-4 px-6"
      >
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <motion.div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="p-2 rounded-xl"
              style={{ backgroundColor: 'rgba(250, 160, 204, 0.1)' }}
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <Heart className="w-8 h-8" style={{ color: '#faa0cc' }} />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#46bdb6' }}>MyMenoSakhi</h1>
              <p className="text-sm" style={{ color: '#46bdb6' }}>Your Menopause Companion</p>
            </div>
          </motion.div>
          <div className="flex items-center gap-4">
            <GoogleTranslate />
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)] px-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <Card className="backdrop-blur-lg border-0 shadow-2xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
            <CardHeader className="text-center pb-6">
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex justify-center mb-4"
              >
                <div className="p-4 rounded-full" style={{ background: 'linear-gradient(to right, #faa0cc, #46bdb6)' }}>
                  <Heart className="w-8 h-8 text-white" />
                </div>
              </motion.div>
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <CardTitle className="text-2xl font-bold" style={{ background: 'linear-gradient(to right, #faa0cc, #46bdb6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Welcome Back
                </CardTitle>
                <CardDescription className="mt-2" style={{ color: '#46bdb6' }}>
                  Sign in to continue your wellness journey
                </CardDescription>
              </motion.div>
            </CardHeader>
            
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login" className="flex items-center gap-2">
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="flex items-center gap-2">
                    Sign Up
                  </TabsTrigger>
                </TabsList>
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <TabsContent value="login" className="mt-0">
                      <LoginForm onSwitchToSignup={() => setActiveTab('signup')} />
                    </TabsContent>
                    
                    <TabsContent value="signup" className="mt-0">
                      <EnhancedSignupForm />
                    </TabsContent>
                  </motion.div>
                </AnimatePresence>
              </Tabs>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-6"
          >
            <p className="text-sm" style={{ color: '#46bdb6' }}>
              By continuing, you agree to our{' '}
              <span className="font-medium cursor-pointer hover:underline" style={{ color: '#faa0cc' }}>
                Terms of Service
              </span>{' '}
              and{' '}
              <span className="font-medium cursor-pointer hover:underline" style={{ color: '#faa0cc' }}>
                Privacy Policy
              </span>
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="relative z-10 text-center pb-6"
      >
        <p className="text-sm" style={{ color: '#46bdb6' }}>
          © 2025 MyMenoSakhi. Empowering women through their menopause journey.
        </p>
      </motion.footer>
    </div>
  );
};

export default AuthPage;
