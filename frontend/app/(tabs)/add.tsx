import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Pressable, Alert } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Months } from '@/constants/Definitions';
import { Text, View, XStack, YStack, Button, Input, Avatar, Switch } from 'tamagui';
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

const TEAL = '#14B8A6';

export default function AddContactPage() {
    const params = useLocalSearchParams<{ id?: string }>();
    const id = params.id ?? "0";

    const [errorMessage, setErrorMessage] = React.useState('');
    const queryClient = useQueryClient();

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

    const insets = useSafeAreaInsets();
    const ref = React.useRef<CustomPlacesAutocompleteRef>(null);
    const tagRef = React.useRef<CustomTagsAutocompleteRef>(null);
    const [date, setDate] = React.useState(() => new Date());
    const [show, setShow] = React.useState(false);
    const { token, setToken } = useAuth();

    const addSocial = () => {
        if (newSocial.label && newSocial.address) {
            setSocials([...socials, newSocial]);
            setNewSocial({ label: '', address: '' });
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

    const handleOpenNewSocialPress = () => setOpenNewSocial(true);
    const handleCloseNewSocialPress = () => setOpenNewSocial(false);

    const addTag = () => {
        const trimmedTag = newTag.trim();
        if (trimmedTag && !tags.includes(trimmedTag)) {
            setTags([...tags, trimmedTag]);
            setNewTag('');
            tagRef.current?.setTagText('');
        }
    };

    const handleTagSuggestionPress = (tag: string) => setNewTag(tag);

    const removeTag = (index) => {
        setTags(tags.filter((_, i) => i !== index));
    };

    const selectImage = async () => {
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
            setProfileImageURI(result.assets[0].uri);
        }
    };

    const uploadContactPicture = async () => {
        if (!selectedImage) return "";
        const newImageUri = "file:///" + selectedImage.uri.split("file:/").join("");
        const contentType = mime.getType(newImageUri);
        const response = await axios.post(getS3UploadURL, { user_token: token, filetype: contentType });
        if (response.status != 200) return "";
        const upload_url = response.data["upload_url"];
        const new_filename = response.data["filename"];
        const localFileRes = await fetch(newImageUri);
        const blob = await localFileRes.blob();
        const uploadRes = await fetch(upload_url, {
            method: "PUT",
            headers: { "Content-Type": contentType },
            body: blob,
        });
        if (uploadRes.ok) return new_filename;
        setErrorMessage("Failed to upload contact image");
        return "";
    };

    const onChangeRemindPeriod = (weeks, months) => {
        setRemindPeriodWks(weeks);
        setRemindPeriodMos(months);
    };

    const router = useRouter();

    const { data: existingContact, isLoading: loadingContact } = useQuery({
        queryKey: queryKeys.contact(id as string),
        queryFn: async () => {
            const response = await axios.post(getContactByIdURL, { user_token: token, contact_id: id });
            return response.data;
        },
        enabled: id !== '0',
    });

    React.useEffect(() => {
        if (existingContact) setDataFromContact(existingContact);
        return () => { resetData(); };
    }, [existingContact]);

    const loading = id !== '0' ? loadingContact : false;

    const onChange = (selectedDate) => setDate(selectedDate);
    const showDatepicker = () => setShow(true);

    const resetData = () => {
        onChangeFullname(""); onChangeLocation(""); ref.current?.setAddressText('');
        onChangeBio(""); onChangeMetThrough(""); setSocials([]);
        setNewSocial({ label: '', address: '' }); setRemindPeriodWks(0); setRemindPeriodMos(1);
        setEnableContactFrequency(true); setInitialFrequencyType('months'); setInitialFrequencyValue(1);
        setTags([]); setDate(new Date()); setSelectedImage(null); setProfileImageURI(null);
    };

    const setDataFromContact = (contact) => {
        onChangeFullname(contact.fullname); onChangeLocation(contact.location);
        ref.current?.setAddressText(contact.location);
        onChangeBio(contact.userbio); onChangeMetThrough(contact.metthrough);
        setSocials(contact.socials); setNewSocial({ label: '', address: '' });
        const hasReminderPeriod = contact.remind_in_weeks != null || contact.remind_in_months != null;
        setEnableContactFrequency(hasReminderPeriod);
        setRemindPeriodWks(contact.remind_in_weeks || 0);
        setRemindPeriodMos(contact.remind_in_months || 1);
        if (contact.remind_in_weeks && !contact.remind_in_months) {
            setInitialFrequencyType('weeks'); setInitialFrequencyValue(contact.remind_in_weeks);
        } else if (contact.remind_in_months && !contact.remind_in_weeks) {
            setInitialFrequencyType('months'); setInitialFrequencyValue(contact.remind_in_months);
        } else {
            setInitialFrequencyType('months');
        }
        setTags(contact.tags);
        let dateStr = contact.lastcontact.replace(',', '');
        const newDate = parse(dateStr, 'dd MMM yyyy', new Date());
        setDate(!isNaN(newDate.getTime()) ? newDate : new Date());
        setSelectedImage(null); setProfileImageURI(contact.profile_pic_url);
    };

    const buildContactPayload = (imageObjectKey: string) => ({
        fullname, location, userbio: bio, metthrough: metThrough, socials,
        lastcontact: formatDateForAPI(date),
        reminderPeriod: {
            weeks: enableContactFrequency ? remindPeriodWks : null,
            months: enableContactFrequency ? remindPeriodMos : null,
        },
        tags, image_object_key: imageObjectKey,
    });

    const createMutation = useMutation({
        mutationFn: async () => {
            const imageObjectKey = await uploadContactPicture();
            const response = await axios.post(addContactForUserURL, {
                user_token: token, newContact: buildContactPayload(imageObjectKey),
            });
            return response.data;
        },
        onSuccess: async (newId) => {
            await resetData();
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
            router.push(`/contact/${newId}`);
        },
        onError: () => setErrorMessage("Failed to upload new contact details"),
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
        onError: () => setErrorMessage("Failed to update contact details"),
    });

    const submitting = createMutation.isPending || updateMutation.isPending;

    const postNewContact = () => {
        if (!fullname) { setErrorMessage("Cannot create a contact without a name"); return; }
        createMutation.mutate();
    };

    const updateContact = () => {
        if (!fullname) { setErrorMessage("Cannot update a contact without a name"); return; }
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
                <YStack paddingVertical={SPACING.md}>
                    {errorMessage ? (
                        <Text color="$red9" paddingHorizontal={SPACING.md} marginBottom={SPACING.sm}>
                            {errorMessage}
                        </Text>
                    ) : null}

                    {/* Profile Picture */}
                    <YStack alignItems="center" paddingVertical={SPACING.lg} gap={SPACING.sm}>
                        <Pressable onPress={selectImage}>
                            <View position="relative">
                                <Avatar circular size="$10">
                                    {profileImageURI ? (
                                        <Avatar.Image accessibilityLabel={fullname} src={profileImageURI} />
                                    ) : (
                                        <Avatar.Fallback backgroundColor="$color3" alignItems="center" justifyContent="center">
                                            <UserIcon size={24} color="gray" />
                                        </Avatar.Fallback>
                                    )}
                                </Avatar>
                                <View
                                    position="absolute" bottom={0} right={0}
                                    backgroundColor={TEAL} borderRadius={20}
                                    width={32} height={32}
                                    alignItems="center" justifyContent="center"
                                    borderWidth={2} borderColor="$background"
                                >
                                    <CameraIcon size={16} color="white" />
                                </View>
                            </View>
                        </Pressable>
                        <Text fontSize={TYPOGRAPHY.sizes.sm} color="$gray10">
                            Tap to {selectedImage ? 'change' : 'add'} photo
                        </Text>
                    </YStack>

                    {/* Name */}
                    <YStack backgroundColor="$background" borderRadius={12} marginHorizontal={SPACING.md} marginBottom={SPACING.sm} borderWidth={1} borderColor="$borderColor" overflow="hidden">
                        <Text fontSize={11} fontWeight="600" color="$gray9" textTransform="uppercase" letterSpacing={0.8} paddingHorizontal={SPACING.md} paddingTop={SPACING.md} paddingBottom={SPACING.xs}>Name</Text>
                        <Input
                            size="$4" value={fullname} onChangeText={onChangeFullname}
                            placeholder="Full name" textContentType="name"
                            fontSize={TYPOGRAPHY.sizes.md} borderWidth={0}
                            backgroundColor="transparent" paddingHorizontal={SPACING.md} paddingBottom={SPACING.sm}
                        />
                    </YStack>

                    {/* Location */}
                    <YStack backgroundColor="$background" borderRadius={12} marginHorizontal={SPACING.md} marginBottom={SPACING.sm} borderWidth={1} borderColor="$borderColor" zIndex={10}>
                        <Text fontSize={11} fontWeight="600" color="$gray9" textTransform="uppercase" letterSpacing={0.8} paddingHorizontal={SPACING.md} paddingTop={SPACING.md} paddingBottom={SPACING.xs}>Location</Text>
                        <CustomPlacesAutocomplete
                            predefinedPlaces={[]}
                            textInputProps={{ style: { fontSize: TYPOGRAPHY.sizes.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm } }}
                            styles={{
                                container: { flex: 0 },
                                textInput: { borderWidth: 0, backgroundColor: 'transparent', paddingHorizontal: SPACING.md },
                                listView: { borderRadius: BORDER_RADIUS.md },
                            }}
                            placeholder="City, state or country"
                            onPress={(data) => onChangeLocation(data.description)}
                            disableScroll={true}
                            ref={ref}
                        />
                    </YStack>

                    {/* How You Met */}
                    <YStack backgroundColor="$background" borderRadius={12} marginHorizontal={SPACING.md} marginBottom={SPACING.sm} borderWidth={1} borderColor="$borderColor" overflow="hidden">
                        <Text fontSize={11} fontWeight="600" color="$gray9" textTransform="uppercase" letterSpacing={0.8} paddingHorizontal={SPACING.md} paddingTop={SPACING.md} paddingBottom={SPACING.xs}>How you met</Text>
                        <Input
                            value={metThrough} onChangeText={onChangeMetThrough}
                            placeholder="Where or how did you meet?"
                            multiline size="$4" textAlignVertical="top" minHeight={60}
                            borderWidth={0} backgroundColor="transparent"
                            paddingHorizontal={SPACING.md} paddingBottom={SPACING.sm}
                        />
                    </YStack>

                    {/* Notes */}
                    <YStack backgroundColor="$background" borderRadius={12} marginHorizontal={SPACING.md} marginBottom={SPACING.sm} borderWidth={1} borderColor="$borderColor" overflow="hidden">
                        <Text fontSize={11} fontWeight="600" color="$gray9" textTransform="uppercase" letterSpacing={0.8} paddingHorizontal={SPACING.md} paddingTop={SPACING.md} paddingBottom={SPACING.xs}>Notes</Text>
                        <Input
                            value={bio} onChangeText={onChangeBio}
                            placeholder="Notes about this person"
                            multiline size="$4" textAlignVertical="top" minHeight={80}
                            borderWidth={0} backgroundColor="transparent"
                            paddingHorizontal={SPACING.md} paddingBottom={SPACING.sm}
                        />
                    </YStack>

                    {/* Contact Schedule */}
                    <YStack backgroundColor="$background" borderRadius={12} marginHorizontal={SPACING.md} marginBottom={SPACING.sm} borderWidth={1} borderColor="$borderColor">
                        <Text fontSize={11} fontWeight="600" color="$gray9" textTransform="uppercase" letterSpacing={0.8} paddingHorizontal={SPACING.md} paddingTop={SPACING.md} paddingBottom={SPACING.xs}>Contact Schedule</Text>
                        <YStack paddingHorizontal={SPACING.md} paddingBottom={SPACING.md} gap={SPACING.md}>
                            <YStack gap={SPACING.xs}>
                                <Text fontSize={TYPOGRAPHY.sizes.sm} fontWeight={TYPOGRAPHY.weights.medium} color="$gray10">Last Contact</Text>
                                <DatePickerModal value={date} onChange={onChange} />
                            </YStack>
                            <YStack gap={SPACING.xs}>
                                <XStack justifyContent="space-between" alignItems="center">
                                    <Text fontSize={TYPOGRAPHY.sizes.sm} fontWeight={TYPOGRAPHY.weights.medium} color="$gray10">Contact Every</Text>
                                    <Switch size="$2" checked={enableContactFrequency} onCheckedChange={setEnableContactFrequency}>
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
                    </YStack>

                    {/* Tags */}
                    <YStack backgroundColor="$background" borderRadius={12} marginHorizontal={SPACING.md} marginBottom={SPACING.sm} borderWidth={1} borderColor="$borderColor" zIndex={5}>
                        <Text fontSize={11} fontWeight="600" color="$gray9" textTransform="uppercase" letterSpacing={0.8} paddingHorizontal={SPACING.md} paddingTop={SPACING.md} paddingBottom={SPACING.xs}>Tags</Text>
                        <YStack paddingHorizontal={SPACING.md} paddingBottom={SPACING.md} gap={SPACING.sm}>
                            {tags.length > 0 && (
                                <XStack flexWrap="wrap" gap={SPACING.xs}>
                                    {tags.map((tag, index) => (
                                        <XStack key={index} alignItems="center" gap={4}
                                            style={{ backgroundColor: 'rgba(20,184,166,0.1)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(20,184,166,0.25)' }}
                                        >
                                            <Text style={{ fontSize: 12, color: TEAL, fontWeight: '500' }}>{tag}</Text>
                                            <Pressable onPress={() => removeTag(index)}>
                                                <XIcon size={11} color={TEAL} />
                                            </Pressable>
                                        </XStack>
                                    ))}
                                </XStack>
                            )}
                            <XStack gap={SPACING.xs} alignItems="center">
                                <View flex={1}>
                                    <CustomTagsAutocomplete
                                        placeholder="Add a tag"
                                        value={newTag} onChangeText={setNewTag}
                                        onPress={handleTagSuggestionPress}
                                        token={token} ref={tagRef}
                                        textInputProps={{ style: { fontSize: TYPOGRAPHY.sizes.sm, height: 36, paddingHorizontal: 0 } }}
                                        styles={{ container: { flex: 0 }, textInput: { borderWidth: 0, backgroundColor: 'transparent' } }}
                                        disableScroll={true}
                                    />
                                </View>
                                <Button size="$2" onPress={addTag} backgroundColor={TEAL} color="white" minWidth={36} minHeight={36}>
                                    <PlusIcon size={14} />
                                </Button>
                            </XStack>
                        </YStack>
                    </YStack>

                    {/* Contact Info */}
                    <YStack backgroundColor="$background" borderRadius={12} marginHorizontal={SPACING.md} marginBottom={SPACING.sm} borderWidth={1} borderColor="$borderColor" overflow="hidden">
                        <Text fontSize={11} fontWeight="600" color="$gray9" textTransform="uppercase" letterSpacing={0.8} paddingHorizontal={SPACING.md} paddingTop={SPACING.md} paddingBottom={SPACING.xs}>Contact Info</Text>
                        <YStack paddingHorizontal={SPACING.md} paddingBottom={SPACING.md} gap={SPACING.xs}>
                            {socials.map((social, index) => (
                                <XStack key={index} paddingVertical={SPACING.xs} alignItems="center" gap={SPACING.xs}
                                    borderTopWidth={index === 0 ? 0 : 1} borderTopColor="$borderColor"
                                >
                                    <YStack flex={1} gap={SPACING.xs}>
                                        <Input
                                            value={social.label} onChangeText={(text) => editSocial(index, 'label', text)}
                                            placeholder="Platform" size="$3" fontSize={TYPOGRAPHY.sizes.sm} height={38}
                                            borderWidth={0} backgroundColor="transparent" paddingHorizontal={0}
                                        />
                                        <Input
                                            value={social.address} onChangeText={(text) => editSocial(index, 'address', text)}
                                            placeholder="Handle, URL or phone" size="$3" fontSize={TYPOGRAPHY.sizes.sm} height={38}
                                            borderWidth={0} backgroundColor="transparent" paddingHorizontal={0}
                                        />
                                    </YStack>
                                    <Button size="$2" variant="ghost" onPress={() => removeSocial(index)}
                                        padding={SPACING.xs} minWidth={32} minHeight={32} backgroundColor="transparent">
                                        <XIcon size={16} color="$red10" />
                                    </Button>
                                </XStack>
                            ))}

                            {openNewSocial && (
                                <YStack paddingVertical={SPACING.xs} gap={SPACING.md}
                                    borderTopWidth={socials.length > 0 ? 1 : 0} borderTopColor="$borderColor"
                                >
                                    <XStack gap={SPACING.sm} alignItems="flex-end">
                                        <YStack flex={1} gap={SPACING.md}>
                                            <YStack gap={SPACING.xs}>
                                                <Text fontSize={11} fontWeight="600" color="$gray9" textTransform="uppercase" letterSpacing={0.8}>Platform</Text>
                                                <Input
                                                    placeholder="e.g. Twitter, LinkedIn"
                                                    value={newSocial.label}
                                                    onChangeText={(text) => setNewSocial({ ...newSocial, label: text })}
                                                    size="$3" fontSize={TYPOGRAPHY.sizes.sm} height={38}
                                                    borderWidth={0} borderBottomWidth={1} borderBottomColor="$borderColor"
                                                    backgroundColor="transparent" paddingHorizontal={0} borderRadius={0}
                                                />
                                            </YStack>
                                            <YStack gap={SPACING.xs}>
                                                <Text fontSize={11} fontWeight="600" color="$gray9" textTransform="uppercase" letterSpacing={0.8}>Contact Info</Text>
                                                <Input
                                                    placeholder="Handle, URL, phone…"
                                                    value={newSocial.address}
                                                    onChangeText={(text) => setNewSocial({ ...newSocial, address: text })}
                                                    size="$3" fontSize={TYPOGRAPHY.sizes.sm} height={38}
                                                    borderWidth={0} borderBottomWidth={1} borderBottomColor="$borderColor"
                                                    backgroundColor="transparent" paddingHorizontal={0} borderRadius={0}
                                                />
                                            </YStack>
                                        </YStack>
                                        <YStack gap={SPACING.xs}>
                                            <Button size="$2" onPress={addSocial} backgroundColor={TEAL} color="white" minWidth={50}>
                                                <PlusIcon size={14} />
                                            </Button>
                                            <Button size="$2" variant="outlined" onPress={handleCloseNewSocialPress} minWidth={60}>
                                                Cancel
                                            </Button>
                                        </YStack>
                                    </XStack>
                                </YStack>
                            )}

                            {!openNewSocial && (
                                <Button
                                    onPress={handleOpenNewSocialPress} variant="ghost" size="$3"
                                    color={TEAL} backgroundColor="transparent" alignSelf="flex-start" paddingHorizontal={0}
                                    borderTopWidth={socials.length > 0 ? 1 : 0} borderTopColor="$borderColor"
                                >
                                    + Add Contact Method
                                </Button>
                            )}
                        </YStack>
                    </YStack>

                    {/* Action Buttons */}
                    <YStack
                        paddingTop={SPACING.lg} paddingHorizontal={SPACING.md}
                        paddingBottom={insets.bottom + SPACING.md}
                        borderTopWidth={1} borderTopColor="$borderColor"
                        backgroundColor="$background" marginTop={SPACING.sm}
                    >
                        {id !== '0' ? (
                            <XStack gap={SPACING.sm}>
                                <Button
                                    size="$4" variant="outlined"
                                    onPress={() => { resetData(); router.dismiss(); }}
                                    disabled={submitting}
                                    fontSize={TYPOGRAPHY.sizes.md} fontWeight={TYPOGRAPHY.weights.bold}
                                    borderRadius={BORDER_RADIUS.md} flex={1}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="$4" onPress={updateContact} disabled={submitting}
                                    backgroundColor={TEAL} color="white"
                                    fontSize={TYPOGRAPHY.sizes.md} fontWeight={TYPOGRAPHY.weights.bold}
                                    borderRadius={BORDER_RADIUS.md} flex={1}
                                >
                                    {submitting ? 'Saving...' : 'Update Contact'}
                                </Button>
                            </XStack>
                        ) : (
                            <Button
                                size="$4" onPress={postNewContact} disabled={submitting}
                                backgroundColor={TEAL} color="white"
                                fontSize={TYPOGRAPHY.sizes.md} fontWeight={TYPOGRAPHY.weights.bold}
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
