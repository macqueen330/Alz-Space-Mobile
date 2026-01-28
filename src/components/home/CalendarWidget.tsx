import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

interface CalendarWidgetProps {
  date?: Date;
}

export function CalendarWidget({ date = new Date() }: CalendarWidgetProps) {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
  const dayNumber = date.getDate();
  const monthName = date.toLocaleDateString('en-US', { month: 'short' });

  return (
    <View style={styles.container}>
      <Calendar size={20} color={Colors.primary} />
      <View style={styles.dateInfo}>
        <Text style={styles.dayName}>{dayName}</Text>
        <Text style={styles.dayNumber}>{dayNumber}</Text>
        <Text style={styles.monthName}>{monthName}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgWhite,
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
  },
  dateInfo: {
    marginLeft: Layout.spacing.md,
  },
  dayName: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
  },
  dayNumber: {
    fontSize: Layout.fontSize.xxl,
    fontWeight: 'bold',
    color: Colors.textMain,
  },
  monthName: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
  },
});
