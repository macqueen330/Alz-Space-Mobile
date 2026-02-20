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
import type { RootStackParamList, UserRole } from '../types';

const Stack = createStackNavigator<RootStackParamList>();

interface AppNavigatorProps {
  isAuthenticated: boolean;
  isLoading: boolean;
  userRole: UserRole;
  onRoleSelected: (role: UserRole) => void;
}

export function AppNavigator({ isAuthenticated, isLoading, userRole, onRoleSelected }: AppNavigatorProps) {
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
          <Stack.Screen name="Main">
            {() => <MainTabNavigator userRole={userRole} />}
          </Stack.Screen>
          <Stack.Screen 
            name="CreateTask" 
            component={CreateTaskScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen 
            name="Chat" 
            component={ChatScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen 
            name="PatientAISettings" 
            component={PatientAISettingsScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen 
            name="TaskList" 
            component={TaskListScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen 
            name="Statistics" 
            component={StatisticsScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen 
            name="Assets" 
            component={AssetsScreen}
            options={{
              headerShown: false,
            }}
          />
        </>
      ) : (
        <Stack.Screen name="Auth">
          {() => <AuthNavigator onRoleSelected={onRoleSelected} />}
        </Stack.Screen>
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
