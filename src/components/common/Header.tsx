import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import { Colors } from '../../constants/colors';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  onBack?: () => void;
}

/**
 * Header component with consistent styling across all screens.
 * 
 * Features:
 * - Back button: 44px minimum size, ChevronLeft icon (24px)
 * - Semi-transparent background with shadow
 * - Title pill with backdrop styling
 */
export function Header({ title, showBack = false, rightAction, onBack }: HeaderProps) {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.leftContainer}>
        {showBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack || (() => navigation.goBack())}
            activeOpacity={0.7}
          >
            <ChevronLeft size={24} color={Colors.gray700} />
          </TouchableOpacity>
        )}
        {title ? (
          <View style={styles.titlePill}>
            <Text style={styles.title}>{title}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.rightContainer}>{rightAction}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 50,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    // 44px minimum size (12 padding * 2 + 24 icon = 48px)
    minWidth: 44,
    minHeight: 44,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadowColor,
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  titlePill: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.gray800,
    letterSpacing: -0.5,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
