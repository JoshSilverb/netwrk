import { Stack, Link, router } from 'expo-router';
import { View, Button, XStack, YStack, Avatar, ScrollView, Text, Sheet, Label, Switch, Separator, Input, Checkbox } from 'tamagui';
import { Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Plus as PlusIcon, X as XIcon, Camera as CameraIcon, User as UserIcon } from '@tamagui/lucide-icons';
import * as ImagePicker from 'expo-image-picker';
import { getUserDetailsURL, updateUserDetailsURL, getS3UploadURL, addContactForUserURL } from '@/constants/Apis';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';
import { removeToken } from '@/utils/tokenstore';
import { SPACING, TYPOGRAPHY, CONTAINER_STYLES, BORDER_RADIUS } from '@/constants/Styles';
import * as Contacts from 'expo-contacts';
import { formatDateForAPI } from '@/utils/utilfunctions';

import mime from 'mime';
import axios from 'axios';

export default function AccountPage() {
  const { token, setToken } = useAuth();

  const [profilePicUrl, setProfilePicUrl] = useState('');
  const [username, setUsername] = useState('');
  const [numContacts, setNumContacts] = useState('');
  const [userBio, setUserBio] = useState('');


  const [errorMessage, setErrorMessage] = useState('');

  const [importSheetActive, setImportSheetActive] = useState(false);
  const [logoutSheetActive, setLogoutSheetActive] = useState(false);
  const [settingsSheetActive, setSettingsSheetActive] = useState(false);
  const [editProfileSheetActive, setEditProfileSheetActive] = useState(false);
  const [contactSelectionSheetActive, setContactSelectionSheetActive] = useState(false);

  const [formattedContacts, setFormattedContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState<{[key: number]: boolean}>({});

  const [isLightMode, setIsLightMode] = useState(true);

  // Edit profile form state
  const [editUsername,  setEditUsername]  = useState('');
  const [editBio,       setEditBio]       = useState('');
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
        username: editUsername,
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

    console.log(data);

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

    console.log("Formatted:");

    console.log(contacts);

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

  const uploadSelectedContacts = async (selectedContactsList: any[]) => {
    // Create all upload promises for parallel execution
    const uploadPromises = selectedContactsList.map(async (contact) => {
      const requestBody = {
        user_token: token,
        newContact: contact
      };

      try {
        const response = await axios.post(addContactForUserURL, requestBody);
        console.log(response.data);
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
      // Timeout occurred - show partial results
      Alert.alert(
        "Upload In Progress",
        "Contact upload is taking longer than expected. Please check back later."
      );
    } else {
      // All requests completed - count successes and failures
      result.results.forEach((promiseResult) => {
        if (promiseResult.status === 'fulfilled' && promiseResult.value.success) {
          successCount++;
        } else {
          failedCount++;
        }
      });

      // Show alert with results
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
  };

  const handleConfirmContactSelection = () => {
    // Filter contacts based on selection
    const selectedContactsList = formattedContacts.filter((_, index) => selectedContacts[index]);

    console.log("Selected contacts to import:", selectedContactsList);

    uploadSelectedContacts(selectedContactsList);

    // Close modals and clear state
    setContactSelectionSheetActive(false);
    setImportSheetActive(false);
    setFormattedContacts([]);
    setSelectedContacts({});
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

          <Button onPress={() => setImportSheetActive(true)}>
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

          <XStack space={SPACING.md} marginTop={SPACING.lg}>
            <Button onPress={() => {setLogoutSheetActive(true)}} backgroundColor="$red9" color="white">Log Out</Button>
            <Button onPress={handleEditProfile} variant="outlined">Edit Profile</Button>
            <Button onPress={() => {setSettingsSheetActive(true)}} variant="outlined">Settings</Button>
          </XStack>
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
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
          <ScrollView keyboardShouldPersistTaps="handled">
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
            </YStack>
          </ScrollView>
          </KeyboardAvoidingView>

          {/* Action Buttons */}
          <XStack
              padding={SPACING.md}
              justifyContent="flex-end"
              space={SPACING.sm}
              borderTopWidth={1}
              borderTopColor="$borderColor"
              backgroundColor="$background"
              paddingBottom={80}
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

              {/* Contacts List */}
              <ScrollView flex={1}>
                <YStack space={SPACING.sm}>
                  {formattedContacts.map((contact, index) => (
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
              paddingBottom={80}
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
