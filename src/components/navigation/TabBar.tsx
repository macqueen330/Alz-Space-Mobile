import React, { useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Modal, Pressable, Animated } from 'react-native';
import {
  Home,
  LayoutGrid,
  Users,
  User,
  MessageSquare,
  Plus,
  X,
  Calendar,
  Layers,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';
import type { UserRole } from '../../types';

interface TabBarProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
  onFabSelect: (action: 'task' | 'asset') => void;
  role: UserRole;
}

export function TabBar({ activeTab, onTabPress, onFabSelect, role }: TabBarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const taskAnim = useRef(new Animated.Value(0)).current;
  const assetAnim = useRef(new Animated.Value(0)).current;

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const handleFabAction = (action: 'task' | 'asset') => {
    setIsMenuOpen(false);
    onFabSelect(action);
  };

  useEffect(() => {
    if (isMenuOpen) {
      taskAnim.setValue(0);
      assetAnim.setValue(0);
      Animated.spring(taskAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 12,
        stiffness: 180,
      }).start();
      Animated.spring(assetAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 12,
        stiffness: 180,
        delay: 50,
      }).start();
    } else {
      taskAnim.setValue(0);
      assetAnim.setValue(0);
    }
  }, [assetAnim, isMenuOpen, taskAnim]);

  const renderTab = (key: string, label: string, Icon: any) => {
    const isActive = activeTab === key;
    return (
      <TouchableOpacity key={key} style={styles.tab} onPress={() => onTabPress(key)}>
        <Icon size={24} color={isActive ? Colors.primary : Colors.gray400} />
        <Text style={[styles.label, isActive && styles.labelActive]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Modal visible={isMenuOpen} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setIsMenuOpen(false)}>
          <View style={styles.overlayContent}>
            <Animated.View
              style={[
                styles.overlayButton,
                {
                  transform: [
                    { scale: taskAnim },
                    { translateY: taskAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
                  ],
                  opacity: taskAnim,
                },
              ]}
            >
              <TouchableOpacity onPress={() => handleFabAction('task')}>
                <View style={[styles.overlayIcon, styles.overlayIconTask]}>
                  <Calendar size={32} color={Colors.primary} />
                </View>
                <Text style={styles.overlayLabel}>Add Task</Text>
              </TouchableOpacity>
            </Animated.View>
            <Animated.View
              style={[
                styles.overlayButton,
                {
                  transform: [
                    { scale: assetAnim },
                    { translateY: assetAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
                  ],
                  opacity: assetAnim,
                },
              ]}
            >
              <TouchableOpacity onPress={() => handleFabAction('asset')}>
                <View style={[styles.overlayIcon, styles.overlayIconAsset]}>
                  <Layers size={32} color="#3B82F6" />
                </View>
                <Text style={styles.overlayLabel}>Add Asset</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Pressable>
      </Modal>

      {role === 'CAREGIVER' && (
        <View style={styles.fabWrapper}>
          <TouchableOpacity onPress={toggleMenu} style={[styles.fab, isMenuOpen && styles.fabActive]}>
            {isMenuOpen ? <X size={28} color={Colors.bgWhite} /> : <Plus size={28} color={Colors.bgWhite} />}
          </TouchableOpacity>
          <Text style={[styles.fabLabel, isMenuOpen && styles.fabLabelHidden]}>
            {isMenuOpen ? 'Close' : 'Add'}
          </Text>
        </View>
      )}

      <View style={styles.container}>
        {renderTab('home', 'Home', Home)}
        {role === 'CAREGIVER' ? renderTab('tasks', 'Manage', LayoutGrid) : renderTab('chat', 'AI Nurse', MessageSquare)}
        <View style={styles.spacer} />
        {renderTab('community', 'Community', Users)}
        {renderTab('profile', 'Me', User)}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.bgWhite,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    paddingHorizontal: 24,
    paddingVertical: 12,
    paddingBottom: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tab: {
    width: 56,
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.gray400,
  },
  labelActive: {
    color: Colors.primary,
  },
  spacer: {
    width: 56,
  },
  fabWrapper: {
    position: 'absolute',
    bottom: 25,
    left: '50%',
    marginLeft: -28,
    zIndex: 80,
    alignItems: 'center',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    shadowColor: '#FDBA74',
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  fabActive: {
    backgroundColor: Colors.gray800,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.5)',
    transform: [{ scale: 1.08 }],
  },
  fabLabel: {
    fontSize: 10,
    marginTop: 6,
    color: Colors.gray400,
  },
  fabLabelHidden: {
    opacity: 0,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'flex-end',
    paddingBottom: 120,
    alignItems: 'center',
  },
  overlayContent: {
    flexDirection: 'row',
    gap: 48,
  },
  overlayButton: {
    alignItems: 'center',
    gap: 8,
  },
  overlayIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.bgWhite,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadowColor,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  overlayIconTask: {
    shadowColor: '#FED7AA',
  },
  overlayIconAsset: {
    shadowColor: '#DBEAFE',
  },
  overlayLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.gray700,
  },
});
