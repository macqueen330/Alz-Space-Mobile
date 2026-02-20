import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Gamepad2,
  HelpCircle,
  Image,
  Music,
  Video,
  Plus,
  ChevronLeft,
  ArrowRight,
} from 'lucide-react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { supabase } from '../../services/supabaseClient';
import { getAssets } from '../../services/assetService';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';
import type { AssetData, Asset, RootStackParamList } from '../../types';

const categoryIcons: Record<string, any> = {
  'Cognitive Games': Gamepad2,
  'Cognitive Quizzes': HelpCircle,
  'Family Media': Image,
  'Interactive Media': Music,
};

const categoryColors: Record<string, string> = {
  'Cognitive Games': '#7C3AED', // Purple
  'Cognitive Quizzes': Colors.secondary,
  'Family Media': '#3B82F6', // Blue
  'Interactive Media': Colors.primary,
};

export function AssetsScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [assets, setAssets] = useState<AssetData>({});
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const loadAssets = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const userAssets = await getAssets(user.id);
      setAssets(userAssets);
    } catch (error) {
      console.error('Error loading assets:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAssets();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAssets();
    setRefreshing(false);
  };

  const categories = Object.keys(assets);

  const getAssetIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'game':
        return Gamepad2;
      case 'quiz':
        return HelpCircle;
      case 'photo':
        return Image;
      case 'video':
        return Video;
      case 'audio':
        return Music;
      default:
        return HelpCircle;
    }
  };

  const handleBack = () => {
    if (selectedCategory) {
      setSelectedCategory(null);
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Background decorations */}
      <View style={styles.gradientTop} />
      <View style={styles.blobTopRight} />

      {/* Header with back button */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <ChevronLeft size={24} color={Colors.gray700} />
        </TouchableOpacity>
        <View style={styles.headerTitlePill}>
          <Text style={styles.headerTitle}>
            {selectedCategory || 'Assets Library'}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {!selectedCategory ? (
          // Category list view
          <>
            {categories.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Gamepad2 size={32} color={Colors.gray400} />
                </View>
                <Text style={styles.emptyText}>No assets yet</Text>
                <Text style={styles.emptySubtext}>
                  Add games, quizzes, and media for patient activities
                </Text>
              </View>
            ) : (
              categories.map((category) => {
                const Icon = categoryIcons[category] || HelpCircle;
                const color = categoryColors[category] || Colors.primary;
                const categoryAssets = assets[category] || [];

                return (
                  <TouchableOpacity
                    key={category}
                    style={styles.categoryCard}
                    onPress={() => setSelectedCategory(category)}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.categoryIcon,
                        { backgroundColor: color + '15' },
                      ]}
                    >
                      <Icon size={28} color={color} />
                    </View>
                    <View style={styles.categoryInfo}>
                      <Text style={styles.categoryTitle}>{category}</Text>
                      <Text style={styles.categoryCount}>
                        {categoryAssets.length} items
                      </Text>
                    </View>
                    <View style={styles.arrowButton}>
                      <ArrowRight size={18} color={Colors.gray300} />
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </>
        ) : (
          // Assets in category view
          <View style={styles.assetsList}>
            {(assets[selectedCategory] || []).map((asset: Asset) => {
              const AssetIcon = getAssetIcon(asset.type);
              return (
                <View key={asset.id} style={styles.assetCard}>
                  <View style={styles.assetIconWrap}>
                    <Text style={styles.assetIconText}>
                      {asset.type[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.assetInfo}>
                    <Text style={styles.assetTitle} numberOfLines={1}>
                      {asset.title}
                    </Text>
                    <View style={styles.assetMeta}>
                      <Text style={styles.assetType}>{asset.type}</Text>
                      <Text style={styles.assetDot}>•</Text>
                      <Text style={styles.assetDuration}>{asset.duration}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.previewButton}>
                    <Text style={styles.previewButtonText}>Preview</Text>
                  </TouchableOpacity>
                </View>
              );
            })}

            {(assets[selectedCategory] || []).length === 0 && (
              <View style={styles.emptyCategory}>
                <Text style={styles.emptyCategoryText}>
                  No assets in this category yet.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.fabButton} activeOpacity={0.8}>
          <Plus size={20} color={Colors.bgWhite} />
          <Text style={styles.fabText}>ADD ASSET</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgWhite,
  },

  // ============ Background Decorations ============
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 128,
    backgroundColor: Colors.secondary,
    opacity: 0.15,
  },
  blobTopRight: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 288,
    height: 288,
    borderRadius: 144,
    backgroundColor: Colors.secondary,
    opacity: 0.15,
  },

  // ============ Header ============
  headerRow: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 50,
  },
  backButton: {
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
  },
  headerTitlePill: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.gray800,
    letterSpacing: -0.3,
  },

  // ============ Content ============
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Layout.spacing.md,
    paddingTop: 0,
    paddingBottom: 140,
  },

  // ============ Empty State ============
  emptyState: {
    alignItems: 'center',
    padding: Layout.spacing.xxl,
    paddingTop: 60,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.gray800,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // ============ Category Cards ============
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryInfo: {
    flex: 1,
    marginLeft: Layout.spacing.md,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.gray800,
  },
  categoryCount: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  arrowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bgWhite,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadowColor,
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  // ============ Assets List ============
  assetsList: {
    gap: 12,
  },
  assetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgWhite,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.gray100,
    shadowColor: Colors.shadowColor,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  assetIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assetIconText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.gray500,
  },
  assetInfo: {
    flex: 1,
    marginLeft: 12,
  },
  assetTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.gray800,
    marginBottom: 2,
  },
  assetMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  assetType: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.gray400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  assetDot: {
    fontSize: 10,
    color: Colors.gray300,
  },
  assetDuration: {
    fontSize: 11,
    color: Colors.gray400,
  },
  previewButton: {
    backgroundColor: Colors.gray900,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  previewButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.bgWhite,
  },
  emptyCategory: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyCategoryText: {
    fontSize: 14,
    color: Colors.gray400,
    fontWeight: '500',
  },

  // ============ FAB ============
  fabContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  fabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 999,
    gap: 8,
    shadowColor: '#FDBA74',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  fabText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.bgWhite,
    letterSpacing: 1,
  },
});
