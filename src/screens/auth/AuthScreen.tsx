import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, ChevronLeft } from 'lucide-react-native';

import { signIn, signUp, signInWithProvider } from '../../services/authService';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';
import { UserRole } from '../../types';
import { BrandLogo } from '../../components/common/BrandLogo';

type AuthStep = 'splash' | 'role' | 'login' | 'signup';

interface AuthScreenProps {
  onRoleSelected: (role: UserRole) => void;
}

export function AuthScreen({ onRoleSelected }: AuthScreenProps) {
  const [step, setStep] = useState<AuthStep>('splash');
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.CAREGIVER);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailLogin = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await signIn({ email, password });
      onRoleSelected(selectedRole);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignup = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await signUp({ email, password, name: name || undefined });
      onRoleSelected(selectedRole);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithProvider(provider);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Social login failed. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Splash screen
  if (step === 'splash') {
    return (
      <SafeAreaView style={styles.full}>
        <View style={styles.splashContainer}>
          {/* Background decorations */}
          <View style={styles.gradientTop} />
          <View style={styles.blobBlueLarge} />
          <View style={styles.blobOrangeLarge} />
          <View style={styles.blobYellow} />
          <View style={styles.blobGreen} />

          {/* Logo - SVG vector */}
          <View style={styles.logoWrap}>
            <BrandLogo size={200} />
          </View>

          <Text style={styles.splashTitle}>Alz Space</Text>
          <Text style={styles.splashSubtitle}>
            Reconnecting memories,{'\n'}rhythmic care.
          </Text>

          <TouchableOpacity
            style={styles.primaryPill}
            onPress={() => setStep('role')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryPillText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Role selection screen
  if (step === 'role') {
    return (
      <SafeAreaView style={styles.full}>
        <View style={styles.roleContainer}>
          {/* Background decorations */}
          <View style={styles.gradientTop} />
          <View style={styles.blobBlueLarge} />
          <View style={styles.blobOrangeLarge} />
          <View style={styles.blobYellow} />
          <View style={styles.blobGreen} />

          <View style={styles.roleContent}>
            <Text style={styles.roleTitle}>Choose your identity</Text>
            <View style={styles.roleCardsRow}>
              <TouchableOpacity
                style={[
                  styles.roleCard,
                  selectedRole === UserRole.CAREGIVER && styles.roleCardActive,
                ]}
                onPress={() => setSelectedRole(UserRole.CAREGIVER)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.roleIconWrap,
                    selectedRole === UserRole.CAREGIVER && styles.roleIconActive,
                  ]}
                >
                  <User
                    size={32}
                    color={selectedRole === UserRole.CAREGIVER ? Colors.bgWhite : Colors.info}
                  />
                </View>
                <Text
                  style={[
                    styles.roleLabel,
                    selectedRole === UserRole.CAREGIVER && styles.roleLabelActive,
                  ]}
                >
                  Family
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleCard,
                  selectedRole === UserRole.PATIENT && styles.roleCardActive,
                ]}
                onPress={() => setSelectedRole(UserRole.PATIENT)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.roleIconWrap,
                    selectedRole === UserRole.PATIENT && styles.roleIconActive,
                  ]}
                >
                  <User
                    size={32}
                    color={selectedRole === UserRole.PATIENT ? Colors.bgWhite : Colors.accent}
                  />
                </View>
                <Text
                  style={[
                    styles.roleLabel,
                    selectedRole === UserRole.PATIENT && styles.roleLabelActive,
                  ]}
                >
                  Patient
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.primaryPill}
            onPress={() => setStep('login')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryPillText}>Next</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Login / Signup screen
  const isSignup = step === 'signup';

  return (
    <SafeAreaView style={styles.full}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.full}
      >
        <ScrollView
          contentContainerStyle={styles.authScroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Background decorations */}
          <View style={styles.gradientTop} />
          <View style={styles.blobBlueLarge} />
          <View style={styles.blobOrangeLarge} />
          <View style={styles.blobYellow} />
          <View style={styles.blobGreen} />

          {/* Back button - icon style, 44px minimum */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep('role')}
            activeOpacity={0.7}
          >
            <ChevronLeft size={24} color={Colors.gray700} />
          </TouchableOpacity>

          <View style={styles.authHeader}>
            <Text style={styles.authTitle}>
              {isSignup ? 'Create Account' : 'Welcome Back'}
            </Text>
            <Text style={styles.authSubtitle}>
              {isSignup
                ? 'Sign up to get started'
                : 'Please enter your details to login'}
            </Text>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <AlertCircle size={16} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.form}>
            {isSignup && (
              <View style={styles.inputContainer}>
                <User size={18} color={Colors.gray400} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor={Colors.gray400}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Mail size={18} color={Colors.gray400} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={Colors.gray400}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputContainer}>
              <Lock size={18} color={Colors.gray400} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={Colors.gray400}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                {showPassword ? (
                  <EyeOff size={18} color={Colors.gray400} />
                ) : (
                  <Eye size={18} color={Colors.gray400} />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.primaryPill, isLoading && styles.buttonDisabled]}
              onPress={isSignup ? handleEmailSignup : handleEmailLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.bgWhite} />
              ) : (
                <Text style={styles.primaryPillText}>
                  {isSignup ? 'Sign Up' : 'Sign In'}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialLogin('google')}
              activeOpacity={0.8}
            >
              <Text style={styles.socialButtonText}>Continue with Google</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              {isSignup ? 'Already have an account? ' : "Don't have an account? "}
            </Text>
            <TouchableOpacity onPress={() => setStep(isSignup ? 'login' : 'signup')}>
              <Text style={styles.toggleLink}>{isSignup ? 'Sign In' : 'Sign Up'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  full: {
    flex: 1,
    backgroundColor: Colors.bgWhite,
  },

  // ============ Background Decorations (Standardized) ============
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 160,
    backgroundColor: Colors.secondary,
    opacity: 0.15,
  },
  blobBlueLarge: {
    position: 'absolute',
    top: -72,
    left: -72,
    width: 288,
    height: 288,
    borderRadius: 144,
    backgroundColor: '#DBEAFE',
    opacity: 0.7,
  },
  blobOrangeLarge: {
    position: 'absolute',
    bottom: -60,
    right: -60,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#FFEDD5',
    opacity: 0.7,
  },
  blobYellow: {
    position: 'absolute',
    top: '30%',
    right: -80,
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: '#FEF9C3',
    opacity: 0.5,
  },
  blobGreen: {
    position: 'absolute',
    bottom: '20%',
    left: -60,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: '#DCFCE7',
    opacity: 0.4,
  },

  // ============ Splash Screen ============
  splashContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Layout.spacing.lg,
    backgroundColor: Colors.bgWhite,
  },
  logoWrap: {
    width: 224,
    height: 224,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout.spacing.lg,
  },
  logoImage: {
    width: 224,
    height: 224,
  },
  splashTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.gray800,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  splashSubtitle: {
    fontSize: 18,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 64,
    lineHeight: 26,
    fontWeight: '500',
  },

  // ============ Primary Button ============
  primaryPill: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 999,
    alignItems: 'center',
    alignSelf: 'stretch',
    marginHorizontal: Layout.spacing.lg,
    shadowColor: '#FDBA74',
    shadowOpacity: 0.6,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  primaryPillText: {
    color: Colors.bgWhite,
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.7,
  },

  // ============ Role Selection Screen ============
  roleContainer: {
    flex: 1,
    padding: Layout.spacing.lg,
    backgroundColor: Colors.bgWhite,
    justifyContent: 'space-between',
  },
  roleContent: {
    flex: 1,
    justifyContent: 'center',
  },
  roleTitle: {
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    color: Colors.gray800,
    marginBottom: 32,
    letterSpacing: -0.5,
  },
  roleCardsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  roleCard: {
    width: 160,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    backgroundColor: Colors.gray50,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roleCardActive: {
    borderColor: Colors.primary,
    backgroundColor: '#FFF7ED',
  },
  roleIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  roleIconActive: {
    backgroundColor: Colors.primary,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.gray600,
  },
  roleLabelActive: {
    color: Colors.primary,
  },

  // ============ Auth (Login/Signup) Screen ============
  authScroll: {
    flexGrow: 1,
    padding: Layout.spacing.lg,
    paddingTop: Layout.spacing.md,
  },
  backButton: {
    // 44px minimum size
    minWidth: 44,
    minHeight: 44,
    width: 44,
    height: 44,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadowColor,
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: Layout.spacing.lg,
  },
  authHeader: {
    marginBottom: Layout.spacing.lg,
  },
  authTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.gray800,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  authSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 12,
    padding: 12,
    marginBottom: Layout.spacing.md,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 1,
  },
  form: {
    gap: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 14,
    color: Colors.textMain,
  },
  eyeButton: {
    padding: 6,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Layout.spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.gray200,
  },
  dividerText: {
    marginHorizontal: 12,
    color: Colors.textMuted,
    fontSize: 12,
  },
  socialButton: {
    backgroundColor: Colors.bgWhite,
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  socialButtonText: {
    color: Colors.textMain,
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Layout.spacing.xl,
  },
  toggleText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  toggleLink: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
