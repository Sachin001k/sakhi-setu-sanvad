import { motion } from 'framer-motion';
import { Heart, Mail, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

const ResponsiveFooter = () => {
  const footerSections = [
    {
      title: 'Quick Links',
      links: [
        { label: 'Home', href: '#home' },
        { label: 'Features', href: '#features' },
        { label: 'About', href: '#about' },
        { label: 'Contact', href: '#contact' },
      ]
    },
    {
      title: 'Support',
      links: [
        { label: 'Help Center', href: '#' },
        { label: 'Privacy Policy', href: '#' },
        { label: 'Terms of Service', href: '#' },
        { label: 'FAQ', href: '#' },
      ]
    },
    {
      title: 'Resources',
      links: [
        { label: 'Blog', href: '#' },
        { label: 'Community', href: '#' },
        { label: 'Health Tips', href: '#' },
        { label: 'Expert Talks', href: '#' },
      ]
    },
        {
          title: 'Contact Info',
          links: [
            { 
              label: 'support@sakhisetu.com', 
              href: 'mailto:support@sakhisetu.com',
              icon: Mail 
            },
            { 
              label: 'Mumbai, Maharashtra', 
              href: '#',
              icon: MapPin 
            },
          ]
        }
  ];

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
  ];

  const scrollToSection = (href: string) => {
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.2 }}
      className="bg-gray-900 dark:bg-gray-950 text-white"
    >
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <motion.div
              className="flex items-center gap-3 mb-4"
              whileHover={{ scale: 1.05 }}
            >
              <Heart className="w-8 h-8 text-pink-400" />
              <span className="text-2xl font-bold">MyMenoSakhi</span>
            </motion.div>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Empowering women through their menopause journey with AI-powered insights and community support.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <motion.a
                    key={index}
                    href={social.href}
                    className="w-10 h-10 bg-gray-800 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-pink-500 transition-colors duration-200"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={social.label}
                  >
                    <Icon className="w-5 h-5" />
                  </motion.a>
                );
              })}
            </div>
          </div>

          {/* Footer Sections */}
          {footerSections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <h3 className="text-lg font-semibold mb-4 text-white">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => {
                  const Icon = link.icon;
                  return (
                    <li key={linkIndex}>
                      <motion.a
                        href={link.href}
                        onClick={(e) => {
                          if (link.href.startsWith('#')) {
                            e.preventDefault();
                            scrollToSection(link.href);
                          }
                        }}
                        className="flex items-center gap-2 text-gray-400 hover:text-pink-400 transition-colors duration-200 group"
                        whileHover={{ x: 5 }}
                      >
                        {Icon && <Icon className="w-4 h-4" />}
                        <span className="group-hover:underline">{link.label}</span>
                      </motion.a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-400 text-center sm:text-left">
              © 2025 MyMenoSakhi. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-pink-400 transition-colors duration-200">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-pink-400 transition-colors duration-200">
                Terms of Service
              </a>
              <a href="#" className="hover:text-pink-400 transition-colors duration-200">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};

export { ResponsiveFooter };
export default ResponsiveFooter;
