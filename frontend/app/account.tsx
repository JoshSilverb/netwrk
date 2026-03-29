import { Stack, Link, router } from 'expo-router';
import { View, Button, XStack, YStack, Avatar, ScrollView, Text, Sheet, Label, Switch, Separator, Input, Checkbox } from 'tamagui';
import { Pressable, Alert } from 'react-native';
import { Plus as PlusIcon, X as XIcon, Camera as CameraIcon, User as UserIcon } from '@tamagui/lucide-icons';
import * as ImagePicker from 'expo-image-picker';
import { getUserDetailsURL, updateUserDetailsURL, getS3UploadURL, addContactForUserURL } from '@/constants/Apis';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/QueryKeys';
import { removeToken } from '@/utils/tokenstore';
import { SPACING, TYPOGRAPHY, CONTAINER_STYLES, BORDER_RADIUS } from '@/constants/Styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import CustomPlacesAutocomplete, { CustomPlacesAutocompleteRef } from '@/components/CustomPlacesAutocomplete';
import * as React from 'react';
import * as Contacts from 'expo-contacts';
import { formatDateForAPI } from '@/utils/utilfunctions';

import mime from 'mime';
import axios from 'axios';

export default function AccountPage() {
  const { token, setToken } = useAuth();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [errorMessage, setErrorMessage] = useState('');

  const [importSheetActive, setImportSheetActive] = useState(false);
  const [logoutSheetActive, setLogoutSheetActive] = useState(false);
  const [settingsSheetActive, setSettingsSheetActive] = useState(false);
  const [editProfileSheetActive, setEditProfileSheetActive] = useState(false);
  const [contactSelectionSheetActive, setContactSelectionSheetActive] = useState(false);

  const [formattedContacts, setFormattedContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState<{[key: number]: boolean}>({});
  const [contactSearchQuery, setContactSearchQuery] = useState('');

  const [isLightMode, setIsLightMode] = useState(true);

  // Edit profile form state
  const [editUsername,  setEditUsername]  = useState('');
  const [editBio,       setEditBio]       = useState('');
  const [editLocation,  setEditLocation]  = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const locationRef = React.useRef<CustomPlacesAutocompleteRef>(null);

  const { data: userData } = useQuery({
    queryKey: queryKeys.user(),
    queryFn: async () => {
      const response = await axios.post(getUserDetailsURL, { user_token: token });
      return response.data;
    },
  });

  const profilePicUrl = userData?.profile_pic_url || '';
  const username = userData?.username || '';
  const numContacts = userData?.num_contacts || '';
  const userBio = userData?.bio || '';
  const userLocation = userData?.location || '';

  useEffect(() => {
    if (editProfileSheetActive && userLocation) {
      const timer = setTimeout(() => {
        locationRef.current?.setAddressText(userLocation);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [editProfileSheetActive, userLocation]);
  
  const uploadUserPicture = async () => {
    // Send updated profile picture

    if (!selectedImage) {
      return;
    }

    const newImageUri =  "file:///" + selectedImage.uri.split("file:/").join("");
    const contentType = mime.getType(newImageUri);
    
    // Get signed s3 url for this picture from backend.

    const requestBody = {
        user_token: token,
        filetype: contentType
    }


    const response = await axios.post(getS3UploadURL, requestBody);
    
    if (response.status != 200) {
      return;
    }

    const upload_url = response.data["upload_url"]
    const new_filename = response.data["filename"]


    // Step 2: Read file into a blob (React Native fetch doesn't accept local URIs directly)
    const localFileRes = await fetch(newImageUri);
    const blob = await localFileRes.blob();
    // Step 3: Upload with PUT to S3 - use the same content type as sent to backend
    const uploadRes = await fetch(upload_url, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: blob,
    });

    if (uploadRes.ok) {
    } else {
      console.error("Upload failed", uploadRes.status, await uploadRes.text());
    }

    return new_filename
  }

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      const new_filename = await uploadUserPicture();
      await axios.post(updateUserDetailsURL, {
        user_token: token,
        username: editUsername,
        bio: editBio,
        image_object_key: new_filename || '',
        location: editLocation,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user() });
      setEditProfileSheetActive(false);
    },
    onError: (error) => {
      console.error('Error saving profile:', error);
    },
  });
  
  const handleLogOut = async () => {
    setToken('');
    await removeToken();
    router.replace('/');
  };

  const formatFullName = (firstName: string | undefined, lastName: string | undefined): string => {  
    let outputStr = "";
    if (firstName !== undefined) {
      outputStr += firstName + " ";
    }
    if (lastName !== undefined) {
      outputStr += lastName;
    }

    return outputStr;
  }

  const formatAddress = (addresses: Contacts.Address[] | undefined): string => {
    if (addresses === undefined || addresses.length === 0) {
      return "";
    }
    let addy = "";
    if (addresses[0].street) {
      addy += addresses[0].street;
      addy += ", ";
    }
    if (addresses[0].city) {
      addy += addresses[0].city;
      addy += ", ";
    }
    if (addresses[0].region) {
      addy += addresses[0].region;
      addy += ", ";
    }
    if (addresses[0].country) {
      addy += addresses[0].country;
      addy += ", ";
    }
    
    return addy.slice(0, -2);
  }

  const createUserBio = (components: (string | undefined)[]): string => {
    let outputStr = "";
    components.map((s) => {
      if (s !== undefined) {
        outputStr += s;
        outputStr += "; ";
      }
    });

    return outputStr.slice(0, -2);
  }

  const formatPhoneNumbers = (phoneNumbers: Contacts.PhoneNumber[] | undefined): {label: string, address: string}[] => {
    let formattedNumbers: {label: string, address: string}[] = [];
    if (phoneNumbers === undefined) {
      return formattedNumbers;
    }

    phoneNumbers.map((number) => {
      formattedNumbers.push({label: number.label + " Phone", address: number.number});
    })
    return formattedNumbers;
  };

  const formatEmails = (emails: Contacts.Email[] | undefined): {label: string, address: string}[] => {
    let formattedNumbers: {label: string, address: string}[] = [];
    if (emails === undefined) {
      return formattedNumbers;
    }

    emails.map((email) => {
      formattedNumbers.push({label: email.label + " Email", address: email.email});
    })
    return formattedNumbers;
  };

  const importFromContactsApp = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission Required", "You need to enable camera roll access to select a profile picture.");
      return;
    }
    const { data } = await Contacts.getContactsAsync({});

    let contacts = [];
    data.map((contact) => {
      if (contact.imageAvailable) {

      }
      const formattedContact = {
                          "fullname": formatFullName(contact.firstName, contact.lastName),
                          "location": formatAddress(contact.addresses),
                          "userbio": createUserBio([contact.note, contact.jobTitle,contact.company]),
                          "metthrough": "",
                          "socials": [...formatPhoneNumbers(contact.phoneNumbers), ...formatEmails(contact.emails)],
                          "lastcontact": formatDateForAPI(new Date()),
                          "reminderPeriod": {
                              "weeks": null,
                              "months": null
                          },
                          "image_object_key": null,
                          "tags": []
                      }
      contacts.push(formattedContact);
    });

    // Store formatted contacts and initialize all as deselected
    setFormattedContacts(contacts);
    setSelectedContacts({});

    // Open contact selection modal
    setContactSelectionSheetActive(true);
  }

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
    setEditUsername(username);
    setEditBio(userBio);
    setEditLocation(userLocation);
    setSelectedImage(null); // Reset selected image
    setEditProfileSheetActive(true);
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate();
  };

  const handleSaveSettings = async () => {

  };

  const uploadSelectedContacts = async (selectedContactsList: any[]) => {
    // Create all upload promises for parallel execution
    const uploadPromises = selectedContactsList.map(async (contact) => {
      const requestBody = {
        user_token: token,
        newContact: contact
      };

      try {
        const response = await axios.post(addContactForUserURL, requestBody);
        return { success: response.status === 200 };
      } catch (error) {
        console.error("Error during add contact POST request:", error);
        return { success: false };
      }
    });

    // Create a 2-second timeout promise
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => resolve({ timedOut: true }), 5000);
    });

    // Race between all uploads completing and the timeout
    const result = await Promise.race([
      Promise.allSettled(uploadPromises).then(results => ({ results, timedOut: false })),
      timeoutPromise
    ]);

    let successCount = 0;
    let failedCount = 0;

    if (result.timedOut) {
      Alert.alert(
        "Upload In Progress",
        "Contact upload is taking longer than expected. Please check back later."
      );
    } else {
      result.results.forEach((promiseResult) => {
        if (promiseResult.status === 'fulfilled' && promiseResult.value.success) {
          successCount++;
        } else {
          failedCount++;
        }
      });

      queryClient.invalidateQueries({ queryKey: ['contacts'] });

      if (failedCount > 0) {
        Alert.alert(
          "Upload Complete",
          `Successfully uploaded ${successCount} out of ${selectedContactsList.length} contacts. ${failedCount} failed.`
        );
      } else {
        Alert.alert(
          "Upload Complete",
          `Successfully uploaded all ${successCount} contacts!`
        );
      }
    }
  }

  const toggleContactSelection = (index: number) => {
    setSelectedContacts(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleToggleAllContacts = () => {
    const selectedCount = Object.values(selectedContacts).filter(Boolean).length;
    const allSelected = selectedCount === formattedContacts.length;
    const newSelection = {};
    formattedContacts.forEach((_, index) => {
      newSelection[index] = !allSelected;
    });
    setSelectedContacts(newSelection);
  };

  const handleCancelContactSelection = () => {
    // Close contact selection modal
    setContactSelectionSheetActive(false);
    // Close contact import modal
    setImportSheetActive(false);
    // Clear formatted contacts
    setFormattedContacts([]);
    setSelectedContacts({});
    setContactSearchQuery('');
  };

  const handleConfirmContactSelection = () => {
    // Filter contacts based on selection
    const selectedContactsList = formattedContacts.filter((_, index) => selectedContacts[index]);

    uploadSelectedContacts(selectedContactsList);

    // Close modals and clear state
    setContactSelectionSheetActive(false);
    setImportSheetActive(false);
    setFormattedContacts([]);
    setSelectedContacts({});
    setContactSearchQuery('');
  };


  return (
    <View style={CONTAINER_STYLES.screen} backgroundColor="$background">
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

          {userLocation && (
            <Text
              fontSize={TYPOGRAPHY.sizes.md}
              color="$gray10"
            >
              {userLocation}
            </Text>
          )}

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

          <Button
            onPress={() => setImportSheetActive(true)}
            size="$3"
            variant="outlined"
            borderRadius={BORDER_RADIUS.md}
          >
            Import contacts
          </Button>
          <Text color="$red">
            {errorMessage}
          </Text>
          
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

          <YStack space={SPACING.sm} marginTop={SPACING.lg} width="100%">
            <Button
              onPress={handleEditProfile}
              size="$3"
              backgroundColor="$blue9"
              color="white"
              borderRadius={BORDER_RADIUS.md}
            >
              Edit Profile
            </Button>
            <Button
              onPress={() => setSettingsSheetActive(true)}
              size="$3"
              variant="outlined"
              borderRadius={BORDER_RADIUS.md}
            >
              Settings
            </Button>
            <Button
              onPress={() => setLogoutSheetActive(true)}
              size="$3"
              variant="outlined"
              borderColor="$red9"
              color="$red9"
              borderRadius={BORDER_RADIUS.md}
            >
              Log Out
            </Button>
          </YStack>
        </YStack>
      </YStack>
      </ScrollView>
      
      {/* Contact Import Modal */}
      {importSheetActive && (
      <Sheet native open={importSheetActive} onOpenChange={setImportSheetActive} dismissOnOverlayPress>
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
              {/* Options */}
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
                      Import contacts
                  </Text>
                  <Text 
                      fontSize={TYPOGRAPHY.sizes.md}
                      color="$gray10"
                      textAlign="center"
                      lineHeight={20}
                  >
                      Import contacts from one of these sources:
                  </Text>
              </YStack>
          </YStack>
          
          {/* Action Buttons */}
          <YStack
              padding={SPACING.md}
              space={SPACING.sm}
              borderTopWidth={1}
              borderTopColor="$borderColor"
              backgroundColor="$background"
          >
              <Button
                  size="$3"
                  onPress={() => {
                      setImportSheetActive(false);
                      importFromContactsApp();
                  }}
                  backgroundColor="$blue9"
                  color="white"
                  borderRadius={BORDER_RADIUS.md}
              >
                  From contacts app
              </Button>
              {/* <Button
                  size="$3"
                  onPress={() => {
                      setImportSheetActive(false);
                      // handleLogOut();
                  }}
                  backgroundColor="$blue9"
                  color="white"
                  borderRadius={BORDER_RADIUS.md}
              >
                  From spreadsheet
              </Button> */}
              <Button
                  size="$3"
                  variant="outlined"
                  onPress={() => setImportSheetActive(false)}
                  borderRadius={BORDER_RADIUS.md}
              >
                  Cancel
              </Button>
          </YStack>
          </Sheet.Frame>
      </Sheet>
      )}

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
          <YStack space={SPACING.lg} padding={SPACING.lg}>
              <Text
                  fontSize={TYPOGRAPHY.sizes.lg}
                  fontWeight={TYPOGRAPHY.weights.bold}
                  color="$gray11"
              >
                  Settings
              </Text>
              <XStack
                  justifyContent="space-between"
                  alignItems="center"
                  padding={SPACING.md}
                  borderWidth={1}
                  borderColor="$borderColor"
                  borderRadius={BORDER_RADIUS.md}
                  backgroundColor="$gray1"
              >
                  <Text fontSize={TYPOGRAPHY.sizes.md} color="$gray11">
                      Dark mode
                  </Text>
                  <Text fontSize={TYPOGRAPHY.sizes.sm} color="$gray9">
                      Coming soon
                  </Text>
              </XStack>
              <Button
                  size="$3"
                  variant="outlined"
                  onPress={() => setSettingsSheetActive(false)}
                  borderRadius={BORDER_RADIUS.md}
              >
                  Close
              </Button>
          </YStack>
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
          <KeyboardAwareScrollView
            enableOnAndroid={true}
            enableAutomaticScroll={true}
            extraScrollHeight={30}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ flexGrow: 1 }}
          >
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

                {/* Username Section */}
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
                        Username
                    </Text>
                    <Input
                        value={editUsername}
                        onChangeText={setEditUsername}
                        placeholder="New username"
                        size="$4"
                        textAlignVertical="top"
                    />
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
                        placeholder="New bio"
                        multiline
                        numberOfLines={4}
                        size="$4"
                        textAlignVertical="top"
                    />
                </YStack>

                {/* Location Section */}
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
                        Location
                    </Text>
                    <CustomPlacesAutocomplete
                        placeholder="Enter your location"
                        onPress={(data) => {
                            setEditLocation(data.description);
                        }}
                        disableScroll={true}
                        ref={locationRef}
                    />
                </YStack>
            </YStack>
          </KeyboardAwareScrollView>

          {/* Action Buttons */}
          <XStack
              padding={SPACING.md}
              justifyContent="flex-end"
              space={SPACING.sm}
              borderTopWidth={1}
              borderTopColor="$borderColor"
              backgroundColor="$background"
              paddingBottom={insets.bottom + SPACING.md}
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

      {/* Contact Selection Modal */}
      {contactSelectionSheetActive && (
      <Sheet native open={contactSelectionSheetActive} onOpenChange={setContactSelectionSheetActive} dismissOnOverlayPress={false}>
          <Sheet.Frame
              backgroundColor="$background"
              borderTopLeftRadius={BORDER_RADIUS.lg}
              borderTopRightRadius={BORDER_RADIUS.lg}
          >
          <Sheet.Handle backgroundColor="$gray8" />
          <YStack
              space={SPACING.lg}
              padding={SPACING.lg}
              flex={1}
          >
              {/* Header */}
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
                      Select Contacts to Import
                  </Text>
                  <Text
                      fontSize={TYPOGRAPHY.sizes.md}
                      color="$gray10"
                      textAlign="center"
                      lineHeight={20}
                  >
                      {Object.values(selectedContacts).filter(Boolean).length} of {formattedContacts.length} contacts selected
                  </Text>
              </YStack>

              {/* Toggle All Button */}
              <Button
                  size="$3"
                  onPress={handleToggleAllContacts}
                  variant="outlined"
                  borderRadius={BORDER_RADIUS.md}
              >
                  {Object.values(selectedContacts).filter(Boolean).length === formattedContacts.length ? "Deselect All" : "Select All"}
              </Button>

              {/* Search Bar */}
              <Input
                  value={contactSearchQuery}
                  onChangeText={setContactSearchQuery}
                  placeholder="Search contacts by name..."
                  size="$4"
                  borderRadius={BORDER_RADIUS.md}
              />

              {/* Contacts List */}
              <ScrollView flex={1}>
                <YStack space={SPACING.sm}>
                  {formattedContacts
                    .map((contact, index) => ({ contact, index }))
                    .filter(({ contact }) =>
                      contactSearchQuery === '' ||
                      contact.fullname.toLowerCase().includes(contactSearchQuery.toLowerCase())
                    )
                    .map(({ contact, index }) => (
                    <Pressable
                      key={index}
                      onPress={() => toggleContactSelection(index)}
                    >
                      <XStack
                        padding={SPACING.md}
                        borderWidth={1}
                        borderColor="$borderColor"
                        borderRadius={BORDER_RADIUS.sm}
                        backgroundColor={selectedContacts[index] ? "$gray3" : "$background"}
                        alignItems="center"
                        space={SPACING.md}
                      >
                        <Checkbox
                          checked={selectedContacts[index]}
                          onCheckedChange={() => toggleContactSelection(index)}
                          size="$5"
                        >
                          <Checkbox.Indicator>
                            <Text>✓</Text>
                          </Checkbox.Indicator>
                        </Checkbox>

                        <YStack flex={1}>
                          <Text
                            fontSize={TYPOGRAPHY.sizes.md}
                            fontWeight={TYPOGRAPHY.weights.medium}
                            color="$gray12"
                          >
                            {contact.fullname}
                          </Text>
                          {contact.userbio && (
                            <Text
                              fontSize={TYPOGRAPHY.sizes.sm}
                              color="$gray10"
                              numberOfLines={1}
                            >
                              {contact.userbio}
                            </Text>
                          )}
                          {contact.socials && contact.socials.length > 0 && (
                            <Text
                              fontSize={TYPOGRAPHY.sizes.sm}
                              color="$gray9"
                              numberOfLines={1}
                            >
                              {contact.socials[0].address}
                            </Text>
                          )}
                        </YStack>
                      </XStack>
                    </Pressable>
                  ))}
                </YStack>
              </ScrollView>
          </YStack>

          {/* Action Buttons */}
          <XStack
              padding={SPACING.md}
              justifyContent="flex-end"
              space={SPACING.sm}
              borderTopWidth={1}
              borderTopColor="$borderColor"
              backgroundColor="$background"
              paddingBottom={insets.bottom + SPACING.md}
          >
              <Button
                  size="$3"
                  variant="outlined"
                  onPress={handleCancelContactSelection}
                  borderRadius={BORDER_RADIUS.md}
                  flex={1}
              >
                  Cancel
              </Button>
              <Button
                  size="$3"
                  onPress={handleConfirmContactSelection}
                  backgroundColor="$blue9"
                  color="white"
                  borderRadius={BORDER_RADIUS.md}
                  flex={1}
              >
                  <Text color="white">
                      Confirm ({Object.values(selectedContacts).filter(Boolean).length})
                  </Text>
              </Button>
          </XStack>
          </Sheet.Frame>
      </Sheet>
      )}

    </View>
  );
}
