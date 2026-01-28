import { supabase } from './supabaseClient';
import type { FamilyInvitation, UserRole } from '../types';
import type { FamilyInvitationDB } from '../types/database.types';

// Convert database row to frontend type
const toInvitation = (row: FamilyInvitationDB, inviterName?: string): FamilyInvitation => ({
    id: row.id,
    inviterId: row.inviter_id,
    inviterName: inviterName,
    inviteeIdentifier: row.invitee_identifier,
    invitedRole: row.invited_role as UserRole,
    status: row.status,
    familyMemberId: row.family_member_id || undefined,
    createdAt: new Date(row.created_at),
    expiresAt: new Date(row.expires_at)
});

// Send an invitation
export const sendInvitation = async (
    inviterId: string,
    identifier: string,
    role: UserRole,
    familyMemberId?: string
): Promise<FamilyInvitation> => {
    const { data, error } = await supabase
        .from('family_invitations')
        .insert({
            inviter_id: inviterId,
            invitee_identifier: identifier.trim(),
            invited_role: role,
            family_member_id: familyMemberId || null
        })
        .select()
        .single();

    if (error) throw error;
    return toInvitation(data);
};

// Get sent invitations
export const getSentInvitations = async (userId: string): Promise<FamilyInvitation[]> => {
    const { data, error } = await supabase
        .from('family_invitations')
        .select('*')
        .eq('inviter_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(row => toInvitation(row));
};

// Get received invitations
export const getReceivedInvitations = async (userId: string): Promise<FamilyInvitation[]> => {
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('uid, phone')
        .eq('id', userId)
        .single();

    if (profileError) throw profileError;
    if (!profile) return [];

    const identifiers = [profile.uid, profile.phone].filter(Boolean);
    if (identifiers.length === 0) return [];

    const { data, error } = await supabase
        .from('family_invitations')
        .select(`
            *,
            profiles!family_invitations_inviter_id_fkey(name)
        `)
        .in('invitee_identifier', identifiers)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(row => {
        const inviterName = (row.profiles as any)?.name;
        return toInvitation(row, inviterName);
    });
};

// Accept invitation
export const acceptInvitation = async (invitationId: string, userId: string): Promise<void> => {
    const { data: invitation, error: fetchError } = await supabase
        .from('family_invitations')
        .select('*')
        .eq('id', invitationId)
        .single();

    if (fetchError) throw fetchError;
    if (!invitation) throw new Error('Invitation not found');

    const { error: updateError } = await supabase
        .from('family_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitationId);

    if (updateError) throw updateError;

    if (invitation.family_member_id) {
        const { error: memberError } = await supabase
            .from('family_members')
            .update({
                linked_profile_id: userId,
                invitation_status: 'accepted'
            })
            .eq('id', invitation.family_member_id);

        if (memberError) throw memberError;
    }
};

// Decline invitation
export const declineInvitation = async (invitationId: string): Promise<void> => {
    const { data: invitation, error: fetchError } = await supabase
        .from('family_invitations')
        .select('family_member_id')
        .eq('id', invitationId)
        .single();

    if (fetchError) throw fetchError;

    const { error: updateError } = await supabase
        .from('family_invitations')
        .update({ status: 'declined' })
        .eq('id', invitationId);

    if (updateError) throw updateError;

    if (invitation?.family_member_id) {
        const { error: memberError } = await supabase
            .from('family_members')
            .update({ invitation_status: 'declined' })
            .eq('id', invitation.family_member_id);

        if (memberError) throw memberError;
    }
};

// Cancel invitation
export const cancelInvitation = async (invitationId: string): Promise<void> => {
    const { error } = await supabase
        .from('family_invitations')
        .delete()
        .eq('id', invitationId);

    if (error) throw error;
};

// Check existing invitation
export const checkExistingInvitation = async (
    inviterId: string,
    identifier: string
): Promise<FamilyInvitation | null> => {
    const { data, error } = await supabase
        .from('family_invitations')
        .select('*')
        .eq('inviter_id', inviterId)
        .eq('invitee_identifier', identifier.trim())
        .eq('status', 'pending')
        .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;

    return toInvitation(data);
};
