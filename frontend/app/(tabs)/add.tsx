import React from 'react';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';

import { TextInput, Pressable, Alert } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Months } from '@/constants/Definitions';
import { Text, View, Group, Separator, XStack, YStack, Button, Paragraph, Input, Avatar, Switch, Label } from 'tamagui';
import { addContactForUserURL, getContactByIdURL, updateContactForUserURL, getS3UploadURL } from '@/constants/Apis';
import axios from 'axios';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/QueryKeys';
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
import { DatePickerModal } from '@/components/DatePickerModal';

export default function AddContactPage() {
    const params = useLocalSearchParams<{ id?: string }>();
    const id = params.id ?? "0";

    const [errorMessage, setErrorMessage] = React.useState('');
    const queryClient = useQueryClient();

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
            return "";
        }

        const newImageUri = "file:///" + selectedImage.uri.split("file:/").join("");
        const contentType = mime.getType(newImageUri);
        
        // Get signed s3 url for this picture from backend
        const requestBody = {
            user_token: token,
            filetype: contentType
        }


        const response = await axios.post(getS3UploadURL, requestBody);
        
        if (response.status != 200) {
            return "";
        }

        const upload_url = response.data["upload_url"]
        const new_filename = response.data["filename"]


        // Read file into a blob
        const localFileRes = await fetch(newImageUri);
        const blob = await localFileRes.blob();
        // Upload with PUT to S3 - use the same content type as sent to backend
        const uploadRes = await fetch(upload_url, {
            method: "PUT",
            headers: { "Content-Type": contentType },
            body: blob,
        });

        if (uploadRes.ok) {
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
    }

    const router = useRouter();

    const { data: existingContact, isLoading: loadingContact } = useQuery({
        queryKey: queryKeys.contact(id as string),
        queryFn: async () => {
            const response = await axios.post(getContactByIdURL, {
                user_token: token,
                contact_id: id,
            });
            return response.data;
        },
        enabled: id !== '0',
    });

    // Populate form fields when existing contact data arrives
    React.useEffect(() => {
        if (existingContact) {
            setDataFromContact(existingContact);
        }
        return () => {
            resetData();
        };
    }, [existingContact]);

    // Set loading=false immediately for add mode (no fetch needed)
    const loading = id !== '0' ? loadingContact : false;

    const onChange = (selectedDate) => {
        setDate(selectedDate);
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


        // Set initial frequency type based on which value is given
        if (contact.remind_in_weeks && !contact.remind_in_months) {
            setInitialFrequencyType('weeks');
            setInitialFrequencyValue(contact.remind_in_weeks);
        } else if (contact.remind_in_months && !contact.remind_in_weeks) {
            setInitialFrequencyType('months');
            setInitialFrequencyValue(contact.remind_in_months);
        } else {
            setInitialFrequencyType('months'); // Default to months
        }

        setTags(contact.tags);
        let dateStr = contact.lastcontact.replace(',', '');  // "17 Apr 2025"
        // const newDate = new Date(dateStr);
        const newDate = parse(dateStr, 'dd MMM yyyy', new Date());
        if (!isNaN(newDate.getTime())) {
            setDate(newDate);
        } else {
            console.error('Invalid date, using today as fallback');
            setDate(new Date());
        }
        setSelectedImage(null); 
        setProfileImageURI(contact.profile_pic_url);
    }

    //================================
    // Sending this contact to backend
    //================================

    const buildContactPayload = (imageObjectKey: string) => ({
        fullname,
        location,
        userbio: bio,
        metthrough: metThrough,
        socials,
        lastcontact: formatDateForAPI(date),
        reminderPeriod: {
            weeks: enableContactFrequency ? remindPeriodWks : null,
            months: enableContactFrequency ? remindPeriodMos : null,
        },
        tags,
        image_object_key: imageObjectKey,
    });

    const createMutation = useMutation({
        mutationFn: async () => {
            const imageObjectKey = await uploadContactPicture();
            const response = await axios.post(addContactForUserURL, {
                user_token: token,
                newContact: buildContactPayload(imageObjectKey),
            });
            return response.data;
        },
        onSuccess: async (newId) => {
            await resetData();
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
            router.push(`/contact/${newId}`);
        },
        onError: () => {
            setErrorMessage("Failed to upload new contact details");
        },
    });

    const updateMutation = useMutation({
        mutationFn: async () => {
            const imageObjectKey = await uploadContactPicture();
            const response = await axios.post(updateContactForUserURL, {
                user_token: token,
                newContact: { contact_id: id as string, ...buildContactPayload(imageObjectKey) },
            });
            return response.data;
        },
        onSuccess: async () => {
            await resetData();
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
            queryClient.invalidateQueries({ queryKey: queryKeys.contact(id as string) });
            router.dismiss();
        },
        onError: () => {
            setErrorMessage("Failed to update contact details");
        },
    });

    const submitting = createMutation.isPending || updateMutation.isPending;

    const postNewContact = () => {
        if (!fullname) {
            setErrorMessage("Cannot create a contact without a name");
            return;
        }
        createMutation.mutate();
    };

    const updateContact = () => {
        if (!fullname) {
            setErrorMessage("Cannot update a contact without a name");
            return;
        }
        updateMutation.mutate();
    };

    return (
        <View style={CONTAINER_STYLES.screen} backgroundColor="$background">
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
            <KeyboardAwareScrollView
                enableOnAndroid={true}
                enableAutomaticScroll={true}
                extraScrollHeight={20}
                keyboardOpeningTime={0}
                enableResetScrollToCoords={false}
                contentContainerStyle={{ paddingBottom: SPACING.md }}
            >
            <YStack space={SPACING.lg} padding={SPACING.lg}>
                {errorMessage ? <Text color="$red9">{errorMessage}</Text> : null}
                {/* Profile Picture Section */}
                <YStack
                    space={SPACING.md}
                    paddingVertical={SPACING.md}
                    alignItems="center"
                >
                    <Text
                        fontSize={TYPOGRAPHY.sizes.xs}
                        fontWeight={TYPOGRAPHY.weights.medium}
                        color="$gray12"
                        textTransform="uppercase"
                        letterSpacing={0.5}
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

                {/* Name */}
                <YStack paddingVertical={SPACING.md} borderTopWidth={1} borderTopColor="$borderColor" space={SPACING.xs}>
                    <Text
                        fontSize={TYPOGRAPHY.sizes.xs}
                        fontWeight={TYPOGRAPHY.weights.medium}
                        color="$gray12"
                        textTransform="uppercase"
                        letterSpacing={0.5}
                    >
                        Name
                    </Text>
                    <Input
                        size="$4"
                        value={fullname}
                        onChangeText={onChangeFullname}
                        placeholder="Enter full name"
                        textContentType='name'
                        fontSize={TYPOGRAPHY.sizes.md}
                        borderWidth={0}
                        backgroundColor="transparent"
                        paddingHorizontal={0}
                    />
                </YStack>

                {/* Location */}
                <YStack paddingVertical={SPACING.md} borderTopWidth={1} borderTopColor="$borderColor" space={SPACING.xs} zIndex={10}>
                    <Text
                        fontSize={TYPOGRAPHY.sizes.xs}
                        fontWeight={TYPOGRAPHY.weights.medium}
                        color="$gray12"
                        textTransform="uppercase"
                        letterSpacing={0.5}
                    >
                        Location
                    </Text>
                    <CustomPlacesAutocomplete
                        predefinedPlaces={[]}
                        textInputProps={{
                            style: {
                                fontSize: TYPOGRAPHY.sizes.md,
                                paddingHorizontal: 0,
                                paddingVertical: SPACING.xs,
                            }
                        }}
                        styles={{
                            container: { flex: 0 },
                            textInput: {
                                borderWidth: 0,
                                backgroundColor: 'transparent',
                                paddingHorizontal: 0,
                            },
                            listView: {
                                borderRadius: BORDER_RADIUS.md,
                            }
                        }}
                        placeholder='Enter location'
                        onPress={(data, details = null) => {
                            onChangeLocation(data.description);
                        }}
                        disableScroll={true}
                        ref={ref}
                    />
                </YStack>

                {/* How You Met */}
                <YStack paddingVertical={SPACING.md} borderTopWidth={1} borderTopColor="$borderColor" space={SPACING.xs}>
                    <Text
                        fontSize={TYPOGRAPHY.sizes.xs}
                        fontWeight={TYPOGRAPHY.weights.medium}
                        color="$gray12"
                        textTransform="uppercase"
                        letterSpacing={0.5}
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
                        borderWidth={0}
                        backgroundColor="transparent"
                        paddingHorizontal={0}
                    />
                </YStack>

                {/* Notes */}
                <YStack paddingVertical={SPACING.md} borderTopWidth={1} borderTopColor="$borderColor" space={SPACING.xs}>
                    <Text
                        fontSize={TYPOGRAPHY.sizes.xs}
                        fontWeight={TYPOGRAPHY.weights.medium}
                        color="$gray12"
                        textTransform="uppercase"
                        letterSpacing={0.5}
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
                        borderWidth={0}
                        backgroundColor="transparent"
                        paddingHorizontal={0}
                    />
                </YStack>

                {/* Contact Frequency */}
                <YStack
                    space={SPACING.md}
                    paddingVertical={SPACING.md}
                    borderTopWidth={1}
                    borderTopColor="$borderColor"
                >
                    <Text
                        fontSize={TYPOGRAPHY.sizes.xs}
                        fontWeight={TYPOGRAPHY.weights.medium}
                        color="$gray12"
                        textTransform="uppercase"
                        letterSpacing={0.5}
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
                        <DatePickerModal
                            value={date}
                            onChange={onChange}
                        />
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
                    paddingVertical={SPACING.md}
                    borderTopWidth={1}
                    borderTopColor="$borderColor"
                    space={SPACING.sm}
                >
                    <Text
                        fontSize={TYPOGRAPHY.sizes.xs}
                        fontWeight={TYPOGRAPHY.weights.medium}
                        color="$gray12"
                        textTransform="uppercase"
                        letterSpacing={0.5}
                    >
                        Tags
                    </Text>

                    {tags.length > 0 && (
                        <XStack flexWrap="wrap" gap={SPACING.xs}>
                            {tags.map((tag, index) => (
                                <XStack
                                    key={index}
                                    alignItems="center"
                                    backgroundColor="$gray3"
                                    borderRadius={BORDER_RADIUS.xs}
                                    paddingHorizontal={SPACING.xs}
                                    paddingVertical={2}
                                >
                                    <Text
                                        fontSize={TYPOGRAPHY.sizes.xs}
                                        color="$gray11"
                                        marginRight={4}
                                    >
                                        {tag}
                                    </Text>
                                    <Pressable onPress={() => removeTag(index)}>
                                        <XIcon size={12} color="$gray9" />
                                    </Pressable>
                                </XStack>
                            ))}
                        </XStack>
                    )}

                    {/* Add New Tag */}
                    <XStack space={SPACING.xs} alignItems="center">
                        <View flex={1}>
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
                                        paddingHorizontal: SPACING.sm,
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

                {/* Contact Info Section */}
                <YStack
                    paddingVertical={SPACING.md}
                    borderTopWidth={1}
                    borderTopColor="$borderColor"
                    space={SPACING.xs}
                >
                    <Text
                        fontSize={TYPOGRAPHY.sizes.xs}
                        fontWeight={TYPOGRAPHY.weights.medium}
                        color="$gray12"
                        textTransform="uppercase"
                        letterSpacing={0.5}
                    >
                        Contact Info
                    </Text>

                    {socials.map((social, index) => (
                        <React.Fragment key={index}>
                            <Separator marginVertical={SPACING.xs} />
                            <XStack
                                paddingVertical={SPACING.sm}
                                alignItems="center"
                                space={SPACING.xs}
                            >
                                <YStack flex={1} space={SPACING.xs}>
                                    <Input
                                        value={social.label}
                                        onChangeText={(text) => editSocial(index, 'label', text)}
                                        placeholder="Platform"
                                        size="$3"
                                        fontSize={TYPOGRAPHY.sizes.sm}
                                        height={38}
                                        borderWidth={0}
                                        backgroundColor="transparent"
                                        paddingHorizontal={0}
                                    />
                                    <Input
                                        value={social.address}
                                        onChangeText={(text) => editSocial(index, 'address', text)}
                                        placeholder="Contact info"
                                        size="$3"
                                        fontSize={TYPOGRAPHY.sizes.sm}
                                        height={38}
                                        borderWidth={0}
                                        backgroundColor="transparent"
                                        paddingHorizontal={0}
                                    />
                                </YStack>
                                <Button
                                    size="$2"
                                    variant="ghost"
                                    onPress={() => removeSocial(index)}
                                    padding={SPACING.xs}
                                    minWidth={32}
                                    minHeight={32}
                                    backgroundColor="transparent"
                                >
                                    <XIcon size={16} color="$red10" />
                                </Button>
                            </XStack>
                        </React.Fragment>
                    ))}

                    {openNewSocial && (
                        <>
                            <Separator marginVertical={SPACING.xs} />
                            <YStack paddingVertical={SPACING.xs} space={SPACING.md}>
                                <XStack space={SPACING.sm} alignItems="center">
                                    <YStack flex={1} space={SPACING.md}>
                                        <YStack space={SPACING.xs}>
                                            <Text
                                                fontSize={TYPOGRAPHY.sizes.xs}
                                                fontWeight={TYPOGRAPHY.weights.medium}
                                                color="$gray12"
                                                textTransform="uppercase"
                                                letterSpacing={0.5}
                                            >
                                                Platform
                                            </Text>
                                            <Input
                                                placeholder="e.g. Twitter, LinkedIn"
                                                value={newSocial.label}
                                                onChangeText={(text) => setNewSocial({ ...newSocial, label: text })}
                                                size="$3"
                                                fontSize={TYPOGRAPHY.sizes.sm}
                                                height={38}
                                                borderWidth={0}
                                                borderBottomWidth={1}
                                                borderBottomColor="$borderColor"
                                                backgroundColor="transparent"
                                                paddingHorizontal={0}
                                                borderRadius={0}
                                            />
                                        </YStack>
                                        <YStack space={SPACING.xs}>
                                            <Text
                                                fontSize={TYPOGRAPHY.sizes.xs}
                                                fontWeight={TYPOGRAPHY.weights.medium}
                                                color="$gray12"
                                                textTransform="uppercase"
                                                letterSpacing={0.5}
                                            >
                                                Contact Info
                                            </Text>
                                            <Input
                                                placeholder="Handle, URL, phone number…"
                                                value={newSocial.address}
                                                onChangeText={(text) => setNewSocial({ ...newSocial, address: text })}
                                                size="$3"
                                                fontSize={TYPOGRAPHY.sizes.sm}
                                                height={38}
                                                borderWidth={0}
                                                borderBottomWidth={1}
                                                borderBottomColor="$borderColor"
                                                backgroundColor="transparent"
                                                paddingHorizontal={0}
                                                borderRadius={0}
                                            />
                                        </YStack>
                                    </YStack>
                                    <YStack space={SPACING.xs}>
                                        <Button
                                            size="$2"
                                            onPress={addSocial}
                                            backgroundColor="$blue9"
                                            color="white"
                                            minWidth={50}
                                        >
                                            <PlusIcon size={14} />
                                        </Button>
                                        <Button
                                            size="$2"
                                            variant="outlined"
                                            onPress={handleCloseNewSocialPress}
                                            minWidth={60}
                                        >
                                            Cancel
                                        </Button>
                                    </YStack>
                                </XStack>
                            </YStack>
                        </>
                    )}

                    {!openNewSocial && (
                        <>
                            <Separator marginVertical={SPACING.xs} />
                            <Button
                                onPress={handleOpenNewSocialPress}
                                variant="ghost"
                                size="$3"
                                color="$blue9"
                                backgroundColor="transparent"
                                alignSelf="flex-start"
                                paddingHorizontal={0}
                            >
                                + Add Contact Method
                            </Button>
                        </>
                    )}
                </YStack>

                {/* Action Buttons - Moved inside scroll view to rise above keyboard */}
                <YStack
                    paddingTop={SPACING.lg}
                    paddingHorizontal={SPACING.md}
                    paddingBottom={insets.bottom + SPACING.md}
                    borderTopWidth={1}
                    borderTopColor="$borderColor"
                    backgroundColor="$background"
                    marginTop={SPACING.xl}
                >
                    {id !== '0' ? (
                        <XStack space={SPACING.sm}>
                            <Button
                                size="$4"
                                variant="outlined"
                                onPress={() => {
                                    resetData();
                                    router.dismiss();
                                }}
                                disabled={submitting}
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
                                disabled={submitting}
                                backgroundColor="$blue9"
                                color="white"
                                fontSize={TYPOGRAPHY.sizes.md}
                                fontWeight={TYPOGRAPHY.weights.bold}
                                borderRadius={BORDER_RADIUS.md}
                                flex={1}
                            >
                                {submitting ? 'Saving...' : 'Update Contact'}
                            </Button>
                        </XStack>
                    ) : (
                        <Button
                            size="$4"
                            onPress={postNewContact}
                            disabled={submitting}
                            backgroundColor="$blue9"
                            color="white"
                            fontSize={TYPOGRAPHY.sizes.md}
                            fontWeight={TYPOGRAPHY.weights.bold}
                            borderRadius={BORDER_RADIUS.md}
                        >
                            {submitting ? 'Adding...' : 'Add Contact'}
                        </Button>
                    )}
                </YStack>

            </YStack>
            </KeyboardAwareScrollView>
        </View>
    );
}
