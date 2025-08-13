import { Stack, Link, router } from 'expo-router';
import { View, Button, XStack, YStack, Avatar, ScrollView, Text, Sheet } from 'tamagui';
import { getUserDetailsURL } from '@/constants/Apis';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';
import { removeToken } from '@/utils/tokenstore';
import { SPACING, TYPOGRAPHY, CONTAINER_STYLES, BORDER_RADIUS } from '@/constants/Styles';
import axios from 'axios';

export default function AccountPage() {
  const { token, setToken } = useAuth();

  const [username, setUsername] = useState('');
  const [numContacts, setNumContacts] = useState('');

  const [logoutSheetActive, setLogoutSheetActive] = useState(false);

  const userId = "#1234567890";
  const socials = [
      {
          label: "Email Address",
          address: "josh@gmail.com"
      },
      {
        label: "Phone Number",
        address: "2222222222"
      }
  ];
  const userbio = "Software engineer at Bloomberg.";
  
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

  const handleEditProfile = async () => {

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
            {userId}
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

          {socials && socials.length > 0 ? (
            socials.map((social, index) => (
              <XStack 
                key={`social-${index}`}
                space={SPACING.xs}
                padding={SPACING.sm}
                borderWidth={1}
                borderColor="$borderColor"
                borderRadius={BORDER_RADIUS.sm}
                backgroundColor="$background"
                alignItems="center"
              >
                <Text 
                  fontSize={TYPOGRAPHY.sizes.sm}
                  fontWeight={TYPOGRAPHY.weights.medium}
                  color="$gray10"
                  minWidth={80}
                >
                  {social.label}:
                </Text>
                <Text 
                  fontSize={TYPOGRAPHY.sizes.sm}
                  flex={1}
                >
                  {social.address}
                </Text>
              </XStack>
            ))
          ) : (
            <Text 
              fontSize={TYPOGRAPHY.sizes.sm}
              color="$gray9"
              fontStyle="italic"
            >
              No social media added
            </Text>
          )}
          
          <YStack space={SPACING.sm}>
            <Text 
              fontSize={TYPOGRAPHY.sizes.lg}
              fontWeight={TYPOGRAPHY.weights.bold}
              color="$gray10"
            >
              About
            </Text>
            <View 
              padding={SPACING.md}
              borderWidth={1}
              borderColor="$borderColor"
              borderRadius={BORDER_RADIUS.sm}
              backgroundColor="$background"
            >
              <Text fontSize={TYPOGRAPHY.sizes.sm}>
                {userbio || "No notes added"}
              </Text>
            </View>
          </YStack>

          <XStack space={SPACING.md} marginTop={SPACING.lg}>
            <Button onPress={() => {setLogoutSheetActive(true)}} backgroundColor="$red9" color="white">Log Out</Button>
            <Button onPress={handleEditProfile} variant="outlined">Edit Profile</Button>
            <Button variant="outlined">Settings</Button>
          </XStack>
        </YStack>
      </YStack>
      </ScrollView>       
      {/* Logout Confirmation Modal */}
      {logoutSheetActive && (
      <Sheet modal open={logoutSheetActive} onOpenChange={setLogoutSheetActive} dismissOnOverlayPress>
          <Sheet.Frame 
              backgroundColor="$background"
              borderTopLeftRadius={BORDER_RADIUS.lg}
              borderTopRightRadius={BORDER_RADIUS.lg}
          >
          <Sheet.Handle backgroundColor="$gray8" />
          <YStack 
              space={SPACING.lg} 
              padding={SPACING.lg}
          >
              {/* Content Section */}
              <YStack 
                  space={SPACING.md}
                  padding={SPACING.md}
                  borderWidth={1}
                  borderColor="$borderColor"
                  borderRadius={BORDER_RADIUS.md}
                  backgroundColor="$gray1"
                  alignItems="center"
              >
                  <Text 
                      fontSize={TYPOGRAPHY.sizes.lg}
                      fontWeight={TYPOGRAPHY.weights.bold}
                      color="$gray11"
                      textAlign="center"
                  >
                      Log Out
                  </Text>
                  <Text 
                      fontSize={TYPOGRAPHY.sizes.md}
                      color="$gray10"
                      textAlign="center"
                      lineHeight={20}
                  >
                      Are you sure you want to log out? You'll need to sign in again to access your contacts.
                  </Text>
              </YStack>
          </YStack>
          
          {/* Action Buttons */}
          <XStack 
              padding={SPACING.md} 
              justifyContent="flex-end" 
              space={SPACING.sm}
              borderTopWidth={1}
              borderTopColor="$borderColor"
              backgroundColor="$background"
          >
              <Button
                  size="$3"
                  variant="outlined"
                  onPress={() => setLogoutSheetActive(false)}
                  borderRadius={BORDER_RADIUS.md}
                  flex={1}
              >
                  Cancel
              </Button>
              <Button
                  size="$3"
                  onPress={() => {
                      setLogoutSheetActive(false);
                      handleLogOut();
                  }}
                  backgroundColor="$red9"
                  color="white"
                  borderRadius={BORDER_RADIUS.md}
                  flex={1}
              >
                  Log Out
              </Button>
          </XStack>
          </Sheet.Frame>
      </Sheet>
      )}
 
    </View>
  );
}
