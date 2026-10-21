import { useState, useCallback, useRef } from 'react';
import { geminiModel, GeminiApiError } from '@/lib/gemini';
import { toast } from 'sonner';

interface UseGeminiOptions {
  onSuccess?: (response: string) => void;
  onError?: (error: Error) => void;
  suppressToasts?: boolean;
}

export const useGemini = (options?: UseGeminiOptions) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Callers usually pass an inline options object; keep the latest in a ref so
  // the returned callbacks stay referentially stable across renders.
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const handleGeminiError = useCallback((err: unknown, toastMessage: string) => {
    const opts = optionsRef.current;
    const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
    const isGeminiIssue = err instanceof GeminiApiError && typeof err.status === 'number' && err.status >= 400;
    setError(errorMessage);
    opts?.onError?.(err instanceof Error ? err : new Error(errorMessage));
    if (!opts?.suppressToasts && !isGeminiIssue) {
      toast.error(toastMessage);
    }
  }, []);

  const generateContent = useCallback(async (
    prompt: string,
    config?: {
      temperature?: number;
      maxTokens?: number;
      topK?: number;
      topP?: number;
    }
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await geminiModel.generateContent(prompt, config);
      optionsRef.current?.onSuccess?.(response);
      return response;
    } catch (err) {
      handleGeminiError(err, 'Failed to generate content');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleGeminiError]);

  const generateWellnessAdvice = useCallback(async (
    userInput: string,
    context?: {
      age?: number;
      symptoms?: string[];
      concerns?: string[];
    }
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await geminiModel.generateWellnessAdvice(userInput, context);
      optionsRef.current?.onSuccess?.(response);
      return response;
    } catch (err) {
      handleGeminiError(err, 'Failed to generate wellness advice');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleGeminiError]);

  const analyzeSymptoms = useCallback(async (
    symptoms: string[],
    additionalInfo?: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await geminiModel.analyzeSymptoms(symptoms, additionalInfo);
      optionsRef.current?.onSuccess?.(response);
      return response;
    } catch (err) {
      handleGeminiError(err, 'Failed to analyze symptoms');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleGeminiError]);

  const generateMenopauseEducation = useCallback(async (
    topic: string,
    level: 'beginner' | 'intermediate' | 'advanced' = 'beginner'
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await geminiModel.generateMenopauseEducation(topic, level);
      optionsRef.current?.onSuccess?.(response);
      return response;
    } catch (err) {
      handleGeminiError(err, 'Failed to generate educational content');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleGeminiError]);

  const generateHealthReport = useCallback(async (
    userData: {
      symptoms: string[];
      lifestyle: string[];
      concerns: string[];
      age?: number;
    }
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await geminiModel.generateHealthReport(userData);
      optionsRef.current?.onSuccess?.(response);
      return response;
    } catch (err) {
      handleGeminiError(err, 'Failed to generate health report');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleGeminiError]);

  const generateMotivation = useCallback(async (
    userMood: string,
    goals?: string[]
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await geminiModel.generateMotivation(userMood, goals);
      optionsRef.current?.onSuccess?.(response);
      return response;
    } catch (err) {
      handleGeminiError(err, 'Failed to generate motivation');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleGeminiError]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    clearError,
    generateContent,
    generateWellnessAdvice,
    analyzeSymptoms,
    generateMenopauseEducation,
    generateHealthReport,
    generateMotivation,
  };
};

export default useGemini;
