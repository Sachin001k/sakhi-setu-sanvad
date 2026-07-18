import { useEffect, useState, useRef } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

declare global {
  interface Window {
    google?: {
      translate?: {
        TranslateElement?: {
          new (
            options: {
              pageLanguage: string;
              layout?: number;
              autoDisplay?: boolean;
              multilanguagePage?: boolean;
            },
            elementId: string
          ): unknown;
          InlineLayout?: {
            SIMPLE: number;
          };
        };
      };
    };
    googleTranslateElementInit?: () => void;
  }
}

const LANGUAGES = [
  { code: "en", label: "English", localLabel: "English" },
  { code: "hi", label: "Hindi", localLabel: "हिन्दी" },
  { code: "mr", label: "Marathi", localLabel: "मराठी" },
  { code: "gu", label: "Gujarati", localLabel: "ગુજરાતી" },
  { code: "bn", label: "Bengali", localLabel: "বাংলা" },
  { code: "ta", label: "Tamil", localLabel: "தமிழ்" },
  { code: "te", label: "Telugu", localLabel: "తెలుగు" },
  { code: "kn", label: "Kannada", localLabel: "ಕನ್ನಡ" },
];

const getCookie = (name: string) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
};

const setCookie = (name: string, value: string, days = 30) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/`;
  document.cookie = `${name}=${value}; expires=${expires}; path=/; domain=${window.location.hostname}`;
};

const GoogleTranslate = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState("en");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync state with google translate cookie
  const syncLanguageFromCookie = () => {
    const cookie = getCookie("googtrans");
    if (cookie) {
      const parts = cookie.split("/");
      const lang = parts[parts.length - 1];
      if (lang && LANGUAGES.some(l => l.code === lang)) {
        setCurrentLang(lang);
        return;
      }
    }
    setCurrentLang("en");
  };

  useEffect(() => {
    syncLanguageFromCookie();

    const scriptId = "google-translate-script";

    const hideGoogleBanner = () => {
      document.body.style.top = "0px";
      document.documentElement.style.top = "0px";

      const bannerSelectors = [
        ".goog-te-banner-frame",
        ".goog-te-banner-frame.skiptranslate",
        "iframe.skiptranslate",
        "iframe.goog-te-banner-frame",
        "#goog-gt-tt",
        ".goog-tooltip",
        ".goog-tooltip:hover",
      ];

      bannerSelectors.forEach((selector) => {
        document.querySelectorAll<HTMLElement>(selector).forEach((node) => {
          node.style.display = "none";
          node.style.visibility = "hidden";
          node.style.top = "0";
          node.style.height = "0";
        });
      });
    };

    window.googleTranslateElementInit = () => {
      const target = document.getElementById("google_translate_element");
      const translateElement = window.google?.translate?.TranslateElement;

      if (!target || !translateElement) {
        return;
      }

      target.innerHTML = "";

      new translateElement(
        {
          pageLanguage: "en",
          layout: translateElement.InlineLayout?.SIMPLE ?? 0,
          autoDisplay: false,
          multilanguagePage: true,
        },
        "google_translate_element"
      );

      // Force select synchronization after script initializes
      setTimeout(() => {
        const currentCookie = getCookie("googtrans");
        if (currentCookie) {
          const parts = currentCookie.split("/");
          const lang = parts[parts.length - 1];
          if (lang) {
            const selectEl = document.querySelector('.goog-te-combo') as HTMLSelectElement;
            if (selectEl) {
              selectEl.value = lang;
              selectEl.dispatchEvent(new Event('change'));
            }
          }
        }
      }, 800);

      window.setTimeout(hideGoogleBanner, 100);
      window.setTimeout(hideGoogleBanner, 500);
    };

    const observer = new MutationObserver(() => {
      hideGoogleBanner();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style"],
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style"],
      childList: true,
      subtree: true,
    });

    const existingScript = document.getElementById(scriptId);
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src =
        "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    } else if (window.google?.translate?.TranslateElement) {
      window.googleTranslateElementInit();
    }

    hideGoogleBanner();

    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      observer.disconnect();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLanguageChange = (langCode: string) => {
    setCurrentLang(langCode);
    setIsOpen(false);

    // Set google translate cookies
    setCookie("googtrans", `/en/${langCode}`);

    // Interact with google's combo box
    const selectEl = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (selectEl) {
      selectEl.value = langCode;
      selectEl.dispatchEvent(new Event('change'));
    } else {
      // Fallback reload if google translate script failed to bind properly
      window.location.reload();
    }
  };

  const activeLangObj = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];

  return (
    <div className="relative z-50 flex items-center notranslate" translate="no" ref={dropdownRef}>
      {/* Hidden original widget container required by Google script */}
      <div id="google_translate_element" style={{ display: 'none', visibility: 'hidden', width: 0, height: 0 }} />

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white/80 backdrop-blur-sm text-gray-700 hover:text-teal-600 transition-all duration-300 shadow-sm border-gray-200 hover:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-xs sm:text-sm font-medium"
      >
        <Globe className="w-3.5 h-3.5 text-teal-500 animate-pulse" />
        <span>{activeLangObj.localLabel}</span>
        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2 w-44 rounded-2xl border border-gray-100 bg-white p-1.5 shadow-xl ring-1 ring-black/5 focus:outline-none max-h-60 overflow-y-auto"
          >
            <div className="py-1">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs sm:text-sm rounded-xl transition-colors duration-200 ${
                    currentLang === lang.code
                      ? "bg-teal-50/70 text-teal-600 font-semibold"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{lang.localLabel}</span>
                    <span className="text-[10px] text-gray-400 font-normal">{lang.label}</span>
                  </div>
                  {currentLang === lang.code && (
                    <Check className="h-4 w-4 text-teal-600" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GoogleTranslate;
