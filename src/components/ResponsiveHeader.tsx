import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Heart, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GoogleTranslate from '@/components/GoogleTranslate';

const ResponsiveHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const menuItems = [
    { label: 'Home', href: '#home' },
    { label: 'Features', href: '#features' },
    { label: 'Resources', href: '/resources' },
    // { label: 'Testimonials', href: '#testimonials' }, // temporarily hidden
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' },
  ];

  const scrollToSection = (href: string) => {
    if (href.startsWith('/')) {
      navigate(href);
      setIsMenuOpen(false);
      return;
    }

    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      // If section doesn't exist on current page, navigate to landing page
      if (window.location.pathname !== '/') {
        navigate('/');
        // Wait for navigation to complete, then scroll to section
        setTimeout(() => {
          const targetElement = document.querySelector(href);
          if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    }
    setIsMenuOpen(false);
  };

  return (
    <>
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg border-b"
      style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(70, 189, 182, 0.2)' }}
    >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 min-h-16 py-3">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3 cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => scrollToSection('#home')}
          >
            <motion.div
              className="p-2 rounded-xl"
              style={{ backgroundColor: 'rgba(250, 160, 204, 0.1)' }}
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <Heart className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: '#faa0cc' }} />
            </motion.div>
            <div className="hidden sm:block">
              <h1 className="text-xl sm:text-2xl font-bold" style={{ color: '#46bdb6' }}>
                MyMenoSakhi
              </h1>
              <p className="text-xs sm:text-sm" style={{ color: '#46bdb6' }}>
                Your Menopause Companion
              </p>
            </div>
            <div className="sm:hidden">
              <h1 className="text-lg font-bold" style={{ color: '#46bdb6' }}>
                MyMenoSakhi
              </h1>
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {menuItems.map((item, index) => (
              <motion.button
                key={index}
                onClick={() => scrollToSection(item.href)}
                className="transition-colors duration-200 font-medium"
                style={{ color: '#46bdb6' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#faa0cc';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#46bdb6';
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {item.label}
              </motion.button>
            ))}
          </nav>

          {/* Right side controls */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Language and Theme Controls */}
            <div className="hidden sm:flex items-center gap-2">
              <GoogleTranslate />
            </div>

            {/* CTA Button */}
            <Button
              onClick={() => navigate('/auth')}
              className="text-white shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base px-3 sm:px-6 py-2"
              style={{ backgroundColor: '#faa0cc' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#ffb3d9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#faa0cc';
              }}
            >
              Get Started
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={{ color: '#46bdb6' }}
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t"
              style={{ borderColor: 'rgba(70, 189, 182, 0.2)' }}
            >
              <nav className="py-4 space-y-2">
                <div className="px-4 pb-3 sm:hidden">
                  <GoogleTranslate />
                </div>
                {menuItems.map((item, index) => (
                  <motion.button
                    key={index}
                    onClick={() => scrollToSection(item.href)}
                    className="block w-full text-left px-4 py-2 transition-colors duration-200 font-medium"
                    style={{ color: '#46bdb6' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#faa0cc';
                      e.currentTarget.style.backgroundColor = 'rgba(250, 160, 204, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#46bdb6';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {item.label}
                  </motion.button>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </motion.header>
      </>
  );
};

export { ResponsiveHeader };
export default ResponsiveHeader;
