import { Platform } from 'react-native';

export interface VoiceState {
  isListening: boolean;
  results: string[];
  error: string | null;
  partialResults: string[];
}

type VoiceCallback = (state: Partial<VoiceState>) => void;

const TAG = `[VoiceService ${Platform.OS}]`;

interface SpeechModule {
  requestPermissionsAsync?: () => Promise<{ granted: boolean; status: string }>;
  start?: (config: { lang: string; interimResults: boolean; continuous: boolean }) => void;
  stop?: () => void;
  abort?: () => void;
}

class VoiceServiceClass {
  private callback: VoiceCallback | null = null;
  private isInitialized = false;
  private speechModule: SpeechModule | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // expo-speech-recognition is not installed; voice recognition disabled
    this.isInitialized = true;
  }

  setCallback(callback: VoiceCallback): void {
    this.callback = callback;
  }

  async checkPermission(): Promise<boolean> {
    try {
      if (!this.speechModule) await this.initialize();
      if (!this.speechModule?.requestPermissionsAsync) return false;
      const result = await this.speechModule.requestPermissionsAsync();
      return result.granted;
    } catch {
      return false;
    }
  }

  async startListening(locale = 'en-US'): Promise<void> {
    try {
      await this.initialize();

      if (!this.speechModule) {
        this.callback?.({ error: 'Speech recognition is not available on this device.', isListening: false });
        return;
      }

      this.callback?.({ error: null, results: [], partialResults: [] });

      const hasPermission = await this.checkPermission();
      if (!hasPermission) {
        this.callback?.({ error: 'Speech recognition permission denied.', isListening: false });
        return;
      }

      this.speechModule.start?.({ lang: locale, interimResults: true, continuous: false });
      this.callback?.({ isListening: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to start listening';
      this.callback?.({ error: message, isListening: false });
    }
  }

  async stopListening(): Promise<void> {
    try {
      this.speechModule?.stop?.();
      this.callback?.({ isListening: false });
    } catch (error) {
      console.error(TAG, 'Stop error:', error);
    }
  }

  async cancelListening(): Promise<void> {
    try {
      this.speechModule?.abort?.();
      this.callback?.({ isListening: false, results: [], partialResults: [] });
    } catch (error) {
      console.error(TAG, 'Cancel error:', error);
    }
  }

  async destroy(): Promise<void> {
    try {
      this.speechModule?.abort?.();
    } catch {
      // ignore cleanup errors
    }
    this.isInitialized = false;
    this.callback = null;
    this.speechModule = null;
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.initialize();
      return this.speechModule !== null;
    } catch {
      return false;
    }
  }
}

export const VoiceService = new VoiceServiceClass();
