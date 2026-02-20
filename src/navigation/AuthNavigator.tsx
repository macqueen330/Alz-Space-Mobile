import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { AuthScreen } from '../screens/auth/AuthScreen';
import { Colors } from '../constants/colors';
import type { UserRole } from '../types';

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();

interface AuthNavigatorProps {
  onRoleSelected: (role: UserRole) => void;
}

export function AuthNavigator({ onRoleSelected }: AuthNavigatorProps) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: Colors.bgWhite },
      }}
    >
      <Stack.Screen name="Login">
        {() => <AuthScreen onRoleSelected={onRoleSelected} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
