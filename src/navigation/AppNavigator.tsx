import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';

import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { CreateTaskScreen } from '../screens/tasks/CreateTaskScreen';
import { ChatScreen } from '../screens/chat/ChatScreen';
import { PatientAISettingsScreen } from '../screens/settings/PatientAISettingsScreen';
import { TaskListScreen } from '../screens/tasks/TaskListScreen';
import { StatisticsScreen } from '../screens/statistics/StatisticsScreen';
import { AssetsScreen } from '../screens/assets/AssetsScreen';
import { Colors } from '../constants/colors';
import type { RootStackParamList } from '../types';

const Stack = createStackNavigator<RootStackParamList>();

interface AppNavigatorProps {
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function AppNavigator({ isAuthenticated, isLoading }: AppNavigatorProps) {
  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: Colors.bgWhite },
      }}
    >
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen 
            name="CreateTask" 
            component={CreateTaskScreen}
            options={{
              headerShown: true,
              headerTitle: 'Create Task',
              headerBackTitle: 'Back',
              headerTintColor: Colors.primary,
            }}
          />
          <Stack.Screen 
            name="Chat" 
            component={ChatScreen}
            options={{
              headerShown: true,
              headerTitle: 'AI Assistant',
              headerBackTitle: 'Back',
              headerTintColor: Colors.primary,
            }}
          />
          <Stack.Screen 
            name="PatientAISettings" 
            component={PatientAISettingsScreen}
            options={{
              headerShown: true,
              headerTitle: 'AI Settings',
              headerBackTitle: 'Back',
              headerTintColor: Colors.primary,
            }}
          />
          <Stack.Screen 
            name="TaskList" 
            component={TaskListScreen}
            options={{
              headerShown: true,
              headerTitle: 'All Tasks',
              headerBackTitle: 'Back',
              headerTintColor: Colors.primary,
            }}
          />
          <Stack.Screen 
            name="Statistics" 
            component={StatisticsScreen}
            options={{
              headerShown: true,
              headerTitle: 'Statistics',
              headerBackTitle: 'Back',
              headerTintColor: Colors.primary,
            }}
          />
          <Stack.Screen 
            name="Assets" 
            component={AssetsScreen}
            options={{
              headerShown: true,
              headerTitle: 'Assets Library',
              headerBackTitle: 'Back',
              headerTintColor: Colors.primary,
            }}
          />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bgWhite,
  },
});
