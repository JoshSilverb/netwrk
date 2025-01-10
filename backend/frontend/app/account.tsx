import { View } from '@/components/Themed';
import { Stack, useLocalSearchParams, Link, router } from 'expo-router';
import { Button, Paragraph, XStack, YStack, Avatar, ScrollView, Text } from 'tamagui';
import { getUserDetailsURL } from '@/constants/Apis';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';
import { removeToken } from '@/utils/tokenstore';
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
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ title: "" }} />

      <ScrollView>
      <YStack alignItems="flex-start" gap="$2" padding="$5">
        
        {/* Header Stack */}
        <YStack alignSelf="center" alignItems='center' gap="$2">
          <Avatar circular size="$10">
              <Avatar.Image
              accessibilityLabel="Josh Silverberg"
              src="https://images.unsplash.com/photo-1548142813-c348350df52b?&w=150&h=150&dpr=2&q=80"
              />
          </Avatar>

          <Paragraph className="font-bold" size="$8">
            {username}
          </Paragraph>

          <Paragraph color="gray">New York</Paragraph>

          <Link href='/(tabs)/contacts' asChild>
            <Button size="$2">
              <Text>{numContacts} contacts</Text></Button></Link>
          <Paragraph color="gray">#1234567890</Paragraph>
          
        </YStack>

        {/* Personal Info Stack */}
        <Paragraph className="font-bold" size="$6" color="gray">
          Contact info
        </Paragraph>
        <XStack space="$1">
          <Button size="$2">josh@gmail.com</Button>
          <Button size="$2">2222222222</Button>
        </XStack>
        <YStack space="$1">
        <Paragraph className="font-bold" size="$6" color="gray">
          About
        </Paragraph>
        <Paragraph borderStyle="solid" borderColor="lightgray" borderWidth={1} borderRadius={4} padding={10}>
          userbio
        </Paragraph>
        </YStack>

        <XStack>
          <Button onPress={handleLogOut}>Log Out</Button>
          <Button>Preferences</Button>
        </XStack>
      </YStack>
      </ScrollView>        
    </View>
  );
}
