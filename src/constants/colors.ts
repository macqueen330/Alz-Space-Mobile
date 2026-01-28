export const Colors = {
  // Primary colors
  primary: '#F97316',      // Orange
  secondary: '#06B6D4',    // Cyan
  accent: '#10B981',       // Green

  // Background
  bgSoft: '#F9FAFB',
  bgWhite: '#FFFFFF',

  // Text
  textMain: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',

  // Status
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Grays
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  // Shadows (for iOS)
  shadowColor: '#000000',
} as const;

export type ColorKey = keyof typeof Colors;
