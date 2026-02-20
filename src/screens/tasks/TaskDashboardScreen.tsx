import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Layers, CheckSquare, BarChart2, MessageSquare, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { supabase } from '../../services/supabaseClient';
import { getTasks } from '../../services/taskService';
import { getAssets } from '../../services/assetService';
import { Colors } from '../../constants/colors';
import type { RootStackParamList, Task, Asset } from '../../types';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export function TaskDashboardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assetCount, setAssetCount] = useState(0);

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const userTasks = await getTasks(user.id);
      setTasks(userTasks);
      const assets = await getAssets(user.id);
      const total = Object.values(assets).reduce((sum: number, list: Asset[]) => sum + list.length, 0);
      setAssetCount(total);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Background decorations (standardized) */}
      <View style={styles.gradientTop} />
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Management</Text>

        <View style={styles.grid}>
          <TouchableOpacity style={[styles.cardShadow, styles.cardShadowOrange]} onPress={() => navigation.navigate('Assets')}>
            <LinearGradient
              colors={['#FF8C42', '#FF6B00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={[styles.card, styles.cardGradient]}
            >
              <View style={styles.cardGlow} />
              <View style={styles.cardIconWrap}>
                <Layers size={20} color={Colors.bgWhite} />
              </View>
              <View>
                <Text style={styles.cardCaption}>Asset Library</Text>
                <Text style={styles.cardNumber}>{assetCount}</Text>
                <View style={styles.cardPill}>
                  <Text style={styles.cardPillText}>Open</Text>
                  <ChevronRight size={14} color={Colors.bgWhite} />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.cardShadow, styles.cardShadowBlue]} onPress={() => navigation.navigate('TaskList')}>
            <LinearGradient
              colors={['#38BDF8', '#0EA5E9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={[styles.card, styles.cardGradient]}
            >
              <View style={styles.cardGlow} />
              <View style={styles.cardIconWrap}>
                <CheckSquare size={20} color={Colors.bgWhite} />
              </View>
              <View>
                <Text style={styles.cardCaption}>Tasks</Text>
                <Text style={styles.cardNumber}>{tasks.length}</Text>
                <View style={styles.cardPill}>
                  <Text style={styles.cardPillText}>Manage</Text>
                  <ChevronRight size={14} color={Colors.bgWhite} />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.cardShadow, styles.cardShadowPurple, styles.tallCard]} onPress={() => navigation.navigate('Statistics')}>
            <LinearGradient
              colors={['#A78BFA', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={[styles.card, styles.cardGradient, styles.tallCardInner]}
            >
              <View style={styles.cardGlowLarge} />
              <View style={styles.cardIconWrap}>
                <BarChart2 size={20} color={Colors.bgWhite} />
              </View>
              <View>
                <Text style={styles.cardHeadline}>Analytics</Text>
                <Text style={styles.cardDesc}>
                  Analyze patient performance and habit patterns.
                </Text>
                <View style={styles.circleButton}>
                  <ChevronRight size={18} color={Colors.bgWhite} />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.cardShadow, styles.cardShadowGreen, styles.tallCard]} onPress={() => navigation.navigate('PatientAISettings')}>
            <LinearGradient
              colors={['#4ADE80', '#22C55E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={[styles.card, styles.cardGradient, styles.tallCardInner]}
            >
              <View style={styles.cardGlowLargeTop} />
              <View style={styles.cardIconWrap}>
                <MessageSquare size={20} color={Colors.bgWhite} />
              </View>
              <View>
                <Text style={styles.cardHeadline}>Patient AI</Text>
                <Text style={styles.cardDesc}>
                  Configure patient's AI persona, voice, and FAQs.
                </Text>
                <View style={styles.circleButton}>
                  <ChevronRight size={18} color={Colors.bgWhite} />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgWhite,
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },

  // ============ Background Decorations (Standardized) ============
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 128,
    backgroundColor: Colors.secondary,
    opacity: 0.15,
  },
  blobTopRight: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 288,
    height: 288,
    borderRadius: 144,
    backgroundColor: Colors.secondary,
    opacity: 0.15,
  },
  blobBottomLeft: {
    position: 'absolute',
    bottom: -50,
    left: -50,
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: Colors.primary,
    opacity: 0.1,
  },

  title: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.gray800,
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  cardShadow: {
    width: '48%',
    borderRadius: 40,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  cardShadowOrange: {
    shadowColor: '#FED7AA',
  },
  cardShadowBlue: {
    shadowColor: '#BFDBFE',
  },
  cardShadowPurple: {
    shadowColor: '#DDD6FE',
  },
  cardShadowGreen: {
    shadowColor: '#BBF7D0',
  },
  card: {
    borderRadius: 36,
    padding: 16,
    minHeight: 180,
    justifyContent: 'space-between',
  },
  cardGradient: {
    overflow: 'hidden',
  },
  cardGlow: {
    position: 'absolute',
    top: -16,
    right: -16,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  cardGlowLarge: {
    position: 'absolute',
    bottom: -40,
    right: -40,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  cardGlowLargeTop: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCaption: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  cardNumber: {
    fontSize: 44,
    fontWeight: '800',
    color: Colors.bgWhite,
    marginBottom: 12,
  },
  cardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  cardPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.bgWhite,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tallCard: {
    width: '48%',
  },
  tallCardInner: {
    minHeight: 220,
  },
  cardHeadline: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.bgWhite,
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 16,
  },
  circleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});
