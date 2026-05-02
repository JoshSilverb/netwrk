import React from 'react';
import { Link, Tabs } from 'expo-router';
import { Pressable } from 'react-native';
import { Users, MapPin, Plus, User } from '@tamagui/lucide-icons';

import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

function HeaderAccountButton() {
  return (
    <Link href="/account" asChild>
      <Pressable style={{ marginRight: 20 }}>
        {({ pressed }) => (
          <User size={28} color={pressed ? '#64748B' : '#475569'} />
        )}
      </Pressable>
    </Link>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#14B8A6',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#0F172A',
          borderTopColor: '#1E293B',
          borderTopWidth: 1,
        },
        headerShown: useClientOnlyValue(false, true),
      }}
    >
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add Contact',
          tabBarIcon: ({ color }) => <Plus size={24} color={color} />,
          headerRight: () => <HeaderAccountButton />,
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: 'Contacts',
          tabBarIcon: ({ color }) => <Users size={24} color={color} />,
          headerRight: () => <HeaderAccountButton />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => <MapPin size={24} color={color} />,
          headerRight: () => <HeaderAccountButton />,
        }}
      />
    </Tabs>
  );
}
