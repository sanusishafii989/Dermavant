import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { DermavantColors } from '../../constants/Colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: DermavantColors.dark,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: DermavantColors.glassBorder,
        },
        headerTitleStyle: {
          color: DermavantColors.white,
          fontWeight: '700',
          fontSize: 16,
        },
        tabBarStyle: {
          backgroundColor: DermavantColors.dark,
          borderTopWidth: 1,
          borderTopColor: DermavantColors.glassBorder,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: DermavantColors.cyan,
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.4)',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: 'Dermavant Portal',
          tabBarIcon: ({ color, focused }) => (
            <Text style={[styles.tabIconText, { color }]}>{focused ? '🏠' : '🏚️'}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="consultations"
        options={{
          title: 'Consults',
          headerTitle: 'Telemedicine Consultations',
          tabBarIcon: ({ color }) => <Text style={[styles.tabIconText, { color }]}>🩺</Text>,
        }}
      />
      <Tabs.Screen
        name="ai-suite"
        options={{
          title: 'AI Suite',
          headerTitle: 'Clinical AI Assistant',
          tabBarIcon: ({ color }) => <Text style={[styles.tabIconText, { color }]}>🤖</Text>,
        }}
      />
      <Tabs.Screen
        name="pharmacy"
        options={{
          title: 'Pharmacy',
          headerTitle: 'Global E-Pharmacy',
          tabBarIcon: ({ color }) => <Text style={[styles.tabIconText, { color }]}>💊</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerTitle: 'Medical Profile & Wallet',
          tabBarIcon: ({ color }) => <Text style={[styles.tabIconText, { color }]}>👤</Text>,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconText: {
    fontSize: 20,
  },
});
