import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import {
  Gamepad2,
  BrainCircuit,
  Headphones,
  Video,
  CheckCircle2,
  Clock,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import type { Task } from '../../types';

interface HomeTaskItemProps {
  task: Task;
  isLast: boolean;
  onPress: () => void;
}

const ICON_MAP: Record<string, LucideIcon> = {
  GAME: Gamepad2,
  QUIZ: BrainCircuit,
  AUDIO: Headphones,
  VIDEO: Video,
};

const COLOR_MAP: Record<string, string> = {
  GAME: '#A855F7',
  QUIZ: Colors.secondary,
  AUDIO: Colors.primary,
  VIDEO: '#60A5FA',
};

export function HomeTaskItem({ task, isLast, onPress }: HomeTaskItemProps) {
  const primaryAssetType = task.assets.length > 0 ? task.assets[0].type : undefined;
  const IconComponent = (primaryAssetType && ICON_MAP[primaryAssetType]) || CheckCircle2;
  const bgColor = (primaryAssetType && COLOR_MAP[primaryAssetType]) || Colors.gray400;

  return (
    <View style={styles.row}>
      {!isLast && <View style={styles.line} />}
      <View style={[styles.iconWrap, { backgroundColor: bgColor }]}>
        <IconComponent size={14} color={Colors.bgWhite} />
      </View>
      <TouchableOpacity style={styles.card} onPress={onPress}>
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, task.isCompleted && styles.titleCompleted]}>
              {task.title}
            </Text>
            {task.automationEnabled && <Text style={styles.autoBadge}>Auto</Text>}
          </View>
          <View style={styles.meta}>
            <Clock size={12} color={Colors.gray500} />
            <Text style={styles.metaText}>{task.startTime || 'Anytime'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    position: 'relative',
    paddingLeft: 36,
    paddingBottom: 12,
  },
  line: {
    position: 'absolute',
    left: 15,
    top: 24,
    bottom: 0,
    width: 2,
    backgroundColor: Colors.gray100,
  },
  iconWrap: {
    position: 'absolute',
    left: 0,
    top: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: Colors.bgSoft,
  },
  card: {
    backgroundColor: Colors.bgWhite,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.gray100,
    shadowColor: Colors.shadowColor,
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  info: {
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.gray800,
  },
  titleCompleted: {
    color: Colors.gray400,
    textDecorationLine: 'line-through',
  },
  autoBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.secondary,
    backgroundColor: '#ECFEFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    textTransform: 'uppercase',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: Colors.gray500,
    fontWeight: '500',
  },
});
