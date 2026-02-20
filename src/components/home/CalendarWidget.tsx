import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import type { Task } from '../../types';

interface CalendarWidgetProps {
  tasks: Task[];
  onDateSelect: (date: number) => void;
}

export function CalendarWidget({ tasks, onDateSelect }: CalendarWidgetProps) {
  const [selectedDate, setSelectedDate] = useState(28);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentWeek = [27, 28, 29, 30, 1, 2, 3];

  const getStatusForDate = (date: number) => {
    if (date === 27) return 'completed';
    if (date === 28) {
      return tasks.every((t) => t.isCompleted) ? 'completed' : 'incomplete';
    }
    return 'empty';
  };

  useEffect(() => {
    onDateSelect(selectedDate);
  }, [selectedDate, onDateSelect]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Timeline</Text>
        <View style={styles.pill}>
          <Text style={styles.pillText}>April 2025</Text>
        </View>
      </View>
      <View style={styles.row}>
        {days.map((day, i) => {
          const date = currentWeek[i];
          const isSelected = date === selectedDate;
          const status = getStatusForDate(date);
          return (
            <TouchableOpacity
              key={day}
              style={[styles.cell, isSelected && styles.cellActive]}
              onPress={() => setSelectedDate(date)}
            >
              <Text style={[styles.day, isSelected && styles.dayActive]}>{day}</Text>
              <Text style={[styles.date, isSelected && styles.dateActive]}>{date}</Text>
              <View style={styles.statusWrap}>
                {status === 'completed' && (
                  <View style={[styles.statusDot, isSelected && styles.statusDotActive]} />
                )}
                {status === 'incomplete' && (
                  <View style={[styles.statusRing, isSelected && styles.statusRingActive]} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgWhite,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.gray50,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.gray800,
  },
  pill: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cell: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 16,
    minWidth: 48,
  },
  cellActive: {
    backgroundColor: Colors.primary,
    shadowColor: '#FDBA74',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  day: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.gray400,
  },
  dayActive: {
    color: Colors.bgWhite,
  },
  date: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.gray800,
  },
  dateActive: {
    color: Colors.bgWhite,
  },
  statusWrap: {
    height: 6,
    marginTop: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  statusDotActive: {
    backgroundColor: Colors.bgWhite,
  },
  statusRing: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: '#F87171',
  },
  statusRingActive: {
    borderColor: Colors.bgWhite,
  },
});
