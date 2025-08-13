import { Stack, useLocalSearchParams, Link, router } from 'expo-router';
import { View, Button, Paragraph, XStack, YStack, Avatar, ScrollView, Text } from 'tamagui';
import { getUserDetailsURL } from '@/constants/Apis';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';
import { removeToken } from '@/utils/tokenstore';
import { SPACING, TYPOGRAPHY, CONTAINER_STYLES } from '@/constants/Styles';
import axios from 'axios';

export default function AccountPage() {
  const { token, setToken } = useAuth();

  const [username, setUsername] = useState('');
  const [numContacts, setNumContacts] = useState('');
  
  useEffect(() => {
      fetchUserDetails();
  }, []);

  const fetchUserDetails = async () => {
      // Search query to be sent
      const requestBody = {
          user_token: token
      }

      try {
          const response = await axios.post(getUserDetailsURL, requestBody);
          console.log(response.data);
          setUsername(response.data["username"]);
          setNumContacts(response.data["num_contacts"]);
          // setLoading(false);
      } catch (error) {
          console.error('Error fetching data:', error);
      }
  };
  
  const handleLogOut = async () => {
    setToken('');
    await removeToken();
    router.replace('/');
  };


  return (
    <View style={CONTAINER_STYLES.screen}>
      <Stack.Screen options={{ title: "" }} />

      <ScrollView>
      <YStack alignItems="flex-start" gap={SPACING.md} padding={SPACING.xl}>
        
        {/* Header Stack */}
        <YStack alignSelf="center" alignItems='center' gap={SPACING.md}>
          <Avatar circular size="$10">
              <Avatar.Image
              accessibilityLabel={username}
              src="https://images.unsplash.com/photo-1548142813-c348350df52b?&w=150&h=150&dpr=2&q=80"
              />
          </Avatar>

          <Text 
            fontSize={TYPOGRAPHY.sizes.title}
            fontWeight={TYPOGRAPHY.weights.bold}
          >
            {username}
          </Text>

          <Text 
            fontSize={TYPOGRAPHY.sizes.md}
            color="$gray10"
          >
            New York
          </Text>

          <Link href='/(tabs)/contacts' asChild>
            <Button 
              size="$3"
              backgroundColor="$blue9" 
              color="white"
              marginVertical={SPACING.xs}
            >
              <Text color="white">
                {numContacts || '0'} contacts
              </Text>
            </Button>
          </Link>
          
          <Text 
            fontSize={TYPOGRAPHY.sizes.sm}
            color="$gray10"
          >
            #1234567890
          </Text>
          
        </YStack>

        {/* Personal Info Stack */}
        <YStack space={SPACING.md} width="100%" marginTop={SPACING.lg}>
          <Text 
            fontSize={TYPOGRAPHY.sizes.lg}
            fontWeight={TYPOGRAPHY.weights.bold}
            color="$gray10"
          >
            Contact info
          </Text>
          <XStack space={SPACING.sm} flexWrap="wrap">
            <Button size="$3" variant="outlined">josh@gmail.com</Button>
            <Button size="$3" variant="outlined">2222222222</Button>
          </XStack>
          
          <YStack space={SPACING.sm}>
            <Text 
              fontSize={TYPOGRAPHY.sizes.lg}
              fontWeight={TYPOGRAPHY.weights.bold}
              color="$gray10"
            >
              About
            </Text>
            <View 
              borderStyle="solid" 
              borderColor="$borderColor" 
              borderWidth={1} 
              borderRadius={SPACING.sm} 
              padding={SPACING.md}
              backgroundColor="$background"
            >
              <Text fontSize={TYPOGRAPHY.sizes.md}>
                userbio
              </Text>
            </View>
          </YStack>

          <XStack space={SPACING.md} marginTop={SPACING.lg}>
            <Button onPress={handleLogOut} backgroundColor="$red9" color="white">Log Out</Button>
            <Button variant="outlined">Preferences</Button>
          </XStack>
        </YStack>
      </YStack>
      </ScrollView>        
    </View>
  );
}
