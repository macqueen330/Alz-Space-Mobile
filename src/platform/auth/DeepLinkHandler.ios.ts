import { Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../../services/supabaseClient';

// URL scheme for iOS: alzspace://
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

    // Handle initial URL (app opened via deep link)
    const initialUrl = await Linking.getInitialURL();
    if (initialUrl) {
      console.log('[DeepLinkHandler iOS] Initial URL:', initialUrl);
      await this.handleUrl(initialUrl);
    }

    // Listen for URL changes (app already running)
    Linking.addEventListener('url', async (event) => {
      console.log('[DeepLinkHandler iOS] URL event:', event.url);
      await this.handleUrl(event.url);
    });

    // Warm up the browser for faster OAuth
    WebBrowser.warmUpAsync();

    this.isInitialized = true;
    console.log('[DeepLinkHandler iOS] Initialized');
  }

  private async handleUrl(url: string): Promise<void> {
    try {
      // Check if it's an auth callback
      if (url.includes('auth-callback') || url.includes('access_token')) {
        await this.handleAuthCallback(url);
      }
    } catch (error: any) {
      console.error('[DeepLinkHandler iOS] Handle URL error:', error);
      this.callbacks.onAuthError?.(error);
    }
  }

  private async handleAuthCallback(url: string): Promise<void> {
    try {
      console.log('[DeepLinkHandler iOS] Handling auth callback');

      // Parse the URL for tokens
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

      // Set the session in Supabase
      const { data, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        throw sessionError;
      }

      console.log('[DeepLinkHandler iOS] Auth successful');
      this.callbacks.onAuthSuccess?.(data.session);

      // Close any open browser session
      WebBrowser.dismissBrowser();
    } catch (error: any) {
      console.error('[DeepLinkHandler iOS] Auth callback error:', error);
      this.callbacks.onAuthError?.(error);
    }
  }

  getRedirectUrl(): string {
    return `${URL_SCHEME}://auth-callback`;
  }

  async cleanup(): Promise<void> {
    WebBrowser.coolDownAsync();
    this.isInitialized = false;
    console.log('[DeepLinkHandler iOS] Cleanup complete');
  }
}

export const DeepLinkHandler = new DeepLinkHandlerClass();
