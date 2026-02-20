import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import {
  getFamilyMembers,
  addFamilyMember as addMember,
  updateFamilyMember as updateMember,
  deleteFamilyMember as deleteMember,
} from '../services/familyService';
import type { FamilyMember, UserRole } from '../types';

interface UseFamilyMembersReturn {
  members: FamilyMember[];
  patients: FamilyMember[];
  caregivers: FamilyMember[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addMember: (member: Omit<FamilyMember, 'id'>) => Promise<FamilyMember>;
  updateMember: (memberId: string, updates: Partial<FamilyMember>) => Promise<FamilyMember>;
  deleteMember: (memberId: string) => Promise<void>;
}

export function useFamilyMembers(): UseFamilyMembersReturn {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMembers([]);
        return;
      }

      const familyMembers = await getFamilyMembers(user.id);
      setMembers(familyMembers);
    } catch (err: unknown) {
      setError(err.message || 'Failed to load family members');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const addFamilyMember = async (member: Omit<FamilyMember, 'id'>): Promise<FamilyMember> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const newMember = await addMember(user.id, member);
    setMembers(prev => [...prev, newMember]);
    return newMember;
  };

  const updateFamilyMember = async (
    memberId: string,
    updates: Partial<FamilyMember>
  ): Promise<FamilyMember> => {
    const updatedMember = await updateMember(memberId, updates);
    setMembers(prev => prev.map(m => (m.id === memberId ? updatedMember : m)));
    return updatedMember;
  };

  const deleteFamilyMember = async (memberId: string): Promise<void> => {
    await deleteMember(memberId);
    setMembers(prev => prev.filter(m => m.id !== memberId));
  };

  const patients = members.filter(m => m.role === 'PATIENT');
  const caregivers = members.filter(
    m => m.role === 'CAREGIVER' || m.role === 'FAMILY_MEMBER'
  );

  return {
    members,
    patients,
    caregivers,
    isLoading,
    error,
    refresh: loadMembers,
    addMember: addFamilyMember,
    updateMember: updateFamilyMember,
    deleteMember: deleteFamilyMember,
  };
}
