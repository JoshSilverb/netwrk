import React from 'react';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';

import { TextInput, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Months } from '@/constants/Definitions';
import { Text, View, Group, Separator, XStack, YStack, Button, Paragraph, Input, Avatar, Switch, Label } from 'tamagui';
import { addContactForUserURL, getContactByIdURL, updateContactForUserURL, getS3UploadURL } from '@/constants/Apis';
import axios from 'axios';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useAuth } from '@/components/AuthContext';
import CustomPlacesAutocomplete, { CustomPlacesAutocompleteRef } from '@/components/CustomPlacesAutocomplete';
import CustomTagsAutocomplete, { CustomTagsAutocompleteRef } from '@/components/CustomTagsAutocomplete';
import { Plus as PlusIcon, X as XIcon, Camera as CameraIcon, User as UserIcon } from '@tamagui/lucide-icons';
import { CommunicationFrequencySelector } from '@/components/CommunicationFrequencySelector';
import { SPACING, TYPOGRAPHY, CONTAINER_STYLES, BORDER_RADIUS } from '@/constants/Styles';
import * as ImagePicker from 'expo-image-picker';
import mime from 'mime';
import { parse } from 'date-fns';
import { formatDateForAPI } from '@/utils/utilfunctions';

export default function AddContactPage() {
    const params = useLocalSearchParams<{ id?: string }>();
    const id = params.id ?? "0";

    console.log("Rendering add page with ID param =", id);

    const [loading,       setLoading]       = React.useState(true);
    const [errorMessage, setErrorMessage] = React.useState('');

    // Basic data 
    const [fullname,   onChangeFullname]   = React.useState('');
    const [location,   onChangeLocation]   = React.useState('');
    const [bio,        onChangeBio]        = React.useState('');
    const [metThrough, onChangeMetThrough] = React.useState('');
    const [socials,    setSocials]         = React.useState([]);
    const [newSocial,  setNewSocial]       = React.useState({ label: '', address: ''});
    const [openNewSocial, setOpenNewSocial] = React.useState(false);
    const [remindPeriodWks, setRemindPeriodWks]  = React.useState(0);
    const [remindPeriodMos, setRemindPeriodMos]  = React.useState(1);
    const [enableContactFrequency, setEnableContactFrequency] = React.useState(true);
    const [initialFrequencyType, setInitialFrequencyType] = React.useState<'weeks' | 'months'>('months');
    const [initialFrequencyValue, setInitialFrequencyValue] = React.useState(1);
    const [tags,       setTags]       = React.useState([]);
    const [newTag,     setNewTag]          = React.useState('');
    const [selectedImage, setSelectedImage] = React.useState(null);
    const [profileImageURI, setProfileImageURI] = React.useState(null);

    // Safe area insets for bottom button
    const insets = useSafeAreaInsets();

    // Extra location var
    const ref = React.useRef<CustomPlacesAutocompleteRef>(null);
    const tagRef = React.useRef<CustomTagsAutocompleteRef>(null);

    // Last Contact date picker
    const [date, setDate] = React.useState(() => new Date());
    const [show, setShow] = React.useState(false);

    const { token, setToken } = useAuth();


    // Socials
    const addSocial = () => {
        if (newSocial.label && newSocial.address) {
            setSocials([...socials, newSocial]);
            setNewSocial({ label: '', address: '' }); // Reset input
        }
    };
    
    const editSocial = (index, key, value) => {
        const updatedSocials = [...socials];
        updatedSocials[index][key] = value;
        setSocials(updatedSocials);
    };

    const removeSocial = (index) => {
        setSocials(socials.filter((_, i) => i !== index));
    };

    const handleOpenNewSocialPress = () => {
        setOpenNewSocial(true);
    }
    const handleCloseNewSocialPress = () => {
        setOpenNewSocial(false);
    }
    
    // Tags
    const addTag = () => {
        const trimmedTag = newTag.trim();
        if (trimmedTag && !tags.includes(trimmedTag)) {
            setTags([...tags, trimmedTag]);
            setNewTag('');
            tagRef.current?.setTagText('');
        }
    }

    const handleTagSuggestionPress = (tag: string) => {
        setNewTag(tag);
    };

    const removeTag = (index) => {
        setTags(tags.filter((_, i) => i !== index));
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
            setProfileImageURI(result.assets[0].uri)
        }
    };

    const uploadContactPicture = async () => {
        if (!selectedImage) {
            console.log("No image selected for contact");
            return "";
        }

        const newImageUri = "file:///" + selectedImage.uri.split("file:/").join("");
        const contentType = mime.getType(newImageUri);
        
        // Get signed s3 url for this picture from backend
        const requestBody = {
            user_token: token,
            filetype: contentType
        }

        console.log("sending request to get s3 upload url for contact image with body: " + JSON.stringify(requestBody))

        const response = await axios.post(getS3UploadURL, requestBody);
        
        if (response.status != 200) {
            console.log(`Failed to get signed S3 upload url for contact - ${JSON.stringify(response.data)}`)
            return "";
        }

        const upload_url = response.data["upload_url"]
        const new_filename = response.data["filename"]

        console.log("got upload url for contact: " + upload_url)
        console.log("got new filename for contact: " + new_filename)

        // Read file into a blob
        const localFileRes = await fetch(newImageUri);
        const blob = await localFileRes.blob();

        console.log("About to upload contact image to s3");
        // Upload with PUT to S3 - use the same content type as sent to backend
        const uploadRes = await fetch(upload_url, {
            method: "PUT",
            headers: { "Content-Type": contentType },
            body: blob,
        });

        if (uploadRes.ok) {
            console.log("Uploaded contact image successfully to S3!");
            return new_filename;
        } else {
            console.error("Contact image upload failed", uploadRes.status, await uploadRes.text());
            setErrorMessage("Failed to upload contact image");
            return "";
        }
    };
    
    // Reminder periods
    const onChangeRemindPeriod = (weeks, months) => {
        setRemindPeriodWks(weeks);
        setRemindPeriodMos(months);
        console.log(`[ADD] remind period: wks=${remindPeriodWks} mos=${remindPeriodMos}`)
    }

    // If id isn't set, then this is in pure add mode, not edit, so don't need 
    // loading and error flags.
    const [resolvedId, setResolvedId] = React.useState<string | undefined>(undefined);

    const router = useRouter();

    React.useEffect(() => {
        if (id === '0') {
            console.log("Id is 0, not fetching a contact");
            setLoading(false);
        }
        else {
            console.log("ID is non-0, fetching cause ID=", id);
            setResolvedId(id as string);
            fetchContactById(id as string);
        }
        return () => {
            console.log("Cleaning up");
            resetData();
        };

    }, [id, router]);

    const fetchContactById = async (id: string) => {
        const requestBody = {
            user_token: token,
            contact_id: id
        }
        try {
            const response = await axios.post(getContactByIdURL, requestBody);
            setDataFromContact(response.data);
            setLoading(false);
            // setErrorReceived(false);
        } catch (error) {
            console.error('Error fetching data:', error.response.data);
            setErrorMessage("Error getting contact");
            setLoading(false);
            // setErrorReceived(true);
        }
    };

    const onChange = (event, selectedDate) => {
        const currentDate = selectedDate;
        setShow(false);
        setDate(currentDate);
    };

    const showDatepicker = () => {
        setShow(true);
    };

    const resetData = () => {
        onChangeFullname("");
        onChangeLocation("");
        ref.current?.setAddressText('');
        onChangeBio("");
        onChangeMetThrough("");
        setSocials([]);
        setNewSocial({ label: '', address: ''});
        setRemindPeriodWks(0);
        setRemindPeriodMos(1);
        setEnableContactFrequency(true);
        setInitialFrequencyType('months');
        setInitialFrequencyValue(1);
        setTags([]);
        setDate(new Date());
        setSelectedImage(null);
        setProfileImageURI(null);
    }

    const setDataFromContact = (contact) => {
        console.log("Editing contact:", contact)
        onChangeFullname(contact.fullname);
        onChangeLocation(contact.location);
        ref.current?.setAddressText(contact.location);
        onChangeBio(contact.userbio);
        onChangeMetThrough(contact.metthrough);
        setSocials(contact.socials);
        setNewSocial({ label: '', address: ''});

        // Handle reminder period - enable toggle if values exist
        const hasReminderPeriod = contact.remind_in_weeks != null || contact.remind_in_months != null;
        setEnableContactFrequency(hasReminderPeriod);
        setRemindPeriodWks(contact.remind_in_weeks || 0);
        setRemindPeriodMos(contact.remind_in_months || 1);

        console.log(`Weeks: ${contact.remind_in_weeks}, months: ${contact.remind_in_months}, months?: ${Boolean(contact.remind_in_months)}`)

        // Set initial frequency type based on which value is given
        if (contact.remind_in_weeks && !contact.remind_in_months) {
            console.log("Setting frequency to weeks");
            setInitialFrequencyType('weeks');
            setInitialFrequencyValue(contact.remind_in_weeks);
        } else if (contact.remind_in_months && !contact.remind_in_weeks) {
            console.log("Setting frequency to months");
            setInitialFrequencyType('months');
            setInitialFrequencyValue(contact.remind_in_months);
        } else {
            console.log("Setting frequency to default (months)");
            setInitialFrequencyType('months'); // Default to months
        }

        setTags(contact.tags);
        let dateStr = contact.lastcontact.replace(',', '');  // "17 Apr 2025"
        console.log(`Setting last contact date from value=${dateStr} with type=${typeof dateStr}`)
        // const newDate = new Date(dateStr);
        const newDate = parse(dateStr, 'dd MMM yyyy', new Date());
        console.log(`Casting that to date gives ${newDate}`)
        if (!isNaN(newDate.getTime())) {
            setDate(newDate);
        } else {
            console.error('Invalid date, using today as fallback');
            setDate(new Date());
        }
        console.log(`Set last contact date to value=${date}`)
        setSelectedImage(null); 
        setProfileImageURI(contact.profile_pic_url);
    }

    //================================
    // Sending this contact to backend
    //================================

    // Send data to backend and redirect to contact page

    const postNewContact = async () => {
        if (!fullname) {
            setErrorMessage("Cannot create a contact without a name");
            console.error("Cannot create a contact without a name");

            return;
        }

        try {
            // First upload the contact image if one is selected
            const imageObjectKey = await uploadContactPicture();
            
            // Contact data to be sent
            const requestBody = {
                user_token: token,
                newContact: {
                    "fullname": fullname,
                    "location": location,
                    "userbio": bio,
                    "metthrough": metThrough,
                    "socials": socials,
                    "lastcontact": formatDateForAPI(date),
                    "reminderPeriod": {
                        "weeks": enableContactFrequency ? remindPeriodWks : null,
                        "months": enableContactFrequency ? remindPeriodMos : null
                    },
                    "tags": tags,
                    "image_object_key": imageObjectKey
                }
            }

            console.log("Adding new user with details:", requestBody.newContact);

            const response = await axios.post(addContactForUserURL, requestBody)
            console.log(response.data)
            if (response.status == 200) {
                await resetData();
                // For new contacts, navigate to the contact page
                const redirectLink = "/contact/" + response.data;
                router.push(redirectLink);
            }

        }
        catch (error) {
            console.error("Error during add contact POST request:", error);
            setErrorMessage("Failed to upload new contact details");
        }
    }

    // Update contact API call

    const updateContact = async () => {
        if (!fullname) {
            setErrorMessage("Cannot update a contact without a name");
            console.error("Cannot update a contact without a name");

            return;
        }

        try {
            // First upload the contact image if one is selected
            const imageObjectKey = await uploadContactPicture();
            
            // Contact data to be sent
            const requestBody = {
                user_token: token,
                newContact: {
                    "contact_id": id as string,
                    "fullname": fullname,
                    "location": location,
                    "userbio": bio,
                    "metthrough": metThrough,
                    "socials": socials,
                    "lastcontact": formatDateForAPI(date),
                    "reminderPeriod": {
                        "weeks": enableContactFrequency ? remindPeriodWks : null,
                        "months": enableContactFrequency ? remindPeriodMos : null
                    },
                    "tags": tags,
                    "image_object_key": imageObjectKey
                }
            }
            
            console.log("Updating user to new details:", requestBody.newContact);

            const response = await axios.post(updateContactForUserURL, requestBody)
            console.log(response.data)
            if (response.status == 200) {
                await resetData();
                // Just dismiss - the contact page will auto-refresh on focus
                router.dismiss();
            }

        }
        catch (error) {
            console.error("Error during update contact POST request:", error);
            setErrorMessage("Failed to update contact details")
        }
    }

    return (
        <View style={CONTAINER_STYLES.screen}>
            <Stack.Screen
                options={{
                    title: id === '0' ? 'Add Contact' : 'Edit Contact',
                    headerShown: true,
                    headerBackTitleVisible: false,
                    presentation: id === '0' ? 'modal' : 'card',
                    gestureEnabled: true,
                    headerBackButtonMenuEnabled: false,
                }}
            />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            >
            <ScrollView
                contentContainerStyle={{ paddingBottom: 80 + (insets.bottom || 0) }}
            >
            <YStack space={SPACING.lg} padding={SPACING.lg}>
                {errorMessage && <Text color="red">errorMessage</Text>}
                {/* Full Name Input */}
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
                        Name
                    </Text>
                    <Input
                        size="$4"
                        value={fullname}
                        onChangeText={onChangeFullname}
                        placeholder="Enter full name"
                        textContentType='name'
                        fontSize={TYPOGRAPHY.sizes.lg}
                        fontWeight={TYPOGRAPHY.weights.bold}
                        textAlign='center'
                        borderRadius={BORDER_RADIUS.md}
                    />
                </YStack>

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
                                {profileImageURI ? (
                                <Avatar.Image
                                    accessibilityLabel={fullname}
                                    src={profileImageURI}
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
                        Tap to {selectedImage ? 'change' : 'add'} profile picture
                    </Text>
                </YStack>

                {/* Location Input */}
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
                    <View
                        borderWidth={1}
                        borderColor="$borderColor"
                        borderRadius={BORDER_RADIUS.md}
                        backgroundColor="$background"
                    >
                        <CustomPlacesAutocomplete
                            predefinedPlaces={[]}
                            textInputProps={{
                                style: {
                                    fontSize: TYPOGRAPHY.sizes.md,
                                    paddingHorizontal: SPACING.md,
                                    paddingVertical: SPACING.sm,
                                }
                            }}
                            styles={{
                                container: { flex: 0 },
                                textInput: {
                                    borderWidth: 0,
                                    backgroundColor: 'transparent',
                                },
                                listView: {
                                    borderRadius: BORDER_RADIUS.md,
                                    marginTop: SPACING.xs,
                                }
                            }}
                            placeholder='Enter location'
                            onPress={(data, details = null) => {
                                onChangeLocation(data.description);
                                console.log(data);
                            }}
                            disableScroll={true}
                            ref={ref}
                        />
                    </View>
                </YStack>

                {/* Met Through */}
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
                        How you met
                    </Text>
                    <Input
                        value={metThrough}
                        onChangeText={onChangeMetThrough}
                        placeholder="Describe how you met this person"
                        multiline
                        size="$4"
                        textAlignVertical="top"
                        minHeight={60}
                    />
                </YStack>

                {/* Notes */}
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
                        Notes
                    </Text>
                    <Input
                        value={bio}
                        onChangeText={onChangeBio}
                        placeholder="Add any notes about this person"
                        multiline
                        size="$4"
                        textAlignVertical="top"
                        minHeight={80}
                    />
                </YStack>
                {/* Contact Frequency */}
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
                        marginBottom={SPACING.sm}
                    >
                        Contact Frequency
                    </Text>
                    
                    {/* Last Contact Date */}
                    <YStack space={SPACING.xs}>
                        <Text 
                            fontSize={TYPOGRAPHY.sizes.sm}
                            fontWeight={TYPOGRAPHY.weights.medium}
                            color="$gray10"
                        >
                            Last Contact
                        </Text>
                        <Pressable onPress={showDatepicker}>
                            <View
                                padding={SPACING.sm}
                                borderWidth={1}
                                borderColor="$borderColor"
                                borderRadius={BORDER_RADIUS.sm}
                                backgroundColor="$background"
                                minHeight={44}
                                justifyContent="center"
                            >
                                <Text
                                    fontSize={TYPOGRAPHY.sizes.md}
                                    textAlign="center"
                                >
                                    {date ? `${date.getDate()} ${Months[date.getMonth()]} ${date.getFullYear()}` : 'Select Date'}
                                </Text>
                            </View>
                        </Pressable>
                        {show && (
                            <DateTimePicker
                                testID="dateTimePicker"
                                value={date}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={onChange}
                            />
                        )}
                    </YStack>
                    
                    {/* Contact Frequency */}
                    <YStack space={SPACING.xs}>
                        <XStack justifyContent="space-between" alignItems="center">
                            <Text
                                fontSize={TYPOGRAPHY.sizes.sm}
                                fontWeight={TYPOGRAPHY.weights.medium}
                                color="$gray10"
                            >
                                Contact Every
                            </Text>
                            <Switch
                                size="$2"
                                checked={enableContactFrequency}
                                onCheckedChange={setEnableContactFrequency}
                            >
                                <Switch.Thumb animation="quick" />
                            </Switch>
                        </XStack>
                        {enableContactFrequency && (
                            <CommunicationFrequencySelector
                                onChange={onChangeRemindPeriod}
                                initialFrequencyType={initialFrequencyType}
                                initialValue={initialFrequencyValue}
                            />
                        )}
                    </YStack>
                </YStack>

                {/* Tags Section */}
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
                        Tags
                    </Text>

                    {/* Tags Container with existing tags and add input */}
                    <YStack space={SPACING.sm}>
                        {/* Existing Tags */}
                        {tags.length > 0 && (
                            <XStack 
                                flexWrap="wrap" 
                                gap={SPACING.xs}
                                padding={SPACING.sm}
                                borderRadius={BORDER_RADIUS.sm}
                                backgroundColor="$gray2"
                            >
                                {tags.map((tag, index) => (
                                    <XStack 
                                        key={index}
                                        alignItems="center"
                                        backgroundColor="$blue4"
                                        borderRadius={BORDER_RADIUS.xs}
                                        paddingHorizontal={SPACING.xs}
                                        paddingVertical={2}
                                    >
                                        <Text 
                                            fontSize={TYPOGRAPHY.sizes.xs}
                                            color="$blue11"
                                            marginRight={4}
                                        >
                                            {tag}
                                        </Text>
                                        <Pressable onPress={() => removeTag(index)}>
                                            <XIcon size={12} color="$blue10" />
                                        </Pressable>
                                    </XStack>
                                ))}
                            </XStack>
                        )}
                        
                        {/* Add New Tag */}
                        <XStack space={SPACING.xs} alignItems="center">
                            <View
                                flex={1}
                                borderWidth={1}
                                borderColor="$borderColor"
                                borderRadius={BORDER_RADIUS.sm}
                                backgroundColor="$background"
                            >
                                <CustomTagsAutocomplete
                                    placeholder="Add a tag"
                                    value={newTag}
                                    onChangeText={setNewTag}
                                    onPress={handleTagSuggestionPress}
                                    token={token}
                                    ref={tagRef}
                                    textInputProps={{
                                        style: {
                                            fontSize: TYPOGRAPHY.sizes.sm,
                                            height: 36,
                                        }
                                    }}
                                    styles={{
                                        container: { flex: 0 },
                                        textInput: {
                                            borderWidth: 0,
                                            backgroundColor: 'transparent',
                                        },
                                    }}
                                    disableScroll={true}
                                />
                            </View>
                            <Button
                                size="$2"
                                onPress={addTag}
                                backgroundColor="$blue9"
                                color="white"
                                minWidth={36}
                                minHeight={36}
                            >
                                <PlusIcon size={14} />
                            </Button>
                        </XStack>
                    </YStack>
                </YStack>

                {/* Socials Section */}
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
                        Contact Info
                    </Text>

                {/* Existing Socials */}
                {socials.map((social, index) => (
                    <XStack 
                        key={index} 
                        space={SPACING.xs}
                        padding={SPACING.sm}
                        borderWidth={1}
                        borderColor="$borderColor"
                        borderRadius={BORDER_RADIUS.sm}
                        backgroundColor="$gray1"
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
                                    onPress={handleCloseNewSocialPress}
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
                            onPress={handleOpenNewSocialPress} 
                            variant="outlined"
                            size="$3"
                        >
                            + Add Contact Method
                        </Button>
                    </XStack>
                )}
                </YStack>

            </YStack>
            </ScrollView>
            </KeyboardAvoidingView>

            {/* Floating Action Buttons */}
            <View
                position="absolute"
                bottom={0}
                left={0}
                right={0}
                padding={SPACING.md}
                paddingBottom={insets.bottom || SPACING.md}
                backgroundColor="$background"
                borderTopWidth={1}
                borderTopColor="$borderColor"
                shadowColor="$shadowColor"
                shadowOffset={{ width: 0, height: -2 }}
                shadowOpacity={0.1}
                shadowRadius={4}
                elevation={4}
            >
                {id !== '0' ? (
                    // Edit mode: show both Cancel and Update buttons
                    <XStack space={SPACING.sm}>
                        <Button
                            size="$4"
                            variant="outlined"
                            onPress={() => {
                                resetData();
                                router.dismiss();
                            }}
                            fontSize={TYPOGRAPHY.sizes.md}
                            fontWeight={TYPOGRAPHY.weights.bold}
                            borderRadius={BORDER_RADIUS.md}
                            flex={1}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="$4"
                            onPress={updateContact}
                            backgroundColor="$blue9"
                            color="white"
                            fontSize={TYPOGRAPHY.sizes.md}
                            fontWeight={TYPOGRAPHY.weights.bold}
                            borderRadius={BORDER_RADIUS.md}
                            flex={1}
                        >
                            Update Contact
                        </Button>
                    </XStack>
                ) : (
                    // Add mode: show only Add Contact button
                    <Button
                        size="$4"
                        onPress={postNewContact}
                        backgroundColor="$blue9"
                        color="white"
                        fontSize={TYPOGRAPHY.sizes.md}
                        fontWeight={TYPOGRAPHY.weights.bold}
                        borderRadius={BORDER_RADIUS.md}
                    >
                        Add Contact
                    </Button>
                )}
            </View>
        </View>
    );
}
