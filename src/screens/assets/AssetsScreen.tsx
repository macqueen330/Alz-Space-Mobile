import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Gamepad2, HelpCircle, Image, Music, Video, Plus } from 'lucide-react-native';

import { supabase } from '../../services/supabaseClient';
import { getAssets } from '../../services/assetService';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';
import type { AssetData, Asset } from '../../types';

const categoryIcons: Record<string, any> = {
  'Cognitive Games': Gamepad2,
  'Cognitive Quizzes': HelpCircle,
  'Family Media': Image,
  'Interactive Media': Music,
};

const categoryColors: Record<string, string> = {
  'Cognitive Games': Colors.primary,
  'Cognitive Quizzes': Colors.secondary,
  'Family Media': Colors.success,
  'Interactive Media': Colors.warning,
};

export function AssetsScreen() {
  const [assets, setAssets] = useState<AssetData>({});
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const loadAssets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const userAssets = await getAssets(user.id);
      setAssets(userAssets);
    } catch (error) {
      console.error('Error loading assets:', error);
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

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

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {categories.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No assets yet</Text>
            <Text style={styles.emptySubtext}>
              Add games, quizzes, and media for patient activities
            </Text>
          </View>
        ) : (
          categories.map(category => {
            const Icon = categoryIcons[category] || HelpCircle;
            const color = categoryColors[category] || Colors.primary;
            const categoryAssets = assets[category] || [];

            return (
              <View key={category} style={styles.categorySection}>
                <TouchableOpacity
                  style={styles.categoryHeader}
                  onPress={() =>
                    setSelectedCategory(selectedCategory === category ? null : category)
                  }
                >
                  <View style={[styles.categoryIcon, { backgroundColor: color + '20' }]}>
                    <Icon size={24} color={color} />
                  </View>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryTitle}>{category}</Text>
                    <Text style={styles.categoryCount}>
                      {categoryAssets.length} items
                    </Text>
                  </View>
                </TouchableOpacity>

                {selectedCategory === category && (
                  <View style={styles.assetsList}>
                    {categoryAssets.map((asset: Asset) => {
                      const AssetIcon = getAssetIcon(asset.type);
                      return (
                        <View key={asset.id} style={styles.assetCard}>
                          <AssetIcon size={20} color={Colors.textSecondary} />
                          <View style={styles.assetInfo}>
                            <Text style={styles.assetTitle}>{asset.title}</Text>
                            <Text style={styles.assetDuration}>{asset.duration}</Text>
                          </View>
                        </View>
                      );
                    })}
                    <TouchableOpacity style={styles.addAssetButton}>
                      <Plus size={20} color={Colors.primary} />
                      <Text style={styles.addAssetText}>Add {category.split(' ')[1]}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgSoft,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Layout.spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    padding: Layout.spacing.xxl,
  },
  emptyText: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.textMain,
  },
  emptySubtext: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
    marginTop: Layout.spacing.xs,
    textAlign: 'center',
  },
  categorySection: {
    backgroundColor: Colors.bgWhite,
    borderRadius: Layout.borderRadius.lg,
    marginBottom: Layout.spacing.md,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.md,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryInfo: {
    flex: 1,
    marginLeft: Layout.spacing.md,
  },
  categoryTitle: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.textMain,
  },
  categoryCount: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  assetsList: {
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    padding: Layout.spacing.md,
  },
  assetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Layout.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  assetInfo: {
    flex: 1,
    marginLeft: Layout.spacing.md,
  },
  assetTitle: {
    fontSize: Layout.fontSize.md,
    color: Colors.textMain,
  },
  assetDuration: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
  },
  addAssetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.md,
    marginTop: Layout.spacing.sm,
  },
  addAssetText: {
    fontSize: Layout.fontSize.md,
    color: Colors.primary,
    marginLeft: Layout.spacing.sm,
  },
});
