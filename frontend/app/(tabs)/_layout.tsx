import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import { ImageSourcePropType, Pressable, View } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { Image } from 'tamagui';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

function TabBarImage(props: {icon: ImageSourcePropType, size: number}) {
  return <Image source={props.icon} width={props.size} height={props.size} marginBottom={-15} {...props} />;
}

function RoundTabBarImage(props: {icon: ImageSourcePropType, size: number}) {
  return (
    <View style={{
      width: props.size,
      height: props.size,
      borderRadius: props.size / 2,
      borderWidth: 3,
      borderColor: '#000',
      overflow: 'hidden',
      marginBottom: -10,
      backgroundColor: '#fff',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <Image
        source={props.icon}
        width={props.size}
        height={props.size}
      />
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
      }}>
      {/* <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          headerRight: () => (
            <Link href="/account" asChild>
              <Pressable>
                {({ pressed }) => (
                  <FontAwesome
                    name="user"
                    size={25}
                    color={Colors[colorScheme ?? 'light'].text}
                    style={{ marginRight: 16, opacity: pressed ? 0.5 : 1 }}
                  />
                )}

              </Pressable>
            </Link>
          ),
        }}
      /> */}
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add Contact',
          tabBarIcon: ({ color }) => <TabBarIcon name="plus" color={color} />,
          headerRight: () => (
            <Link href="/account" asChild>
              <Pressable>
                {({ pressed }) => (
                  <FontAwesome
                    name="user"
                    size={25}
                    color={Colors[colorScheme ?? 'light'].text}
                    style={{ marginRight: 16, opacity: pressed ? 0.5 : 1 }}
                  />
                )}

              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: '',
          // tabBarIcon: ({ color }) => <TabBarIcon name="users" color={color} />,
          tabBarIcon: () => <RoundTabBarImage size={70} icon={require('../../assets/images/netwrk-icon-square.png')} />,
          headerRight: () => (
            <Link href="/account" asChild>
              <Pressable>
                {({ pressed }) => (
                  <FontAwesome
                    name="user"
                    size={25}
                    color={Colors[colorScheme ?? 'light'].text}
                    style={{ marginRight: 16, opacity: pressed ? 0.5 : 1 }}
                  />
                )}

              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => <TabBarIcon name="map" color={color} />,
          headerRight: () => (
            <Link href="/account" asChild>
              <Pressable>
                {({ pressed }) => (
                  <FontAwesome
                    name="user"
                    size={25}
                    color={Colors[colorScheme ?? 'light'].text}
                    style={{ marginRight: 16, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
    </Tabs>
  );
}
