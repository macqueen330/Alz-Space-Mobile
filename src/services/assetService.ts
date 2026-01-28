import { supabase } from './supabaseClient';
import type { Asset, AssetData } from '../types';
import type { AssetDB } from '../types/database.types';

// Convert database row to frontend type
const toAsset = (row: AssetDB): Asset => ({
    id: row.id,
    title: row.title,
    duration: row.duration,
    type: row.type,
    subtype: row.subtype || undefined,
    quizData: row.quiz_data as any
});

// Get all assets for current user grouped by category
export const getAssets = async (userId: string): Promise<AssetData> => {
    const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;

    const assetData: AssetData = {};
    (data || []).forEach(row => {
        const asset = toAsset(row);
        if (!assetData[row.category]) {
            assetData[row.category] = [];
        }
        assetData[row.category].push(asset);
    });

    return assetData;
};

// Get assets by category
export const getAssetsByCategory = async (userId: string, category: string): Promise<Asset[]> => {
    const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('user_id', userId)
        .eq('category', category)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(toAsset);
};

// Add a new asset
export const addAsset = async (userId: string, category: string, asset: Omit<Asset, 'id'>): Promise<Asset> => {
    const { data, error } = await supabase
        .from('assets')
        .insert({
            user_id: userId,
            title: asset.title,
            duration: asset.duration,
            type: asset.type,
            subtype: asset.subtype,
            category: category,
            quiz_data: asset.quizData
        })
        .select()
        .single();

    if (error) throw error;
    return toAsset(data);
};

// Update an asset
export const updateAsset = async (assetId: string, updates: Partial<Asset>): Promise<Asset> => {
    const dbUpdates: any = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.duration !== undefined) dbUpdates.duration = updates.duration;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.subtype !== undefined) dbUpdates.subtype = updates.subtype;
    if (updates.quizData !== undefined) dbUpdates.quiz_data = updates.quizData;

    const { data, error } = await supabase
        .from('assets')
        .update(dbUpdates)
        .eq('id', assetId)
        .select()
        .single();

    if (error) throw error;
    return toAsset(data);
};

// Delete an asset
export const deleteAsset = async (assetId: string): Promise<void> => {
    const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', assetId);

    if (error) throw error;
};

// Seed initial assets for a new user
export const seedInitialAssets = async (userId: string): Promise<void> => {
    const initialAssets = [
        { category: 'Cognitive Games', title: 'Memory Match', duration: '15m', type: 'Game' },
        { category: 'Cognitive Games', title: 'Pattern Puzzle', duration: '15m', type: 'Game' },
        { category: 'Cognitive Games', title: 'Speed Sort', duration: '10m', type: 'Game' },
        { category: 'Cognitive Games', title: 'Color Connect', duration: '20m', type: 'Game' },
        { category: 'Cognitive Quizzes', title: 'Daily Trivia', duration: '10m', type: 'Quiz' },
        { category: 'Cognitive Quizzes', title: 'Word Association', duration: '15m', type: 'Quiz' },
        { category: 'Cognitive Quizzes', title: 'Math Basics', duration: '10m', type: 'Quiz' },
        { category: 'Cognitive Quizzes', title: 'Logic Blocks', duration: '15m', type: 'Quiz' },
        { category: 'Family Media', title: 'Grandkids Photos', duration: 'N/A', type: 'Photo' },
        { category: 'Family Media', title: 'Birthday Greetings', duration: '5m', type: 'Video' },
        { category: 'Family Media', title: 'Wedding Anniversary', duration: '20m', type: 'Video' },
        { category: 'Interactive Media', title: "60s Greatest Hits", duration: '30m', type: 'Audio' },
        { category: 'Interactive Media', title: 'Nature Soundscape', duration: '60m', type: 'Audio' },
        { category: 'Interactive Media', title: 'Piano Classics', duration: '45m', type: 'Audio' },
    ];

    const { error } = await supabase
        .from('assets')
        .insert(initialAssets.map(a => ({ ...a, user_id: userId })));

    if (error) throw error;
};
