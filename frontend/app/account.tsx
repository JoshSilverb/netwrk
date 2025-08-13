import { Stack, Link, router } from 'expo-router';
import { View, Button, XStack, YStack, Avatar, ScrollView, Text, Sheet, Label, Switch, Separator, Input } from 'tamagui';
import { Pressable, Alert } from 'react-native';
import { Plus as PlusIcon, X as XIcon, Camera as CameraIcon } from '@tamagui/lucide-icons';
import * as ImagePicker from 'expo-image-picker';
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
  const [settingsSheetActive, setSettingsSheetActive] = useState(false);
  const [editProfileSheetActive, setEditProfileSheetActive] = useState(false);

  const [isLightMode, setIsLightMode] = useState(true);

  // Edit profile form state
  const [editSocials, setEditSocials] = useState([]);
  const [editBio, setEditBio] = useState('');
  const [newSocial, setNewSocial] = useState({ label: '', address: ''});
  const [openNewSocial, setOpenNewSocial] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

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

  // Social media editing functions
  const addSocial = () => {
    if (newSocial.label && newSocial.address) {
      setEditSocials([...editSocials, newSocial]);
      setNewSocial({ label: '', address: '' });
      setOpenNewSocial(false);
    }
  };
  
  const editSocial = (index, key, value) => {
    const updatedSocials = [...editSocials];
    updatedSocials[index][key] = value;
    setEditSocials(updatedSocials);
  };

  const removeSocial = (index) => {
    setEditSocials(editSocials.filter((_, i) => i !== index));
  };

  const handleEditProfile = () => {
    // Initialize edit state with current data
    setEditSocials([...socials]);
    setEditBio(userbio);
    setEditProfileSheetActive(true);
  };

  const handleSaveProfile = async () => {
    // Here you would typically make an API call to save the profile
    // For now, we'll just close the modal
    console.log('Saving profile:', { socials: editSocials, bio: editBio });
    setEditProfileSheetActive(false);
  };

  const handleSaveSettings = async () => {

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
            <Button onPress={() => {setSettingsSheetActive(true)}} variant="outlined">Settings</Button>
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

          
      {/* Settings Modal */}
      {settingsSheetActive && (
      <Sheet modal open={settingsSheetActive} onOpenChange={setSettingsSheetActive} dismissOnOverlayPress>
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
                      Style
                  </Text>
                  <XStack>
                    <Label
                      color="$gray10"
                      textAlign="center"
                      lineHeight={20}
                      paddingRight="$0"
                      minWidth={90}
                      justifyContent="flex-end"
                      size={TYPOGRAPHY.sizes.md}
                      htmlFor="lightModeToggle"
                    >
                      {isLightMode ? "Light mode" : "Dark mode"}
                    </Label>
                    <Separator minHeight={20} vertical />
                    <Switch id="lightModeToggle" size="$2" defaultChecked={false}>
                      <Switch.Thumb animation="quicker" />
                    </Switch>

                  </XStack>
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
                  onPress={() => setSettingsSheetActive(false)}
                  borderRadius={BORDER_RADIUS.md}
                  flex={1}
              >
                  Cancel
              </Button>
              <Button
                  size="$3"
                  onPress={() => {
                      setSettingsSheetActive(false);
                      handleSaveSettings();
                  }}
                  backgroundColor="$blue9"
                  color="white"
                  borderRadius={BORDER_RADIUS.md}
                  flex={1}
              >
                  Save
              </Button>
          </XStack>
          </Sheet.Frame>
      </Sheet>
      )}

      {/* Edit Profile Modal */}
      {editProfileSheetActive && (
      <Sheet modal open={editProfileSheetActive} onOpenChange={setEditProfileSheetActive} dismissOnOverlayPress>
          <Sheet.Frame 
              backgroundColor="$background"
              borderTopLeftRadius={BORDER_RADIUS.lg}
              borderTopRightRadius={BORDER_RADIUS.lg}
          >
          <Sheet.Handle backgroundColor="$gray8" />
          <ScrollView>
            <YStack 
                space={SPACING.lg} 
                padding={SPACING.lg}
            >
                {/* Contact Information Section */}
                <YStack 
                    space={SPACING.md}
                    padding={SPACING.md}
                    borderWidth={1}
                    borderColor="$borderColor"
                    borderRadius={BORDER_RADIUS.md}
                    backgroundColor="$gray1"
                >
                    <Text 
                        fontSize={TYPOGRAPHY.sizes.md}
                        fontWeight={TYPOGRAPHY.weights.medium}
                        color="$gray11"
                        marginBottom={SPACING.xs}
                    >
                        Contact Information
                    </Text>

                    {/* Existing Socials */}
                    {editSocials.map((social, index) => (
                        <XStack 
                            key={index} 
                            space={SPACING.xs}
                            padding={SPACING.sm}
                            borderWidth={1}
                            borderColor="$borderColor"
                            borderRadius={BORDER_RADIUS.sm}
                            backgroundColor="$background"
                            alignItems="center"
                        >
                            <YStack flex={1} space={SPACING.xs}>
                                <Input
                                    value={social.label}
                                    onChangeText={(text) => editSocial(index, 'label', text)}
                                    placeholder="Platform"
                                    size="$3"
                                    fontSize={TYPOGRAPHY.sizes.sm}
                                    height={38}
                                />
                                <Input
                                    value={social.address}
                                    onChangeText={(text) => editSocial(index, 'address', text)}
                                    placeholder="Contact info"
                                    size="$3"
                                    fontSize={TYPOGRAPHY.sizes.sm}
                                    height={38}
                                />
                            </YStack>
                            <Button
                                size="$2"
                                variant="ghost"
                                onPress={() => removeSocial(index)}
                                padding={SPACING.xs}
                                minWidth={32}
                                minHeight={32}
                            >
                                <XIcon size={16} color="$red10" />
                            </Button>
                        </XStack>
                    ))}

                    {/* Add New Social */}
                    {openNewSocial && 
                        <YStack 
                            space={SPACING.xs}
                            padding={SPACING.sm}
                            borderWidth={1}
                            borderColor="$blue6"
                            borderRadius={BORDER_RADIUS.sm}
                            backgroundColor="$blue1"
                        >
                            <XStack space={SPACING.xs} alignItems="flex-end">
                                <YStack flex={1} space={SPACING.xs}>
                                    <Input
                                        placeholder="Platform"
                                        value={newSocial.label}
                                        onChangeText={(text) => setNewSocial({ ...newSocial, label: text })}
                                        size="$3"
                                        fontSize={TYPOGRAPHY.sizes.sm}
                                        height={38}
                                    />
                                    <Input
                                        placeholder="Contact info"
                                        value={newSocial.address}
                                        onChangeText={(text) => setNewSocial({ ...newSocial, address: text })}
                                        size="$3"
                                        fontSize={TYPOGRAPHY.sizes.sm}
                                        height={38}
                                    />
                                </YStack>
                                
                                <XStack space={SPACING.xs}>
                                    <Button
                                        size="$2"
                                        variant="outlined"
                                        onPress={() => setOpenNewSocial(false)}
                                        minWidth={60}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        size="$2"
                                        onPress={addSocial}
                                        backgroundColor="$green9"
                                        color="white"
                                        minWidth={50}
                                    >
                                        <PlusIcon size={14} />
                                    </Button>
                                </XStack>
                            </XStack>
                        </YStack>
                    }
                    
                    {!openNewSocial && (
                        <XStack justifyContent="center">
                            <Button 
                                onPress={() => setOpenNewSocial(true)} 
                                variant="outlined"
                                size="$3"
                            >
                                + Add Contact Method
                            </Button>
                        </XStack>
                    )}
                </YStack>

                {/* Bio Section */}
                <YStack 
                    space={SPACING.sm}
                    padding={SPACING.md}
                    borderWidth={1}
                    borderColor="$borderColor"
                    borderRadius={BORDER_RADIUS.md}
                    backgroundColor="$gray1"
                >
                    <Text 
                        fontSize={TYPOGRAPHY.sizes.md}
                        fontWeight={TYPOGRAPHY.weights.medium}
                        color="$gray11"
                        marginBottom={SPACING.xs}
                    >
                        About
                    </Text>
                    <Input
                        value={editBio}
                        onChangeText={setEditBio}
                        placeholder="Add your bio"
                        multiline
                        numberOfLines={4}
                        size="$4"
                        textAlignVertical="top"
                    />
                </YStack>
            </YStack>
          </ScrollView>
          
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
                  onPress={() => setEditProfileSheetActive(false)}
                  borderRadius={BORDER_RADIUS.md}
                  flex={1}
              >
                  Cancel
              </Button>
              <Button
                  size="$3"
                  onPress={handleSaveProfile}
                  backgroundColor="$blue9"
                  color="white"
                  borderRadius={BORDER_RADIUS.md}
                  flex={1}
              >
                  Save Changes
              </Button>
          </XStack>
          </Sheet.Frame>
      </Sheet>
      )}
 
    </View>
  );
}
