import { useEffect, useState } from "react";
import { Volume2, Languages } from "lucide-react";

// Type declarations for Google Translate
declare global {
  interface Window {
    google: {
      translate: {
        TranslateElement: {
          new (options: any, elementId: string): any;
          InlineLayout: {
            SIMPLE: number;
            HORIZONTAL: number;
            VERTICAL: number;
          };
        };
      };
    };
    googleTranslateElementInit: () => void;
  }
}

const GoogleTranslate = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const scriptId = "google-translate-script";

    // Define init function globally before script runs
    window.googleTranslateElementInit = function () {
      if (document.getElementById("google_translate_element") && window.google && window.google.translate) {
        try {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "en,hi,mr", // English, Hindi, Marathi
              layout: window.google.translate.TranslateElement.InlineLayout?.SIMPLE || 0,
            autoDisplay: false,
            multilanguagePage: true,
          },
          "google_translate_element"
        );
        setIsLoaded(true);
          
          // Apply custom styling after Google Translate loads
          setTimeout(() => {
            applyCustomStyles();
          }, 200);
        } catch (error) {
          console.error('Google Translate initialization error:', error);
          setIsLoaded(false);
        }
      }
    };

    // Function to apply custom styling to Google Translate elements
    const applyCustomStyles = () => {
      const translateElement = document.getElementById("google_translate_element");
      if (!translateElement) return;

      // Check if dark mode is active
      const isDarkMode = document.documentElement.classList.contains('dark') || 
                        document.documentElement.getAttribute('data-theme') === 'dark' ||
                        window.matchMedia('(prefers-color-scheme: dark)').matches;

      // Create style element if it doesn't exist
      let styleElement = document.getElementById('google-translate-custom-styles');
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'google-translate-custom-styles';
        document.head.appendChild(styleElement);
      }

      // Apply theme-specific styles
      const styles = isDarkMode ? `
        .goog-te-banner-frame {
          display: none !important;
        }
        .goog-te-gadget {
          color: white !important;
          font-size: 14px !important;
          font-weight: bold !important;
        }
        .goog-te-gadget .goog-te-combo {
          background-color: white !important;
          color: #fff !important;
          border: 2px solid #059669 !important;
          border-radius: 8px !important;
          padding: 6px 10px !important;
          font-size: 14px !important;
          font-weight: bold !important;
          min-width: 150px !important;
          max-width: 200px !important;
        }
        .goog-te-gadget .goog-te-combo:focus {
          outline: 3px solid #059669 !important;
          outline-offset: 2px !important;
          border-color: #10b981 !important;
        }
        .goog-te-gadget .goog-te-combo option {
          background-color: white !important;
          color: #fff !important;
          font-size: 14px !important;
          font-weight: bold !important;
          padding: 6px !important;
        }
        .goog-te-gadget-simple {
          background-color: transparent !important;
          border: none !important;
        }
        @media (max-width: 640px) {
          .goog-te-gadget .goog-te-combo {
            min-width: 120px !important;
            max-width: 150px !important;
            font-size: 12px !important;
            padding: 4px 8px !important;
          }
          .goog-te-gadget {
            font-size: 12px !important;
          }
        }
        .goog-te-gadget-simple .goog-te-menu-value {
          color: #fff !important;
          font-size: 16px !important;
          font-weight: bold !important;
          background-color: white !important;
          padding: 8px 12px !important;
          border-radius: 8px !important;
        }
        .goog-te-gadget-simple .goog-te-menu-value span:first-child {
          color: #fff !important;
          font-size: 16px !important;
          font-weight: bold !important;
        }
        .goog-te-gadget-simple .goog-te-menu-value span:last-child {
          color: #fff !important;
          font-size: 16px !important;
          font-weight: bold !important;
        }
        .goog-te-gadget-simple .goog-te-menu-value:before {
          content: "Select Language: " !important;
          color: #fff !important;
          font-weight: bold !important;
          font-size: 16px !important;
        }
      ` : `
        .goog-te-banner-frame {
          display: none !important;
        }
        .goog-te-gadget {
          color: #1f2937 !important;
          font-size: 14px !important;
          font-weight: bold !important;
        }
        .goog-te-gadget .goog-te-combo {
          background-color: white !important;
          color: #1f2937 !important;
          border: 2px solid #059669 !important;
          border-radius: 8px !important;
          padding: 6px 10px !important;
          font-size: 14px !important;
          font-weight: bold !important;
          min-width: 150px !important;
          max-width: 200px !important;
        }
        .goog-te-gadget .goog-te-combo:focus {
          outline: 3px solid #059669 !important;
          outline-offset: 2px !important;
          border-color: #10b981 !important;
        }
        .goog-te-gadget .goog-te-combo option {
          background-color: white !important;
          color: #1f2937 !important;
          font-size: 14px !important;
          font-weight: bold !important;
          padding: 6px !important;
        }
        .goog-te-gadget-simple {
          background-color: transparent !important;
          border: none !important;
        }
        @media (max-width: 640px) {
          .goog-te-gadget .goog-te-combo {
            min-width: 120px !important;
            max-width: 150px !important;
            font-size: 12px !important;
            padding: 4px 8px !important;
          }
          .goog-te-gadget {
            font-size: 12px !important;
          }
        }
        .goog-te-gadget-simple .goog-te-menu-value {
          color: #1f2937 !important;
          font-size: 16px !important;
          font-weight: bold !important;
        }
        .goog-te-gadget-simple .goog-te-menu-value span:first-child {
          color: #1f2937 !important;
          font-size: 16px !important;
          font-weight: bold !important;
        }
        .goog-te-gadget-simple .goog-te-menu-value span:last-child {
          color: white !important;
          font-size: 16px !important;
          font-weight: bold !important;
        }
        .goog-te-gadget-simple .goog-te-menu-value:before {
          content: "Select Language: " !important;
          color:white !important;
          font-weight: bold !important;
          font-size: 16px !important;
        }
      `;

      styleElement.textContent = styles;
    };

    // Only add script if not already added
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src =
        "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      script.defer = true;

      // Wait for window to be ready — helps on mobile
      script.onload = () => {
        // Add a small delay to ensure Google Translate is fully loaded
        setTimeout(() => {
          if (window.google && window.google.translate && window.google.translate.TranslateElement) {
          window.googleTranslateElementInit();
          } else {
            console.error('Google Translate not fully loaded');
            setIsLoaded(false);
        }
        }, 100);
      };

      document.body.appendChild(script);
    } else if (window.google && window.google.translate) {
      window.googleTranslateElementInit();
    }

    // Re-initialize on window resize (mobile rotates or resizes)
    const handleResize = () => {
      if (window.google && window.google.translate) {
        window.googleTranslateElementInit();
      }
    };

    // Listen for theme changes
    const handleThemeChange = () => {
      setTimeout(() => {
        applyCustomStyles();
      }, 100);
    };

    // Listen for theme changes using MutationObserver
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'class' || mutation.attributeName === 'data-theme')) {
          handleThemeChange();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme']
    });

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="absolute top-16 sm:top-20 right-4 sm:right-8 z-30 google-translate-container flex items-center gap-2 sm:gap-3">
      
      {/* Google Translate Widget */}
      <div
        id="google_translate_element"
        className="translate-widget"
        style={{
          minHeight: "20px",
          overflow: "visible",
          zIndex: 9999,
        }}
      ></div>
    </div>
  );
};

export { GoogleTranslate };
export default GoogleTranslate;
