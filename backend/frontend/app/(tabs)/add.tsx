import React from 'react';

import { TextInput, ScrollView, Pressable } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Months } from '@/constants/Definitions';
import { Text, View, Group, Separator, XStack, YStack, Button, Paragraph, Input } from 'tamagui';
import { addContactForUserURL, getContactByIdURL, updateContactForUserURL } from '@/constants/Apis';
import axios from 'axios';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useAuth } from '@/components/AuthContext';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { placesApiKey } from '@/constants/Secrets';
import { Plus as PlusIcon, X as XIcon } from '@tamagui/lucide-icons';
import { CommunicationFrequencySelector } from '@/components/CommunicationFrequencySelector';
import { SPACING, TYPOGRAPHY, CONTAINER_STYLES, BORDER_RADIUS } from '@/constants/Styles';

export default function AddContactPage() {
    const params = useLocalSearchParams<{ id?: string }>();
    const id = params.id ?? "0";

    console.log("Rendering add page with ID param =", id);

    const [loading,       setLoading]       = React.useState(true);

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
    const [tags,       setTags]       = React.useState([]);
    const [newTag,     setNewTag]          = React.useState('');

    // Extra location var
    const ref = React.useRef();

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
        if (newTag && !tags.includes(newTag)) {
            setTags([...tags, newTag]);
            setNewTag('');
        }
    }

    const removeTag = (index) => {
        setTags(tags.filter((_, i) => i !== index));
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
        setRemindPeriodMos(0);
        setTags([]);
        setDate(new Date());
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
        setRemindPeriodWks(contact.remind_in_weeks);
        setRemindPeriodMos(contact.remind_in_months);
        setTags(contact.tags);
        let dateStr = contact.lastcontact.replace(',', '');  // "17 Apr 2025"
        console.log(`Setting last contact date from value=${dateStr} with type=${typeof dateStr}`)
        const newDate = new Date(dateStr);
        console.log(`Casting that to date gives ${newDate}`)
        if (!isNaN(newDate.getTime())) {
            setDate(newDate);
        } else {
            console.error('Invalid date, using today as fallback');
            setDate(new Date());
        }
        console.log(`Set last contact date to value=${date}`)
    }

    //================================
    // Sending this contact to backend
    //================================

    // Send data to backend and redirect to contact page

    const postNewContact = async () => {
        // Contact data to be sent
        const requestBody = {
            user_token: token,
            newContact: {
                "fullname": fullname,
                "location": location,
                "userbio": bio,
                "metthrough": metThrough,
                "socials": socials,
                "lastcontact": date,
                "reminderPeriod": {
                    "weeks": remindPeriodWks,
                    "months": remindPeriodMos
                },
                "tags": tags
            }
        }

        console.log("Adding new user with details:", requestBody.newContact);

        try {
            const response = await axios.post(addContactForUserURL, requestBody)
            console.log(response.data)
            if (response.status == 200) {
                const redirectLink = "/contact/" + response.data;
                router.push(redirectLink);
            }

        }
        catch (error) {
            console.error("Error during add contact POST request:", error);
        }
    }

    // Update contact API call

    const updateContact = async () => {
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
                "lastcontact": date,
                "reminderPeriod": {
                    "weeks": remindPeriodWks,
                    "months": remindPeriodMos
                },
                "tags": tags
            }
        }
        
        console.log("Updating user to new details:", requestBody.newContact);

        try {
            const response = await axios.post(updateContactForUserURL, requestBody)
            console.log(response.data)
            if (response.status == 200) {
                const redirectLink = "/contact/" + response.data;
                router.replace(redirectLink);
            }

        }
        catch (error) {
            console.error("Error during add contact POST request:", error);
        }
    }

    const FrequencyOption = ['1 month', '3 months', '6 months', '1 year', 'custom'];
    
    return (
        <View style={CONTAINER_STYLES.screen}>
            <ScrollView 
                automaticallyAdjustKeyboardInsets={true} 
                keyboardShouldPersistTaps='always'
                contentContainerStyle={{ paddingBottom: 100 }}
            >
            <YStack space={SPACING.lg} padding={SPACING.lg}>
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
                        Full Name
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
                        <GooglePlacesAutocomplete
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
                            query={{
                                key: placesApiKey,
                                language: 'en',
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
                        numberOfLines={2}
                        size="$4"
                        textAlignVertical="top"
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
                        numberOfLines={4}
                        size="$4"
                        textAlignVertical="top"
                    />
                </YStack>
                {/* Contact Information */}
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
                        Contact Information
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
                                {show && (
                                    <DateTimePicker
                                        testID="dateTimePicker"
                                        value={date}
                                        mode="date"
                                        onChange={onChange}
                                    />
                                )}
                            </View>
                        </Pressable>
                    </YStack>
                    
                    {/* Contact Frequency */}
                    <YStack space={SPACING.xs}>
                        <Text 
                            fontSize={TYPOGRAPHY.sizes.sm}
                            fontWeight={TYPOGRAPHY.weights.medium}
                            color="$gray10"
                        >
                            Contact Every
                        </Text>
                        <CommunicationFrequencySelector 
                            items={FrequencyOption}
                            onChange={onChangeRemindPeriod}
                        />
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
                            <Input
                                flex={1}
                                placeholder="Add a tag"
                                value={newTag}
                                onChangeText={setNewTag}
                                size="$2"
                                height={36}
                                fontSize={TYPOGRAPHY.sizes.sm}
                            />
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
                        Social Media
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
            
            {/* Floating Submit Button */}
            <View
                position="absolute"
                bottom={0}
                left={0}
                right={0}
                padding={SPACING.md}
                backgroundColor="$background"
                borderTopWidth={1}
                borderTopColor="$borderColor"
                shadowColor="$shadowColor"
                shadowOffset={{ width: 0, height: -2 }}
                shadowOpacity={0.1}
                shadowRadius={4}
                elevation={4}
            >
                <Button
                    size="$4"
                    onPress={id === '0' ? postNewContact : updateContact}
                    backgroundColor="$blue9"
                    color="white"
                    fontSize={TYPOGRAPHY.sizes.md}
                    fontWeight={TYPOGRAPHY.weights.bold}
                    borderRadius={BORDER_RADIUS.md}
                >
                    {id === '0' ? 'Add Contact' : 'Update Contact'}
                </Button>
            </View>
        </View>
    );
}
