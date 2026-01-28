import { supabase } from './supabaseClient';
import type { UserSearchResult, UserRole } from '../types';

// Search for a user by UID or Phone number
export const searchUserByIdentifier = async (identifier: string): Promise<UserSearchResult | null> => {
    if (!identifier || identifier.trim().length < 3) {
        return null;
    }

    const searchTerm = identifier.trim().toUpperCase();

    try {
        let { data, error } = await supabase
            .from('profiles')
            .select('id, uid, name, avatar_url, role, phone')
            .or(`uid.eq.${searchTerm},phone.eq.${identifier.trim()}`)
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Search error:', error);
            throw error;
        }

        if (!data) {
            const { data: phoneData, error: phoneError } = await supabase
                .from('profiles')
                .select('id, uid, name, avatar_url, role, phone')
                .ilike('phone', `%${identifier.trim()}%`)
                .limit(1)
                .single();

            if (phoneError && phoneError.code !== 'PGRST116') {
                console.error('Phone search error:', phoneError);
            }

            data = phoneData;
        }

        if (!data) {
            return null;
        }

        return {
            id: data.id,
            uid: data.uid || '',
            name: data.name,
            avatarUrl: data.avatar_url || 'https://picsum.photos/100',
            role: data.role as UserRole,
            phone: data.phone || undefined
        };
    } catch (error) {
        console.error('Error searching user:', error);
        return null;
    }
};

// Get the current user's UID
export const getMyUID = async (userId: string): Promise<string | null> => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('uid')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data?.uid || null;
    } catch (error) {
        console.error('Error getting user UID:', error);
        return null;
    }
};

// Get full profile by user ID
export const getProfileById = async (userId: string): Promise<UserSearchResult | null> => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, uid, name, avatar_url, role, phone')
            .eq('id', userId)
            .single();

        if (error) throw error;
        if (!data) return null;

        return {
            id: data.id,
            uid: data.uid || '',
            name: data.name,
            avatarUrl: data.avatar_url || 'https://picsum.photos/100',
            role: data.role as UserRole,
            phone: data.phone || undefined
        };
    } catch (error) {
        console.error('Error getting profile:', error);
        return null;
    }
};

// Ensure user has a UID
export const ensureUserHasUID = async (userId: string): Promise<string | null> => {
    try {
        const existingUID = await getMyUID(userId);
        if (existingUID) return existingUID;

        const newUID = 'ALZ-' + Math.random().toString(36).substring(2, 8).toUpperCase();

        const { error } = await supabase
            .from('profiles')
            .update({ uid: newUID })
            .eq('id', userId);

        if (error) throw error;
        return newUID;
    } catch (error) {
        console.error('Error ensuring user has UID:', error);
        return null;
    }
};
