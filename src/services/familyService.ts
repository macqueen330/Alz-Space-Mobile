import { supabase } from './supabaseClient';
import type { FamilyMember, UserRole, UserSearchResult } from '../types';
import type { FamilyMemberDB, Database } from '../types/database.types';

type FamilyMemberInsert = Database['public']['Tables']['family_members']['Insert'];

// Convert database row to frontend type
const toFamilyMember = (row: FamilyMemberDB): FamilyMember => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    role: row.role as UserRole,
    avatarUrl: row.avatar_url || 'https://picsum.photos/100',
    isOwner: row.is_owner,
    relation: row.relation || undefined,
    age: row.age || undefined,
    gender: row.gender || undefined,
    condition: row.condition || undefined,
    linkedProfileId: row.linked_profile_id || undefined,
    invitationStatus: row.invitation_status || 'none'
});

// Get all family members for current user
export const getFamilyMembers = async (userId: string): Promise<FamilyMember[]> => {
    const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []).map(toFamilyMember);
};

// Add a new family member
export const addFamilyMember = async (userId: string, member: Omit<FamilyMember, 'id'>): Promise<FamilyMember> => {
    const insertData: FamilyMemberInsert = {
        user_id: userId,
        name: member.name,
        phone: member.phone,
        role: member.role,
        avatar_url: member.avatarUrl,
        is_owner: member.isOwner || false,
        relation: member.relation,
        age: member.age,
        gender: member.gender,
        condition: member.condition,
        linked_profile_id: member.linkedProfileId || null,
        invitation_status: member.invitationStatus || 'none'
    };

    const { data, error } = await supabase
        .from('family_members')
        .insert(insertData as any)
        .select()
        .single();

    if (error) throw error;
    return toFamilyMember(data as FamilyMemberDB);
};

// Add a member by search result
export const addMemberBySearch = async (
    userId: string,
    searchResult: UserSearchResult,
    assignedRole?: UserRole
): Promise<FamilyMember> => {
    const role = assignedRole || searchResult.role;
    
    const insertData: FamilyMemberInsert = {
        user_id: userId,
        name: searchResult.name,
        phone: searchResult.phone || searchResult.uid,
        role: role,
        avatar_url: searchResult.avatarUrl,
        is_owner: false,
        linked_profile_id: searchResult.id,
        invitation_status: 'accepted'
    };

    const { data, error } = await supabase
        .from('family_members')
        .insert(insertData as any)
        .select()
        .single();

    if (error) throw error;
    return toFamilyMember(data as FamilyMemberDB);
};

// Check if a user is already a member
export const isMemberExists = async (userId: string, linkedProfileId: string): Promise<boolean> => {
    const { data, error } = await supabase
        .from('family_members')
        .select('id')
        .eq('user_id', userId)
        .eq('linked_profile_id', linkedProfileId)
        .limit(1);

    if (error) throw error;
    return (data && data.length > 0);
};

// Update a family member
export const updateFamilyMember = async (memberId: string, updates: Partial<FamilyMember>): Promise<FamilyMember> => {
    const dbUpdates: Record<string, any> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
    if (updates.isOwner !== undefined) dbUpdates.is_owner = updates.isOwner;
    if (updates.relation !== undefined) dbUpdates.relation = updates.relation;
    if (updates.age !== undefined) dbUpdates.age = updates.age;
    if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
    if (updates.condition !== undefined) dbUpdates.condition = updates.condition;
    if (updates.linkedProfileId !== undefined) dbUpdates.linked_profile_id = updates.linkedProfileId;
    if (updates.invitationStatus !== undefined) dbUpdates.invitation_status = updates.invitationStatus;

    const { data, error } = await (supabase
        .from('family_members') as any)
        .update(dbUpdates)
        .eq('id', memberId)
        .select()
        .single();

    if (error) throw error;
    return toFamilyMember(data as FamilyMemberDB);
};

// Delete a family member
export const deleteFamilyMember = async (memberId: string): Promise<void> => {
    const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('id', memberId);

    if (error) throw error;
};

// Create initial owner member
export const createOwnerMember = async (userId: string, name: string, email: string): Promise<FamilyMember> => {
    const insertData: FamilyMemberInsert = {
        user_id: userId,
        name: name || 'Family Account',
        phone: email,
        role: 'CAREGIVER',
        avatar_url: 'https://picsum.photos/100',
        is_owner: true,
        relation: 'Self',
        linked_profile_id: userId,
        invitation_status: 'accepted'
    };

    const { data, error } = await supabase
        .from('family_members')
        .insert(insertData as any)
        .select()
        .single();

    if (error) throw error;
    return toFamilyMember(data as FamilyMemberDB);
};

// Create a placeholder member for invitation
export const createPlaceholderMember = async (
    userId: string,
    identifier: string,
    role: UserRole,
    name?: string
): Promise<FamilyMember> => {
    const insertData: FamilyMemberInsert = {
        user_id: userId,
        name: name || `Invited ${role === 'PATIENT' ? 'Patient' : 'Member'}`,
        phone: identifier,
        role: role,
        avatar_url: 'https://picsum.photos/100',
        is_owner: false,
        invitation_status: 'pending'
    };

    const { data, error } = await supabase
        .from('family_members')
        .insert(insertData as any)
        .select()
        .single();

    if (error) throw error;
    return toFamilyMember(data as FamilyMemberDB);
};
