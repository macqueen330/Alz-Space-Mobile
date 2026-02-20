import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { HomeScreen } from '../screens/home/HomeScreen';
import { TaskDashboardScreen } from '../screens/tasks/TaskDashboardScreen';
import { CommunityScreen } from '../screens/community/CommunityScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { ChatScreen } from '../screens/chat/ChatScreen';
import { Colors } from '../constants/colors';
import { TabBar } from '../components/navigation/TabBar';
import type { UserRole, MainTabParamList } from '../types';

const Tab = createBottomTabNavigator<MainTabParamList & { Chat: undefined }>();

interface MainTabNavigatorProps {
  userRole: UserRole;
}

export function MainTabNavigator({ userRole }: MainTabNavigatorProps) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray400,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
      tabBar={({ state, navigation }) => {
        const activeRoute = state.routes[state.index]?.name;
        const activeTab = activeRoute ? activeRoute.toLowerCase() : 'home';
        return (
          <TabBar
            activeTab={activeTab}
            role={userRole}
            onTabPress={(tab) =>
              navigation.navigate(
                tab === 'tasks'
                  ? 'Tasks'
                  : tab === 'community'
                  ? 'Community'
                  : tab === 'profile'
                  ? 'Profile'
                  : tab === 'chat'
                  ? 'Chat'
                  : 'Home'
              )
            }
            onFabSelect={(action) => {
              const parent = navigation.getParent();
              if (action === 'task') {
                parent?.navigate('CreateTask');
              } else {
                parent?.navigate('Assets');
              }
            }}
          />
        );
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen
        name="Tasks"
        component={TaskDashboardScreen}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityScreen}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{ tabBarButton: () => null }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.bgWhite,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    paddingTop: 8,
    paddingBottom: 8,
    height: 60,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
});
