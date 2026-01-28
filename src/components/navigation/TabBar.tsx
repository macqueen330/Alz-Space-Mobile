import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Home, ListTodo, Users, User } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

// This is a custom tab bar component if needed
// The app uses React Navigation's default bottom tabs, but this can be used for customization

interface TabBarProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
}

const tabs = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'tasks', label: 'Tasks', icon: ListTodo },
  { key: 'community', label: 'Community', icon: Users },
  { key: 'profile', label: 'Profile', icon: User },
];

export function TabBar({ activeTab, onTabPress }: TabBarProps) {
  return (
    <View style={styles.container}>
      {tabs.map(({ key, label, icon: Icon }) => {
        const isActive = activeTab === key;
        return (
          <TouchableOpacity
            key={key}
            style={styles.tab}
            onPress={() => onTabPress(key)}
          >
            <Icon
              size={24}
              color={isActive ? Colors.primary : Colors.gray400}
            />
            <Text
              style={[styles.label, isActive && styles.labelActive]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.bgWhite,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Layout.spacing.xs,
  },
  label: {
    fontSize: Layout.fontSize.xs,
    color: Colors.gray400,
    marginTop: Layout.spacing.xs,
  },
  labelActive: {
    color: Colors.primary,
    fontWeight: '500',
  },
});
