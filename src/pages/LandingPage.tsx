import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Shield, Users, BookOpen, Brain, Phone, MapPin, Clock, Star, Sparkles, ArrowRight, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Background3D from '@/components/3D/Background3D';
import ParticlesBackground from '@/components/3D/Particles';
import ResponsiveHeader from '@/components/ResponsiveHeader';
import ResponsiveFooter from '@/components/ResponsiveFooter';
import { supabase } from '@/integrations/supabase/client';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactStatus, setContactStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [contactError, setContactError] = useState('');

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
          <div className="w-16 h-16 border-4 border-[#faa0cc]/30 border-t-[#faa0cc] rounded-full animate-spin"></div>
          <p className="text-[#46bdb6] font-medium">Loading...</p>
        </motion.div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  const handleContactChange = (field: keyof typeof contactForm, value: string) => {
    setContactForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleContactSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = contactForm.name.trim();
    const trimmedEmail = contactForm.email.trim();
    const trimmedMessage = contactForm.message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      setContactError('Please fill in all fields before submitting.');
      setContactStatus('error');
      return;
    }

    setContactStatus('submitting');
    setContactError('');

    const { error } = await supabase.from('contact_messages').insert([
      {
        full_name: trimmedName,
        email: trimmedEmail,
        message: trimmedMessage,
        source: 'landing_page'
      }
    ]);

    if (error) {
      setContactError(error.message);
      setContactStatus('error');
      return;
    }

    setContactStatus('success');
    setContactForm({ name: '', email: '', message: '' });
  };

  const isContactFormValid =
    Boolean(contactForm.name.trim() && contactForm.email.trim() && contactForm.message.trim());
  const isSubmitDisabled = contactStatus === 'submitting' || !isContactFormValid;

  const features = [
    {
      icon: Heart,
      title: 'Symptom Tracking',
      description: 'Track your menopause symptoms with AI-powered insights',
      color: '#faa0cc',
      bgColor: 'rgba(250, 160, 204, 0.1)'
    },
    {
      icon: Brain,
      title: 'AI Analytics',
      description: 'Get personalized recommendations based on your data',
      color: '#46bdb6',
      bgColor: 'rgba(70, 189, 182, 0.1)'
    },
    {
      icon: Users,
      title: 'Community Support',
      description: 'Connect with other women going through similar experiences',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      icon: BookOpen,
      title: 'Educational Resources',
      description: 'Access expert talks, videos, and articles in Marathi & Hindi',
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      icon: Phone,
      title: 'Voice Assistant',
      description: 'Interact with our Marathi chatbot for instant support',
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    },
    {
      icon: MapPin,
      title: 'PHC Directory',
      description: 'Find nearby Primary Health Centers and healthcare providers',
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20'
    }
  ];


  const floatingElements = [
    { icon: Heart, delay: 0, x: 10, y: 20, size: 'w-8 h-8' },
    { icon: Sparkles, delay: 0.5, x: 80, y: 30, size: 'w-6 h-6' },
    { icon: Users, delay: 1, x: 20, y: 70, size: 'w-7 h-7' },
    { icon: Brain, delay: 1.5, x: 70, y: 80, size: 'w-5 h-5' },
    { icon: Shield, delay: 2, x: 30, y: 40, size: 'w-6 h-6' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'radial-gradient(circle at center, #ffffff 0%, #ffcdcd 100%)' }}>

      {/* Responsive Header */}
      <ResponsiveHeader />
      
      {/* 3D Background */}
      <Background3D />
      
      {/* Particles Background */}
      <ParticlesBackground />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Orbs */}
        <motion.div
          className="absolute top-20 left-20 w-96 h-96 rounded-full blur-3xl"
          style={{ backgroundColor: 'rgba(250, 160, 204, 0.2)' }}
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
          className="absolute top-40 right-20 w-80 h-80 rounded-full blur-3xl"
          style={{ backgroundColor: 'rgba(70, 189, 182, 0.2)' }}
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
          className="absolute bottom-20 left-1/3 w-72 h-72 rounded-full blur-3xl"
          style={{ backgroundColor: 'rgba(255, 205, 205, 0.2)' }}
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
              className={`absolute ${element.size}`}
              style={{
                left: `${element.x}%`,
                top: `${element.y}%`,
                color: 'rgba(250, 160, 204, 0.3)',
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
              <Icon className="w-full h-full" />
            </motion.div>
          );
        })}

        {/* Animated Particles */}
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
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


      {/* Hero Section */}
      <motion.section
        id="home"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative z-10 px-6 py-20 pt-32 text-center"
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Text content */}
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="text-left lg:text-left"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Badge className="mb-4" style={{ backgroundColor: 'rgba(250, 160, 204, 0.1)', color: '#faa0cc', borderColor: 'rgba(250, 160, 204, 0.3)' }}>
                  🛡️ Trusted by 10,000+ Women
                </Badge>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
                style={{ color: '#46bdb6' }}
              >
                Your Journey Through
                <span style={{ background: 'linear-gradient(to right, #faa0cc, #46bdb6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}> Menopause</span>
                <br />Starts Here
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-lg md:text-xl mb-8 leading-relaxed"
                style={{ color: '#46bdb6' }}
              >
                Personalized, culturally relevant wellness support for women in India.
                Track symptoms, get AI insights, and connect with a supportive community.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    size="lg" 
                    onClick={() => navigate('/auth')}
                    className="text-white text-lg px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300"
                    style={{ backgroundColor: '#faa0cc' }}
                  >
                    Start Your Journey
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    size="lg" 
                    variant="outline"
                    onClick={() => navigate('/auth')}
                    className="text-lg px-8 py-3 border-2 transition-all duration-300"
                    style={{ borderColor: '#faa0cc', color: '#faa0cc' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#faa0cc';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#faa0cc';
                    }}
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Watch Demo
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Right side - Hero Image */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="relative"
            >
              <div className="relative w-full h-96 lg:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="/images/home-main.png"
                  alt="MyMenoSakhi - Menopause Support"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
              {/* Floating elements around the image */}
              <motion.div
                className="absolute -top-4 -right-4 w-20 h-20 rounded-full blur-xl"
                style={{ backgroundColor: 'rgba(250, 160, 204, 0.2)' }}
                animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full blur-xl"
                style={{ backgroundColor: 'rgba(70, 189, 182, 0.2)' }}
                animate={{ scale: [1.2, 1, 1.2], rotate: [360, 180, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        id="features"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative z-10 px-6 py-16 backdrop-blur-sm"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}
      >
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center mb-16"
          >
            <h3 className="text-3xl font-bold mb-4" style={{ color: '#46bdb6' }}>
              Everything You Need for Your Menopause Journey
            </h3>
            <p className="text-lg" style={{ color: '#46bdb6' }}>
              Comprehensive support designed specifically for Indian women
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                >
                  <Card className="h-full hover:shadow-2xl transition-all duration-300 border-0 backdrop-blur-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
                    <CardContent className="p-6 text-center">
                      <motion.div
                        className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: feature.bgColor }}
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        transition={{ duration: 0.6 }}
                      >
                        <Icon className="w-8 h-8" style={{ color: feature.color }} />
                      </motion.div>
                      <h4 className="text-xl font-semibold mb-3" style={{ color: '#46bdb6' }}>{feature.title}</h4>
                      <p style={{ color: '#46bdb6' }}>{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>


      {/* CTA Section */}
      <motion.section
        id="about"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="relative z-10 px-6 py-16 text-white"
        style={{ background: 'linear-gradient(to right, #46bdb6, #faa0cc)' }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="text-3xl font-bold mb-4"
          >
            Ready to Take Control of Your Menopause Journey?
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="text-xl mb-8 opacity-90"
          >
            Join thousands of women who are already using MyMenoSakhi to navigate menopause with confidence.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="text-lg px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300"
              style={{ backgroundColor: 'white', color: '#faa0cc' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
              }}
            >
              Get Started Today
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </motion.section>

      {/* Testimonials Section - temporarily hidden */}
      {false && (
        <motion.section
          id="testimonials"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="py-20"
          style={{ background: 'radial-gradient(circle at center, #ffffff 0%, #ffcdcd 100%)' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl sm:text-5xl font-bold mb-4" style={{ color: '#46bdb6' }}>
                What Our Users Say
              </h2>
              <p className="text-xl max-w-3xl mx-auto" style={{ color: '#46bdb6' }}>
                Join thousands of women who have found support and guidance through their menopause journey
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  name: "Priya Sharma",
                  location: "Mumbai, India",
                  content: "MyMenoSakhi has been a lifesaver during my menopause journey. The symptom tracking and AI insights helped me understand my body better.",
                  rating: 5
                },
                {
                  name: "Anita Patel",
                  location: "Delhi, India",
                  content: "The community support is incredible. I never felt alone in this journey thanks to the amazing women I've connected with here.",
                  rating: 5
                },
                {
                  name: "Sunita Reddy",
                  location: "Bangalore, India",
                  content: "The educational resources and expert guidance have empowered me to take control of my health and well-being.",
                  rating: 5
                }
              ].map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  className="rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
                  style={{ backgroundColor: 'white' }}
                >
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="mb-4 italic" style={{ color: '#46bdb6' }}>
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: 'rgba(250, 160, 204, 0.1)' }}>
                      <Heart className="w-5 h-5" style={{ color: '#faa0cc' }} />
                    </div>
                    <div>
                      <h4 className="font-semibold" style={{ color: '#46bdb6' }}>{testimonial.name}</h4>
                      <p className="text-sm" style={{ color: '#46bdb6' }}>{testimonial.location}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* Contact Section */}
      <motion.section
        id="contact"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-20"
        style={{ backgroundColor: 'white' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4" style={{ color: '#46bdb6' }}>
              Get in Touch
            </h2>
            <p className="text-xl max-w-3xl mx-auto" style={{ color: '#46bdb6' }}>
              Have questions? We're here to help you on your menopause journey
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(250, 160, 204, 0.1)' }}>
                  <MapPin className="w-6 h-6" style={{ color: '#faa0cc' }} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2" style={{ color: '#46bdb6' }}>Office Address</h3>
                  <p style={{ color: '#46bdb6' }}>
                    123 Health Street<br />
                    Mumbai, Maharashtra 400001<br />
                    India
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(250, 160, 204, 0.1)' }}>
                  <Clock className="w-6 h-6" style={{ color: '#faa0cc' }} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2" style={{ color: '#46bdb6' }}>Response Time</h3>
                  <p style={{ color: '#46bdb6' }}>Within 24 hours</p>
                  <p className="text-sm" style={{ color: '#46bdb6' }}>We respond to all inquiries promptly</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="rounded-2xl p-8"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
            >
              <h3 className="text-2xl font-bold mb-6" style={{ color: '#46bdb6' }}>Send us a Message</h3>
              <form className="space-y-6" onSubmit={handleContactSubmit}>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46bdb6' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={contactForm.name}
                    onChange={(event) => handleContactChange('name', event.target.value)}
                    className="w-full px-4 py-3 border rounded-lg bg-white text-[#46bdb6]"
                    style={{ borderColor: '#46bdb6' }}
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46bdb6' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={(event) => handleContactChange('email', event.target.value)}
                    className="w-full px-4 py-3 border rounded-lg bg-white text-[#46bdb6]"
                    style={{ borderColor: '#46bdb6' }}
                    placeholder="your.email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46bdb6' }}>
                    Message
                  </label>
                  <textarea
                    rows={4}
                    value={contactForm.message}
                    onChange={(event) => handleContactChange('message', event.target.value)}
                    className="w-full px-4 py-3 border rounded-lg bg-white text-[#46bdb6]"
                    style={{ borderColor: '#46bdb6' }}
                    placeholder="Tell us how we can help you..."
                  ></textarea>
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitDisabled}
                  className="w-full text-white py-3 text-lg disabled:opacity-70 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#faa0cc' }}
                >
                  {contactStatus === 'submitting' ? 'Sending...' : 'Send Message'}
                </Button>
                {contactStatus === 'success' && (
                  <p className="text-sm text-emerald-500">
                    Thank you! Your message has been received and we will respond shortly.
                  </p>
                )}
                {contactStatus === 'error' && contactError && (
                  <p className="text-sm text-red-500">{contactError}</p>
                )}
              </form>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Responsive Footer */}
      <ResponsiveFooter />
    </div>
  );
};

export default LandingPage;
