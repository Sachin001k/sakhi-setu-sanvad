import { useState, useCallback } from 'react';
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

  const handleGeminiError = useCallback((err: unknown, toastMessage: string, action: string) => {
    const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
    const isGeminiIssue = err instanceof GeminiApiError && typeof err.status === 'number' && err.status >= 400;
    setError(errorMessage);
    options?.onError?.(err as Error);
    if (!options?.suppressToasts && !isGeminiIssue) {
      toast.error(toastMessage);
    }
  }, [options]);

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
      options?.onSuccess?.(response);
      return response;
    } catch (err) {
      handleGeminiError(err, 'Failed to generate content', 'Content generation');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleGeminiError, options]);

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
      options?.onSuccess?.(response);
      return response;
    } catch (err) {
      handleGeminiError(err, 'Failed to generate wellness advice', 'Wellness advice');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleGeminiError, options]);

  const analyzeSymptoms = useCallback(async (
    symptoms: string[],
    additionalInfo?: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await geminiModel.analyzeSymptoms(symptoms, additionalInfo);
      options?.onSuccess?.(response);
      return response;
    } catch (err) {
      handleGeminiError(err, 'Failed to analyze symptoms', 'Symptom analysis');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleGeminiError, options]);

  const generateMenopauseEducation = useCallback(async (
    topic: string,
    level: 'beginner' | 'intermediate' | 'advanced' = 'beginner'
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await geminiModel.generateMenopauseEducation(topic, level);
      options?.onSuccess?.(response);
      return response;
    } catch (err) {
      handleGeminiError(err, 'Failed to generate educational content', 'Education content');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleGeminiError, options]);

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
      options?.onSuccess?.(response);
      return response;
    } catch (err) {
      handleGeminiError(err, 'Failed to generate health report', 'Health report');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleGeminiError, options]);

  const generateMotivation = useCallback(async (
    userMood: string,
    goals?: string[]
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await geminiModel.generateMotivation(userMood, goals);
      options?.onSuccess?.(response);
      return response;
    } catch (err) {
      handleGeminiError(err, 'Failed to generate motivation', 'Motivation');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleGeminiError, options]);

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
