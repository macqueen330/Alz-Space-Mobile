import { useState, useEffect, useCallback } from 'react';
import { VoiceService, VoiceState } from '../platform/voice';

interface UseVoiceReturn {
  isListening: boolean;
  transcript: string;
  partialTranscript: string;
  error: string | null;
  isAvailable: boolean;
  startListening: (locale?: string) => Promise<void>;
  stopListening: () => Promise<void>;
  cancelListening: () => Promise<void>;
  clearTranscript: () => void;
}

export function useVoice(): UseVoiceReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [partialTranscript, setPartialTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        await VoiceService.initialize();
        const available = await VoiceService.isAvailable();
        setIsAvailable(available);

        VoiceService.setCallback((state: Partial<VoiceState>) => {
          if (state.isListening !== undefined) {
            setIsListening(state.isListening);
          }
          if (state.results && state.results.length > 0) {
            setTranscript(state.results[0]);
            setPartialTranscript('');
          }
          if (state.partialResults && state.partialResults.length > 0) {
            setPartialTranscript(state.partialResults[0]);
          }
          if (state.error) {
            setError(state.error);
          }
        });
      } catch (err: any) {
        setError(err.message || 'Failed to initialize voice');
      }
    };

    initialize();

    return () => {
      VoiceService.destroy();
    };
  }, []);

  const startListening = useCallback(async (locale: string = 'en-US') => {
    setError(null);
    setPartialTranscript('');
    await VoiceService.startListening(locale);
  }, []);

  const stopListening = useCallback(async () => {
    await VoiceService.stopListening();
  }, []);

  const cancelListening = useCallback(async () => {
    await VoiceService.cancelListening();
    setPartialTranscript('');
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setPartialTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    partialTranscript,
    error,
    isAvailable,
    startListening,
    stopListening,
    cancelListening,
    clearTranscript,
  };
}
