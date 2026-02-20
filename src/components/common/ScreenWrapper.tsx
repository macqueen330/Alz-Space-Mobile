import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

interface ScreenWrapperProps {
  children: React.ReactNode;
  /** Use SafeAreaView (default: true) */
  useSafeArea?: boolean;
  /** SafeArea edges to apply (default: ['top']) */
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  /** Additional container style */
  style?: ViewStyle;
  /** Show gradient overlay (default: true) */
  showGradient?: boolean;
  /** Show blob decorations (default: true) */
  showBlobs?: boolean;
  /** Background color (default: Colors.bgWhite) */
  backgroundColor?: string;
}

/**
 * ScreenWrapper provides consistent background styling across all screens.
 * 
 * Features:
 * - Standard gradient overlay (128px height, secondary with 15% opacity)
 * - Standard blob decorations (top-right and bottom-left)
 * - SafeAreaView handling
 * - Configurable options for different screen needs
 */
export function ScreenWrapper({
  children,
  useSafeArea = true,
  edges = ['top'],
  style,
  showGradient = true,
  showBlobs = true,
  backgroundColor = Colors.bgWhite,
}: ScreenWrapperProps) {
  const Container = useSafeArea ? SafeAreaView : View;

  return (
    <Container style={[styles.container, { backgroundColor }, style]} edges={edges}>
      {/* Background decorations */}
      {showGradient && <View style={styles.gradientTop} />}
      {showBlobs && (
        <>
          <View style={styles.blobTopRight} />
          <View style={styles.blobBottomLeft} />
        </>
      )}
      
      {/* Content */}
      {children}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgWhite,
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 128, // Standardized from web's h-32
    backgroundColor: Colors.secondary,
    opacity: 0.15,
  },
  blobTopRight: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 288, // web's w-72
    height: 288,
    borderRadius: 144,
    backgroundColor: Colors.secondary,
    opacity: 0.15,
  },
  blobBottomLeft: {
    position: 'absolute',
    bottom: -50,
    left: -50,
    width: 256, // web's w-64
    height: 256,
    borderRadius: 128,
    backgroundColor: Colors.primary,
    opacity: 0.1,
  },
});
