import React from 'react';
import { Link, Tabs } from 'expo-router';
import { Image, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { MapPin, Plus, User } from '@tamagui/lucide-icons';

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

function LogoCenterTab({ onPress, accessibilityState }: any) {
  const isActive = accessibilityState?.selected;
  return (
    <TouchableOpacity onPress={onPress} style={styles.centerTabWrapper} activeOpacity={0.8}>
      <View style={[styles.centerCircle, { borderColor: isActive ? '#FFFFFF' : '#475569' }]}>
        <Image
          source={require('../../assets/images/netwrk-icon-square.png')}
          style={styles.logoImage}
          resizeMode="cover"
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  centerTabWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  centerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    overflow: 'hidden',
    marginBottom: 4,
    marginTop: -24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
});

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
          tabBarButton: (props) => <LogoCenterTab {...props} />,
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
