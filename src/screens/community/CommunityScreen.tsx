import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, Eye, MessageCircle, Plus } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';

import { getPosts, likePost, incrementViews } from '../../services/postService';
import { supabase } from '../../services/supabaseClient';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';
import type { Post } from '../../types';

const typeColors: Record<string, string> = {
  Story: Colors.primary,
  Question: Colors.secondary,
  Tip: Colors.success,
  Task: Colors.warning,
};

export function CommunityScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);

      const allPosts = await getPosts();
      setPosts(allPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPosts();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const handleLike = async (postId: string) => {
    if (!userId) return;
    try {
      await likePost(postId, userId);
      // Optimistic update
      setPosts(prev =>
        prev.map(p =>
          p.id === postId ? { ...p, likes: p.likes + 1 } : p
        )
      );
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleView = async (postId: string) => {
    try {
      await incrementViews(postId);
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesType = selectedType ? post.type === selectedType : true;
    const matchesSearch =
      !searchQuery.trim() ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const renderPost = ({ item: post }: { item: Post }) => (
    <TouchableOpacity
      style={styles.postCard}
      onPress={() => handleView(post.id)}
    >
      {/* Header */}
      <View style={styles.postHeader}>
        <Image
          source={{ uri: post.authorAvatar }}
          style={styles.authorAvatar}
        />
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{post.author}</Text>
          {post.type && (
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: (typeColors[post.type] || Colors.primary) + '20' },
              ]}
            >
              <Text
                style={[
                  styles.typeText,
                  { color: typeColors[post.type] || Colors.primary },
                ]}
              >
                {post.type}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Content */}
      <Text style={styles.postTitle}>{post.title}</Text>
      <Text style={styles.postContent} numberOfLines={3}>
        {post.content}
      </Text>

      {/* Image */}
      {post.image && (
        <Image source={{ uri: post.image }} style={styles.postImage} />
      )}

      {/* Tags */}
      {post.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {post.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleLike(post.id)}
        >
          <Heart size={18} color={Colors.error} />
          <Text style={styles.actionText}>{post.likes}</Text>
        </TouchableOpacity>
        <View style={styles.actionButton}>
          <Eye size={18} color={Colors.textSecondary} />
          <Text style={styles.actionText}>{post.views}</Text>
        </View>
        <TouchableOpacity style={styles.actionButton}>
          <MessageCircle size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Background decorations */}
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />
      <View style={styles.blobMidRight} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Community</Text>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search stories, questions, tips..."
          placeholderTextColor={Colors.gray400}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollableFilters
          selectedType={selectedType}
          onSelect={setSelectedType}
        />
      </View>

      {/* Posts List */}
      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        numColumns={2}
        columnWrapperStyle={styles.postRow}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>
              Be the first to share your story!
            </Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} activeOpacity={0.9}>
        <Plus size={20} color={Colors.bgWhite} />
        <Text style={styles.fabText}>Post</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function ScrollableFilters({
  selectedType,
  onSelect,
}: {
  selectedType: string | null;
  onSelect: (type: string | null) => void;
}) {
  const types = ['Story', 'Question', 'Tip', 'Task'];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.filtersRow}>
        <TouchableOpacity
          style={[
            styles.filterChip,
            !selectedType && styles.filterChipActive,
          ]}
          onPress={() => onSelect(null)}
        >
          <Text
            style={[
              styles.filterChipText,
              !selectedType && styles.filterChipTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        {types.map(type => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterChip,
              selectedType === type && styles.filterChipActive,
            ]}
            onPress={() => onSelect(type)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedType === type && styles.filterChipTextActive,
              ]}
            >
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgWhite,
  },

  blobTopRight: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(78,205,196,0.15)',
  },
  blobBottomLeft: {
    position: 'absolute',
    bottom: '10%',
    left: -40,
    width: 288,
    height: 288,
    borderRadius: 144,
    backgroundColor: 'rgba(255,140,66,0.1)',
  },
  blobMidRight: {
    position: 'absolute',
    top: '40%',
    right: -20,
    width: 224,
    height: 224,
    borderRadius: 112,
    backgroundColor: 'rgba(139,92,246,0.5)',
    opacity: 0.6,
  },

  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.gray800,
    letterSpacing: -0.5,
  },
  searchWrap: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: Colors.bgWhite,
    borderWidth: 1,
    borderColor: Colors.gray100,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.gray800,
    shadowColor: Colors.shadowColor,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  filterContainer: {
    paddingBottom: 12,
  },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: Colors.bgWhite,
    marginRight: 12,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    color: Colors.gray500,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  filterChipTextActive: {
    color: Colors.bgWhite,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  postRow: {
    justifyContent: 'space-between',
  },
  postCard: {
    backgroundColor: Colors.bgWhite,
    borderRadius: 24,
    padding: 14,
    marginBottom: 12,
    width: '48%',
    borderWidth: 1,
    borderColor: Colors.gray100,
    shadowColor: Colors.shadowColor,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  authorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  authorInfo: {
    flex: 1,
    marginLeft: Layout.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.gray700,
  },
  typeBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  postTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.gray800,
    marginBottom: Layout.spacing.xs,
  },
  postContent: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  postImage: {
    width: '100%',
    height: 120,
    borderRadius: 16,
    marginTop: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    marginTop: Layout.spacing.sm,
  },
  tag: {
    backgroundColor: Colors.gray100,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 2,
    borderRadius: Layout.borderRadius.sm,
    marginRight: Layout.spacing.xs,
  },
  tagText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.primary,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  actionText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginLeft: 4,
    fontWeight: '700',
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
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 999,
    shadowColor: '#FDBA74',
    shadowOpacity: 0.8,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  fabText: {
    color: Colors.bgWhite,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
