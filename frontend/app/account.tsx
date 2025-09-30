import { Stack, Link, router } from 'expo-router';
import { View, Button, XStack, YStack, Avatar, ScrollView, Text, Sheet, Label, Switch, Separator, Input } from 'tamagui';
import { Pressable, Alert } from 'react-native';
import { Plus as PlusIcon, X as XIcon, Camera as CameraIcon, User as UserIcon } from '@tamagui/lucide-icons';
import * as ImagePicker from 'expo-image-picker';
import { getUserDetailsURL, updateUserDetailsURL, getS3UploadURL } from '@/constants/Apis';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';
import { removeToken } from '@/utils/tokenstore';
import { SPACING, TYPOGRAPHY, CONTAINER_STYLES, BORDER_RADIUS } from '@/constants/Styles';

import * as FileSystem from 'expo-file-system';

import mime from 'mime';
import axios from 'axios';

export default function AccountPage() {
  const { token, setToken } = useAuth();

  const [profilePicUrl, setProfilePicUrl] = useState('');
  const [username, setUsername] = useState('');
  const [numContacts, setNumContacts] = useState('');
  const [userBio, setUserBio] = useState('');

  const [logoutSheetActive, setLogoutSheetActive] = useState(false);
  const [settingsSheetActive, setSettingsSheetActive] = useState(false);
  const [editProfileSheetActive, setEditProfileSheetActive] = useState(false);

  const [isLightMode, setIsLightMode] = useState(true);

  // Edit profile form state
  const [editBio, setEditBio] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  
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
          setProfilePicUrl(response.data["profile_pic_url"])
          setUsername(response.data["username"]);
          setNumContacts(response.data["num_contacts"]);
          setUserBio(response.data["bio"])
          // setLoading(false);
      } catch (error) {
          console.error('Error fetching data:', error);
      }
  };
  
  const uploadUserPicture = async () => {
    // Send updated profile picture

    if (!selectedImage) {
      console.log("No image selected");
      return;
    }

    const newImageUri =  "file:///" + selectedImage.uri.split("file:/").join("");
    const contentType = mime.getType(newImageUri);
    
    // Get signed s3 url for this picture from backend.

    const requestBody = {
        user_token: token,
        filetype: contentType
    }

    console.log("sending request to get s3 upload url with body: " + JSON.stringify(requestBody))

    const response = await axios.post(getS3UploadURL, requestBody);
    
    if (response.status != 200) {
      console.log(`Failed to get signed S3 upload url - ${JSON.stringify(response.data)}`)
      return;
    }

    const upload_url = response.data["upload_url"]
    const new_filename = response.data["filename"]

    console.log("got upload url: " + upload_url)
    console.log("got new filename: " + new_filename)

    console.log("Getting file handle");

    // Step 2: Read file into a blob (React Native fetch doesn't accept local URIs directly)
    const localFileRes = await fetch(newImageUri);
    console.log("Getting file blob");
    const blob = await localFileRes.blob();

    console.log("About to upload image to s3");
    // Step 3: Upload with PUT to S3 - use the same content type as sent to backend
    const uploadRes = await fetch(upload_url, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: blob,
    });

    console.log("Got response");

    if (uploadRes.ok) {
      console.log("Uploaded successfully to S3!");
    } else {
      console.error("Upload failed", uploadRes.status, await uploadRes.text());
    }

    return new_filename
  }

  const sendUpdateUserDetailsRequest = async (new_filename) => {
    // Send updated bio and socials

    // Details to update
    const requestBody = {
        user_token: token,
        bio: editBio,
        image_object_key: new_filename || ""
    }

    axios.post(updateUserDetailsURL, requestBody)
    .then(response => {
      console.log(`Got UpdateUserDetails response: ${response.data}`);
    })
    .then(() => { fetchUserDetails() })
    .catch(error => {
      console.error("Error sending update user request:", error);
    });
  };
  
  const handleLogOut = async () => {
    setToken('');
    await removeToken();
    router.replace('/');
  };

  const selectImage = async () => {
    // Request permission
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "You need to enable camera roll access to select a profile picture.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
    }
  };

  const handleEditProfile = () => {
    // Initialize edit state with current data
    setEditBio(userBio);
    setSelectedImage(null); // Reset selected image
    setEditProfileSheetActive(true);
  };

  const handleSaveProfile = async () => {
    console.log('Saving profile:', { 
      bio: editBio, 
      profileImage: selectedImage 
    });

    uploadUserPicture()
    .then((new_filename) => { sendUpdateUserDetailsRequest(new_filename); })
    .then(() => { setEditProfileSheetActive(false); });
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
            {profilePicUrl ? (
              <Avatar.Image
                accessibilityLabel={username}
                src={profilePicUrl}
              />
            ) : (
              <Avatar.Fallback backgroundColor="$color3" alignItems="center" justifyContent="center">
                <UserIcon size={24} color="gray" />
              </Avatar.Fallback>
            )}
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
          
        </YStack>

        {/* Personal Info Stack */}
        <YStack space={SPACING.md} width="100%" marginTop={SPACING.lg}>
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
                {userBio}
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
      <Sheet native open={logoutSheetActive} onOpenChange={setLogoutSheetActive} dismissOnOverlayPress>
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
      <Sheet native open={settingsSheetActive} onOpenChange={setSettingsSheetActive} dismissOnOverlayPress>
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
      <Sheet native open={editProfileSheetActive} onOpenChange={setEditProfileSheetActive} dismissOnOverlayPress>
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
                {/* Profile Picture Section */}
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
                        fontSize={TYPOGRAPHY.sizes.md}
                        fontWeight={TYPOGRAPHY.weights.medium}
                        color="$gray11"
                        marginBottom={SPACING.xs}
                    >
                        Profile Picture
                    </Text>
                    
                    <Pressable onPress={selectImage}>
                        <View position="relative">
                            <Avatar circular size="$10">
                              {profilePicUrl ? (
                                <Avatar.Image
                                  accessibilityLabel={username}
                                  src={profilePicUrl}
                                />
                              ) : (
                                <Avatar.Fallback backgroundColor="$color3" alignItems="center" justifyContent="center">
                                  <UserIcon size={24} color="gray" />
                                </Avatar.Fallback>
                              )}
                            </Avatar>
                            
                            {/* Camera overlay */}
                            <View
                                position="absolute"
                                bottom={0}
                                right={0}
                                backgroundColor="$blue9"
                                borderRadius={20}
                                width={32}
                                height={32}
                                alignItems="center"
                                justifyContent="center"
                                borderWidth={2}
                                borderColor="$background"
                            >
                                <CameraIcon size={16} color="white" />
                            </View>
                        </View>
                    </Pressable>
                    
                    <Text 
                        fontSize={TYPOGRAPHY.sizes.sm}
                        color="$gray10"
                        textAlign="center"
                        marginTop={SPACING.xs}
                    >
                        Tap to change profile picture
                    </Text>
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
