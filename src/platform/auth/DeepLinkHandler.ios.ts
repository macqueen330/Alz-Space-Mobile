import { Linking } from 'react-native';
import type { EmitterSubscription } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../services/supabaseClient';

const URL_SCHEME = 'alzspace';

export interface DeepLinkCallbacks {
  onAuthSuccess?: (session: Session | null) => void;
  onAuthError?: (error: Error) => void;
}

class DeepLinkHandlerClass {
  private callbacks: DeepLinkCallbacks = {};
  private isInitialized = false;
  private urlSubscription: EmitterSubscription | null = null;

  async initialize(callbacks: DeepLinkCallbacks = {}): Promise<void> {
    if (this.isInitialized) return;

    this.callbacks = callbacks;

    const initialUrl = await Linking.getInitialURL();
    if (initialUrl) {
      await this.handleUrl(initialUrl);
    }

    this.urlSubscription = Linking.addEventListener('url', async (event) => {
      await this.handleUrl(event.url);
    });

    WebBrowser.warmUpAsync();
    this.isInitialized = true;
  }

  private async handleUrl(url: string): Promise<void> {
    try {
      if (url.includes('auth-callback') || url.includes('access_token')) {
        await this.handleAuthCallback(url);
      }
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.callbacks.onAuthError?.(err);
    }
  }

  private async handleAuthCallback(url: string): Promise<void> {
    const hashOrQuery = url.includes('#')
      ? url.split('#')[1]
      : url.split('?')[1];

    if (!hashOrQuery) {
      throw new Error('No auth parameters in callback URL');
    }

    const params = new URLSearchParams(hashOrQuery);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const errorParam = params.get('error');
    const errorDescription = params.get('error_description');

    if (errorParam) {
      throw new Error(errorDescription || errorParam);
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

    this.callbacks.onAuthSuccess?.(data.session);
    WebBrowser.dismissBrowser();
  }

  getRedirectUrl(): string {
    return `${URL_SCHEME}://auth-callback`;
  }

  async cleanup(): Promise<void> {
    this.urlSubscription?.remove();
    this.urlSubscription = null;
    WebBrowser.coolDownAsync();
    this.isInitialized = false;
  }
}

export const DeepLinkHandler = new DeepLinkHandlerClass();
