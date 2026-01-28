import { supabase } from './supabaseClient';
import type { Post } from '../types';
import type { PostDB } from '../types/database.types';

// Convert database row to frontend type
const toPost = (row: PostDB & { profiles?: { name: string; avatar_url: string } }): Post => ({
    id: row.id,
    author: row.profiles?.name || 'Unknown',
    authorAvatar: row.profiles?.avatar_url || 'https://picsum.photos/50',
    image: row.image_url || undefined,
    title: row.title,
    content: row.content,
    likes: row.likes_count,
    views: row.views_count,
    tags: row.tags as string[],
    type: row.type,
    attachedTask: row.attached_task || undefined,
    contentImages: row.content_images as string[]
});

// Get all posts
export const getPosts = async (): Promise<Post[]> => {
    const { data, error } = await supabase
        .from('posts')
        .select(`
      *,
      profiles:author_id (name, avatar_url)
    `)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(toPost);
};

// Get a single post by ID
export const getPostById = async (postId: string): Promise<Post> => {
    const { data, error } = await supabase
        .from('posts')
        .select(`
      *,
      profiles:author_id (name, avatar_url)
    `)
        .eq('id', postId)
        .single();

    if (error) throw error;
    return toPost(data);
};

// Create a new post
export const createPost = async (authorId: string, post: {
    title: string;
    content: string;
    type: 'Story' | 'Question' | 'Tip' | 'Task';
    imageUrl?: string;
    attachedTask?: string;
    tags?: string[];
}): Promise<Post> => {
    const { data, error } = await supabase
        .from('posts')
        .insert({
            author_id: authorId,
            title: post.title,
            content: post.content,
            type: post.type,
            image_url: post.imageUrl,
            attached_task: post.attachedTask,
            tags: post.tags || [post.type]
        })
        .select(`
      *,
      profiles:author_id (name, avatar_url)
    `)
        .single();

    if (error) throw error;
    return toPost(data);
};

// Like a post
export const likePost = async (postId: string, userId: string): Promise<void> => {
    const { data: existing } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single();

    if (existing) {
        await supabase.from('post_likes').delete().eq('id', existing.id);
    } else {
        await supabase.from('post_likes').insert({ post_id: postId, user_id: userId });
    }
};

// Increment post views
export const incrementViews = async (postId: string): Promise<void> => {
    const { data } = await supabase
        .from('posts')
        .select('views_count')
        .eq('id', postId)
        .single();

    if (data) {
        await supabase
            .from('posts')
            .update({ views_count: (data.views_count || 0) + 1 })
            .eq('id', postId);
    }
};

// Delete a post
export const deletePost = async (postId: string): Promise<void> => {
    const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

    if (error) throw error;
};
