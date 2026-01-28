import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, Eye, MessageCircle, Plus } from 'lucide-react-native';

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

  useEffect(() => {
    loadPosts();
  }, []);

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

  const filteredPosts = selectedType
    ? posts.filter(p => p.type === selectedType)
    : posts;

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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Community</Text>
        <TouchableOpacity style={styles.createButton}>
          <Plus size={24} color={Colors.bgWhite} />
        </TouchableOpacity>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgSoft,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Layout.spacing.md,
    backgroundColor: Colors.bgWhite,
  },
  title: {
    fontSize: Layout.fontSize.xxl,
    fontWeight: 'bold',
    color: Colors.textMain,
  },
  createButton: {
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    backgroundColor: Colors.bgWhite,
    paddingBottom: Layout.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: Layout.spacing.md,
  },
  filterChip: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.gray100,
    marginRight: Layout.spacing.sm,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterChipText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: Colors.bgWhite,
  },
  content: {
    padding: Layout.spacing.md,
  },
  postCard: {
    backgroundColor: Colors.bgWhite,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  authorInfo: {
    flex: 1,
    marginLeft: Layout.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.textMain,
  },
  typeBadge: {
    marginLeft: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 2,
    borderRadius: Layout.borderRadius.sm,
  },
  typeText: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '500',
  },
  postTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.textMain,
    marginBottom: Layout.spacing.xs,
  },
  postContent: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: Layout.borderRadius.md,
    marginTop: Layout.spacing.md,
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
    marginTop: Layout.spacing.md,
    paddingTop: Layout.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Layout.spacing.lg,
  },
  actionText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    marginLeft: Layout.spacing.xs,
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
});
