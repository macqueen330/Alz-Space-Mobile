import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';
import type { FamilyMember } from '../../types';

interface PatientCardProps {
  patient: FamilyMember;
  onPress?: () => void;
}

export function PatientCard({ patient, onPress }: PatientCardProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image source={{ uri: patient.avatarUrl }} style={styles.avatar} />
      <Text style={styles.name}>{patient.name}</Text>
      <Text style={styles.relation}>{patient.relation}</Text>
      {patient.condition && (
        <Text style={styles.condition}>{patient.condition}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.bgWhite,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md,
    alignItems: 'center',
    width: 120,
    marginRight: Layout.spacing.sm,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: Layout.spacing.sm,
  },
  name: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.textMain,
    textAlign: 'center',
  },
  relation: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  condition: {
    fontSize: Layout.fontSize.xs,
    color: Colors.primary,
    marginTop: Layout.spacing.xs,
  },
});
