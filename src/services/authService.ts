import { supabase } from './supabaseClient';
import type { Provider } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

export interface SignUpData {
  email: string;
  password: string;
  name?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

// Sign up with email and password
export const signUp = async ({ email, password, name }: SignUpData) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name || 'User',
        avatar_url: `https://picsum.photos/100?random=${Date.now()}`
      }
    }
  });

  if (error) throw error;
  return data;
};

// Sign in with email and password
export const signIn = async ({ email, password }: SignInData) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  return data;
};

// Get the redirect URL for OAuth - manually constructed to avoid expo-crypto dependency
const getRedirectUrl = (): string => {
  // Get the current URL scheme from Linking
  const url = Linking.createURL('auth-callback');
  console.log('Generated redirect URL:', url);
  return url;
};

// Sign in with social provider (Google, GitHub, etc.)
export const signInWithProvider = async (provider: Provider) => {
  const redirectUrl = getRedirectUrl();
  console.log('OAuth redirect URL:', redirectUrl);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectUrl,
      skipBrowserRedirect: true, // Important for React Native
    }
  });

  if (error) throw error;

  console.log('OAuth URL generated:', data.url);

  // Open the OAuth URL in a browser
  if (data.url) {
    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectUrl
    );
    
    console.log('WebBrowser result:', result.type);

    if (result.type === 'success') {
      console.log('OAuth success, parsing callback URL');
      
      // Extract the access token from the URL
      const url = result.url;
      const params = new URLSearchParams(url.split('#')[1] || url.split('?')[1]);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) throw sessionError;
        
        console.log('Session established successfully');
        return sessionData;
      } else {
        throw new Error('No tokens received in OAuth callback');
      }
    } else if (result.type === 'cancel') {
      throw new Error('OAuth cancelled by user');
    } else {
      throw new Error('OAuth failed');
    }
  }

  return data;
};

// Sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Get current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Get user profile
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
};

// Update user profile
export const updateUserProfile = async (userId: string, updates: {
  name?: string;
  phone?: string;
  avatar_url?: string;
  role?: 'CAREGIVER' | 'PATIENT' | 'FAMILY_MEMBER';
}) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Listen to auth state changes
export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback);
};
