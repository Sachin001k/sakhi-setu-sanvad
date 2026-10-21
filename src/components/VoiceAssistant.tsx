import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Loader2,
  Bot,
  User,
  MessageCircle,
  Square,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useGemini } from '@/hooks/useGemini';
import { createNotification } from '@/lib/notifications';
import { toast } from 'sonner';

interface VoiceMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

// Minimal Web Speech API typings (not included in lib.dom for all TS versions)
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

type SessionId = 'voice_session' | 'text_session';

// Strip markdown formatting so replies read and speak naturally
const formatResponse = (response: string) =>
  response
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s*/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const VoiceAssistant: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [synthesis, setSynthesis] = useState<SpeechSynthesis | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [userAge, setUserAge] = useState<number | null>(null);

  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  // Always points at the latest handleVoiceInput so the recognition callback never goes stale
  const voiceInputHandlerRef = useRef<(text: string) => void>(() => {});

  const { generateWellnessAdvice } = useGemini({
    onError: (error) => console.error('AI Error:', error)
  });

  useEffect(() => {
    // Check for speech recognition support
    const speechWindow = window as unknown as {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();

      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onstart = () => {
        setIsListening(true);
        setCurrentTranscript('');
      };

      recognitionInstance.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setCurrentTranscript(interimTranscript);

        if (finalTranscript) {
          voiceInputHandlerRef.current(finalTranscript);
        }
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast.error('Speech recognition error. Please try again.');
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognitionInstance;
      setIsSupported(true);
    }

    // Check for speech synthesis support
    if ('speechSynthesis' in window) {
      setSynthesis(window.speechSynthesis);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onstart = null;
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const loadConversations = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('chatbot_conversations')
        .select('id, message, response, is_user_message, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;

      const formattedMessages: VoiceMessage[] = (data ?? []).map(msg => ({
        id: msg.id,
        text: msg.is_user_message ? msg.message : msg.message || msg.response || '',
        isUser: msg.is_user_message ?? true,
        timestamp: new Date(msg.created_at)
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  }, []);

  // Load history and profile once the authenticated user is known
  useEffect(() => {
    if (!user) return;

    loadConversations(user.id);

    let cancelled = false;
    supabase
      .from('users')
      .select('age')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('Error loading user age:', error);
          return;
        }
        setUserAge(typeof data?.age === 'number' ? data.age : null);
      });

    return () => {
      cancelled = true;
    };
  }, [user, loadConversations]);

  const saveMessage = async (sessionId: SessionId, text: string, isUserMessage: boolean) => {
    if (!user) return;

    const { error } = await supabase
      .from('chatbot_conversations')
      .insert({
        user_id: user.id,
        session_id: sessionId,
        message: text,
        is_user_message: isUserMessage,
        language: 'en'
      });

    if (error) {
      console.error('Error saving conversation message:', error);
    }
  };

  const processQuery = async (rawText: string, sessionId: SessionId) => {
    const text = rawText.trim();
    if (!text) return;

    const userMessage: VoiceMessage = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      await saveMessage(sessionId, text, true);

      const response = formatResponse(await generateAIResponse(text));

      const botMessage: VoiceMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);

      await saveMessage(sessionId, response, false);

      if (synthesis && !isMuted) {
        speakText(response);
      }

      void createNotification(
        'AI Assistant Response',
        sessionId === 'voice_session'
          ? 'Your voice query has been processed and responded to'
          : 'Your text query has been processed and responded to',
        'ai',
        '/profile?tab=assistant'
      );
    } catch (error) {
      console.error('Error processing input:', error);
      toast.error('Error processing your request. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoiceInput = async (text: string) => {
    setCurrentTranscript('');
    await processQuery(text, 'voice_session');
  };

  voiceInputHandlerRef.current = handleVoiceInput;

  const handleTextInput = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = textInput.trim();
    if (!text) return;

    setTextInput('');
    await processQuery(text, 'text_session');
  };

  const generateAIResponse = async (input: string): Promise<string> => {
    try {
      // Use Gemini AI for intelligent responses
      const response = await generateWellnessAdvice(input, {
        ...(userAge !== null ? { age: userAge } : {}),
        symptoms: [],
        concerns: ['menopause support', 'wellness guidance']
      });
      return response;
    } catch (error) {
      console.error('Error generating AI response:', error);
      // Fallback to simple responses
      const lowerInput = input.toLowerCase();
      
      if (lowerInput.includes('symptom') || lowerInput.includes('pain') || lowerInput.includes('ache')) {
        return "I understand you're experiencing symptoms. Please track them in the symptom tracker for better insights. Would you like me to help you log your symptoms?";
      }
      
      if (lowerInput.includes('hot flash') || lowerInput.includes('hot flush')) {
        return "Hot flashes are common during menopause. Try deep breathing exercises, stay hydrated, and wear light clothing. The meditation section has guided breathing exercises.";
      }
      
      if (lowerInput.includes('sleep') || lowerInput.includes('insomnia')) {
        return "Sleep issues are common during menopause. Try maintaining a regular sleep schedule, avoid caffeine in the evening, and practice relaxation techniques before bed.";
      }
      
      if (lowerInput.includes('mood') || lowerInput.includes('anxiety') || lowerInput.includes('depression')) {
        return "Mood changes are normal during menopause. Consider talking to a healthcare provider and try the community chat for support from other women going through similar experiences.";
      }
      
      if (lowerInput.includes('exercise') || lowerInput.includes('workout')) {
        return "Regular exercise can help with menopause symptoms. Try gentle yoga, walking, or swimming. Check the resources section for guided exercise videos.";
      }
      
      if (lowerInput.includes('diet') || lowerInput.includes('food') || lowerInput.includes('nutrition')) {
        return "A balanced diet with calcium, vitamin D, and phytoestrogens can help. Include leafy greens, soy products, and limit caffeine and alcohol. Check our recipe section for healthy meal ideas.";
      }
      
      if (lowerInput.includes('help') || lowerInput.includes('support')) {
        return "I'm here to help! You can track symptoms, get wellness tips, connect with the community, or find nearby health centers. What would you like to know more about?";
      }
      
      return "I understand you're looking for support. This app offers symptom tracking, wellness tips, community support, and resources. How can I help you today?";
    }
  };


  const speakText = (text: string) => {
    if (!synthesis || isMuted) return;

    // Stop any current speech
    synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthesis.speak(utterance);
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const stopSpeaking = () => {
    if (synthesis) {
      synthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isSupported) {
    return (
      <Card className="bg-white dark:bg-gray-800 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-pink-500" />
            Voice Assistant
          </CardTitle>
          <CardDescription>
            Voice interaction for symptom queries and wellness support
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MicOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Voice Assistant Not Supported
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Your browser doesn't support speech recognition. Please use a modern browser like Chrome or Edge.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white text-black border border-gray-200 shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-pink-500" />
            <CardTitle>Voice Assistant</CardTitle>
            <Badge variant="secondary" className="bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300">
              English
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMuted(!isMuted)}
              className="flex items-center gap-2 text-black"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              {isMuted ? 'Unmute' : 'Mute'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearMessages}
              className="flex items-center gap-2 text-black"
            >
              <RotateCcw className="w-4 h-4" />
              Clear
            </Button>
          </div>
        </div>
        <CardDescription>
          Speak naturally to get support and information about menopause
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Voice Controls */}
        <div className="flex justify-center gap-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={isListening ? stopListening : startListening}
              disabled={isProcessing}
              className={`w-16 h-16 rounded-full ${
                isListening 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-pink-500 hover:bg-pink-600'
              } text-white shadow-lg`}
            >
              {isListening ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </Button>
          </motion.div>
          
          {isSpeaking && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={stopSpeaking}
                variant="outline"
                className="w-16 h-16 rounded-full border-red-500 text-red-500 hover:bg-red-50"
              >
                <Square className="w-6 h-6" />
              </Button>
            </motion.div>
          )}
        </div>

        {/* Status */}
        <div className="text-center">
          {isListening && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="inline-flex items-center gap-2 text-pink-600 dark:text-pink-400"
            >
              <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" />
              Listening...
            </motion.div>
          )}
          {isProcessing && (
            <div className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </div>
          )}
          {isSpeaking && (
            <div className="inline-flex items-center gap-2 text-green-600 dark:text-green-400">
              <Volume2 className="w-4 h-4" />
              Speaking...
            </div>
          )}
          {currentTranscript && (
            <div className="text-sm text-gray-600 dark:text-gray-300 italic">
              "{currentTranscript}"
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="h-64 overflow-y-auto space-y-4 border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-700">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Start a conversation by clicking the microphone button</p>
            </div>
          ) : (
            messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.isUser
                      ? 'bg-pink-500 text-white'
                      : 'bg-white dark:bg-gray-600 text-black dark:text-white border border-gray-200 dark:border-gray-500'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!message.isUser && <Bot className="w-4 h-4 mt-1 flex-shrink-0" />}
                    {message.isUser && <User className="w-4 h-4 mt-1 flex-shrink-0" />}
                    <div className="flex-1">
                      <p className="text-sm">{message.text}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Text Input Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Or type your question:
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTextInput(!showTextInput)}
              className="text-xs"
            >
              {showTextInput ? 'Hide' : 'Show'} Text Input
            </Button>
          </div>
          
          {showTextInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <form onSubmit={handleTextInput} className="flex gap-2">
                <Textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Type your question about menopause, symptoms, or wellness..."
                  className="flex-1 min-h-[80px] bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-neon-pink focus:ring-neon-pink/20 text-black dark:text-white placeholder-gray-500 dark:placeholder-white"
                  disabled={isProcessing}
                />
                <Button
                  type="submit"
                  disabled={isProcessing || !textInput.trim()}
                  className="self-end"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </form>
            </motion.div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleVoiceInput('I need help with hot flashes')}
            className="text-xs"
          >
            Hot Flashes
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleVoiceInput('Tell me about sleep problems')}
            className="text-xs"
          >
            Sleep Issues
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleVoiceInput('I want exercise advice')}
            className="text-xs"
          >
            Exercise
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleVoiceInput('Help me with mood changes')}
            className="text-xs"
          >
            Mood Support
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceAssistant;
