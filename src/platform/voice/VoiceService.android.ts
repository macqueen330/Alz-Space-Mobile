import Voice, {
  SpeechResultsEvent,
  SpeechErrorEvent,
  SpeechStartEvent,
  SpeechEndEvent,
} from '@react-native-voice/voice';

export interface VoiceState {
  isListening: boolean;
  results: string[];
  error: string | null;
  partialResults: string[];
}

type VoiceCallback = (state: Partial<VoiceState>) => void;

class VoiceServiceClass {
  private callback: VoiceCallback | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    Voice.onSpeechStart = this.onSpeechStart.bind(this);
    Voice.onSpeechEnd = this.onSpeechEnd.bind(this);
    Voice.onSpeechResults = this.onSpeechResults.bind(this);
    Voice.onSpeechPartialResults = this.onSpeechPartialResults.bind(this);
    Voice.onSpeechError = this.onSpeechError.bind(this);

    this.isInitialized = true;
    console.log('[VoiceService Android] Initialized');
  }

  setCallback(callback: VoiceCallback): void {
    this.callback = callback;
  }

  private onSpeechStart(_event: SpeechStartEvent): void {
    this.callback?.({ isListening: true, error: null });
  }

  private onSpeechEnd(_event: SpeechEndEvent): void {
    this.callback?.({ isListening: false });
  }

  private onSpeechResults(event: SpeechResultsEvent): void {
    const results = event.value || [];
    this.callback?.({ results, isListening: false });
  }

  private onSpeechPartialResults(event: SpeechResultsEvent): void {
    const partialResults = event.value || [];
    this.callback?.({ partialResults });
  }

  private onSpeechError(event: SpeechErrorEvent): void {
    const error = event.error?.message || 'Unknown speech recognition error';
    console.error('[VoiceService Android] Error:', error);
    this.callback?.({ error, isListening: false });
  }

  async startListening(locale: string = 'en-US'): Promise<void> {
    try {
      await this.initialize();
      this.callback?.({ error: null, results: [], partialResults: [] });
      
      // Android-specific: may need to request permissions first
      // TODO: Add permission check for RECORD_AUDIO on Android
      
      await Voice.start(locale);
      console.log('[VoiceService Android] Started listening');
    } catch (error: any) {
      console.error('[VoiceService Android] Start error:', error);
      this.callback?.({ error: error.message, isListening: false });
    }
  }

  async stopListening(): Promise<void> {
    try {
      await Voice.stop();
      console.log('[VoiceService Android] Stopped listening');
    } catch (error: any) {
      console.error('[VoiceService Android] Stop error:', error);
    }
  }

  async cancelListening(): Promise<void> {
    try {
      await Voice.cancel();
      this.callback?.({ isListening: false, results: [], partialResults: [] });
      console.log('[VoiceService Android] Cancelled');
    } catch (error: any) {
      console.error('[VoiceService Android] Cancel error:', error);
    }
  }

  async destroy(): Promise<void> {
    try {
      await Voice.destroy();
      this.isInitialized = false;
      this.callback = null;
      console.log('[VoiceService Android] Destroyed');
    } catch (error: any) {
      console.error('[VoiceService Android] Destroy error:', error);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const available = await Voice.isAvailable();
      return !!available;
    } catch {
      return false;
    }
  }
}

export const VoiceService = new VoiceServiceClass();
