import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppNavigator } from './navigation/AppNavigator';
import { supabase } from './services/supabaseClient';
import { DeepLinkHandler } from './platform/auth';
import { UserRole } from './types';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(UserRole.CAREGIVER);

  useEffect(() => {
    // Initialize DeepLinkHandler for OAuth callbacks
    const initDeepLink = async () => {
      await DeepLinkHandler.initialize({
        onAuthSuccess: () => {
          setIsAuthenticated(true);
        },
        onAuthError: (err) => {
          setError(err.message);
        },
      });
    };

    initDeepLink();

    // Check initial auth state
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
      } catch (err: unknown) {
        console.error('Auth check error:', err);
        setError(err instanceof Error ? err.message : 'Auth error');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Subscribe to auth changes
    let subscription: { unsubscribe: () => void } | undefined;
    try {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setIsAuthenticated(!!session);
      });
      subscription = data.subscription;
    } catch (err) {
      console.error('Failed to subscribe to auth changes:', err);
    }

    return () => {
      subscription?.unsubscribe();
      DeepLinkHandler.cleanup();
    };
  }, []);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <AppNavigator
            isAuthenticated={isAuthenticated}
            isLoading={isLoading}
            userRole={userRole}
            onRoleSelected={setUserRole}
          />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
});
