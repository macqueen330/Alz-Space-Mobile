import { Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../../services/supabaseClient';

// URL scheme for Android: alzspace://
const URL_SCHEME = 'alzspace';

export interface DeepLinkCallbacks {
  onAuthSuccess?: (session: any) => void;
  onAuthError?: (error: Error) => void;
}

class DeepLinkHandlerClass {
  private callbacks: DeepLinkCallbacks = {};
  private isInitialized = false;

  async initialize(callbacks: DeepLinkCallbacks = {}): Promise<void> {
    if (this.isInitialized) return;

    this.callbacks = callbacks;

    // Handle initial URL
    const initialUrl = await Linking.getInitialURL();
    if (initialUrl) {
      console.log('[DeepLinkHandler Android] Initial URL:', initialUrl);
      await this.handleUrl(initialUrl);
    }

    // Listen for URL changes
    Linking.addEventListener('url', async (event) => {
      console.log('[DeepLinkHandler Android] URL event:', event.url);
      await this.handleUrl(event.url);
    });

    // Warm up Chrome Custom Tabs
    WebBrowser.warmUpAsync();

    this.isInitialized = true;
    console.log('[DeepLinkHandler Android] Initialized');
  }

  private async handleUrl(url: string): Promise<void> {
    try {
      if (url.includes('auth-callback') || url.includes('access_token')) {
        await this.handleAuthCallback(url);
      }
    } catch (error: any) {
      console.error('[DeepLinkHandler Android] Handle URL error:', error);
      this.callbacks.onAuthError?.(error);
    }
  }

  private async handleAuthCallback(url: string): Promise<void> {
    try {
      console.log('[DeepLinkHandler Android] Handling auth callback');

      const hashOrQuery = url.includes('#') 
        ? url.split('#')[1] 
        : url.split('?')[1];
      
      if (!hashOrQuery) {
        throw new Error('No auth parameters in callback URL');
      }

      const params = new URLSearchParams(hashOrQuery);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const error = params.get('error');
      const errorDescription = params.get('error_description');

      if (error) {
        throw new Error(errorDescription || error);
      }

      if (!accessToken || !refreshToken) {
        throw new Error('Missing access or refresh token');
      }

      const { data, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        throw sessionError;
      }

      console.log('[DeepLinkHandler Android] Auth successful');
      this.callbacks.onAuthSuccess?.(data.session);

      // Close Chrome Custom Tab
      WebBrowser.dismissBrowser();
    } catch (error: any) {
      console.error('[DeepLinkHandler Android] Auth callback error:', error);
      this.callbacks.onAuthError?.(error);
    }
  }

  getRedirectUrl(): string {
    return `${URL_SCHEME}://auth-callback`;
  }

  async cleanup(): Promise<void> {
    WebBrowser.coolDownAsync();
    this.isInitialized = false;
    console.log('[DeepLinkHandler Android] Cleanup complete');
  }
}

export const DeepLinkHandler = new DeepLinkHandlerClass();
