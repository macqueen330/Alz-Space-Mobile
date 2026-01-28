import * as Speech from 'expo-speech';

export interface SpeechOptions {
  language?: string;
  pitch?: number;
  rate?: number;
  voice?: string;
  onStart?: () => void;
  onDone?: () => void;
  onError?: (error: Error) => void;
}

class SpeechServiceClass {
  private isSpeaking = false;

  async speak(text: string, options: SpeechOptions = {}): Promise<void> {
    try {
      // Stop any ongoing speech first
      if (this.isSpeaking) {
        await this.stop();
      }

      const speechOptions: Speech.SpeechOptions = {
        language: options.language || 'en-US',
        pitch: options.pitch ?? 1.0,
        rate: options.rate ?? 0.9, // Slightly slower for elderly users
        voice: options.voice,
        onStart: () => {
          this.isSpeaking = true;
          options.onStart?.();
          console.log('[SpeechService iOS] Started speaking');
        },
        onDone: () => {
          this.isSpeaking = false;
          options.onDone?.();
          console.log('[SpeechService iOS] Done speaking');
        },
        onError: (error) => {
          this.isSpeaking = false;
          options.onError?.(new Error(String(error)));
          console.error('[SpeechService iOS] Error:', error);
        },
      };

      await Speech.speak(text, speechOptions);
    } catch (error: any) {
      console.error('[SpeechService iOS] Speak error:', error);
      options.onError?.(error);
    }
  }

  async stop(): Promise<void> {
    try {
      await Speech.stop();
      this.isSpeaking = false;
      console.log('[SpeechService iOS] Stopped');
    } catch (error) {
      console.error('[SpeechService iOS] Stop error:', error);
    }
  }

  async pause(): Promise<void> {
    try {
      await Speech.pause();
      console.log('[SpeechService iOS] Paused');
    } catch (error) {
      console.error('[SpeechService iOS] Pause error:', error);
    }
  }

  async resume(): Promise<void> {
    try {
      await Speech.resume();
      console.log('[SpeechService iOS] Resumed');
    } catch (error) {
      console.error('[SpeechService iOS] Resume error:', error);
    }
  }

  async getAvailableVoices(): Promise<Speech.Voice[]> {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      // Filter for iOS voices
      return voices.filter(v => v.language.startsWith('en'));
    } catch (error) {
      console.error('[SpeechService iOS] Get voices error:', error);
      return [];
    }
  }

  isSpeakingNow(): boolean {
    return this.isSpeaking;
  }
}

export const SpeechService = new SpeechServiceClass();
