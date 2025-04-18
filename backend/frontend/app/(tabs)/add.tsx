import React from 'react';

import { Text, View } from '@/components/Themed';
import { TextInput, ScrollView, Pressable } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Months } from '@/constants/Definitions';
import { Group, Separator, XStack, YStack, Button, Paragraph } from 'tamagui';
import { addContactForUserURL, getContactByIdURL, updateContactForUserURL } from '@/constants/Apis';
import axios from 'axios';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useAuth } from '@/components/AuthContext';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { placesApiKey } from '@/constants/Secrets';
import { Plus as PlusIcon, X as XIcon } from '@tamagui/lucide-icons';
import { CommunicationFrequencySelector } from '@/components/CommunicationFrequencySelector'

export default function AddContactPage() {
    const { id } = useLocalSearchParams();
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
    const [date, setDate] = React.useState(new Date(Date.now()));
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
            user_token: token
        }
        try {
            const requestURL = getContactByIdURL + "/" + id;
            console.log("Request url: ", requestURL);
            const response = await axios.post(requestURL, requestBody);
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
        setDate(new Date(Date.now()));
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
        console.log(`Casting that to date gives ${new Date(dateStr)}`)
        setDate(new Date(cdateStr));
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

        <View className="flex-1 flex-col justify-start bg-white">
            <ScrollView automaticallyAdjustKeyboardInsets={true} keyboardShouldPersistTaps='always'>
            <YStack>
                {/* <Loader loading={loading}> */}
                <View className="flex mx-10 mt-4 border rounded-md border-slate-200">
                    <TextInput 
                        className="flex-2 font-bold text-lg" 
                        onChangeText={onChangeFullname} 
                        value={fullname} 
                        placeholder="Full Name" 
                        textContentType='name'
                        textAlign='center'
                    />
                </View>

                <View className="flex mt-4 mx-12 border rounded-md border-slate-200">
                <GooglePlacesAutocomplete
                    placeholder='Location'
                    onPress={(data, details = null) => {
                        onChangeLocation(data.description);
                        console.log(data);
                    }}
                    query={{
                        key: placesApiKey,
                        language: 'en',
                    }}
                    disableScroll={true}
                />
                </View>

                <View className="flex-1 flex-col mt-4 mx-10">
                    <Text>Socials</Text>
                </View>

                {/* Dynamically Render Existing Socials */}
                {socials.map((social, index) => (
                    <Group key={index} orientation="horizontal" className="flex flex-row mx-10 mt-4">
                        <Group.Item>
                        <View className="flex-1 border rounded-md border-slate-200 min-h-[36px] justify-center">
                            <TextInput
                                className="flex-1 pl-1"
                                value={social.label}
                                onChangeText={(text) => editSocial(index, 'label', text)}
                            />
                        </View>
                        </Group.Item>
                        <Group.Item>
                        <View className="flex-1 border rounded-md border-slate-200 min-h-[36px] justify-center">
                            <TextInput
                                className="flex-1 pl-1"
                                value={social.address}
                                onChangeText={(text) => editSocial(index, 'address', text)}
                            />
                        </View>
                        </Group.Item>
                        <Group.Item>
                        <View className="border rounded-md border-slate-200 min-h-[36px] items-center justify-center">
                            <Pressable onPress={() => removeSocial(index)} className="ml-2">
                                <XIcon />
                            </Pressable>
                        </View>
                        </Group.Item>
                    </Group>
                ))}

                {/* Input for Adding a New Social */}
                {openNewSocial && 
                <Group orientation="horizontal" className="flex flex-row mx-10 mt-4">
                    <Group.Item>
                    <View className="flex-1 border rounded-md border-slate-200 min-h-[36px] justify-center">
                        <TextInput
                            className="flex-1 pl-2"
                            placeholder="Enter social media"
                            value={newSocial.label}
                            onChangeText={(text) => setNewSocial({ ...newSocial, label: text })}
                        />
                    </View>
                    </Group.Item>
                    <Group.Item>
                    <View className="flex-1 border rounded-md border-slate-200 min-h-[36px] justify-center">
                        <TextInput
                            className="flex-1 pl-2"
                            placeholder="Enter address"
                            value={newSocial.address}
                            onChangeText={(text) => setNewSocial({ ...newSocial, address: text })}
                        />
                    </View>
                    </Group.Item>
                    <Group.Item>
                        <View className="border rounded-md border-slate-200 min-h-[36px] items-center justify-center">
                            <Pressable onPress={addSocial} className="mx-1">
                                <PlusIcon />
                            </Pressable>
                        </View>
                    </Group.Item>
                </Group>
                }
                {openNewSocial ? 
                <Button onPress={handleCloseNewSocialPress} className="self-center mt-2" >Cancel</Button>
                    :
                <Button onPress={handleOpenNewSocialPress} className="self-center mt-2" >Add Social</Button>
                }
                <View className="flex mt-4 mx-10 border rounded-md border-slate-200 p-1">
                    <TextInput className="align-top"
                        onChangeText={onChangeMetThrough} 
                        value={metThrough}
                        placeholder="Met through"
                        multiline={true}
                        numberOfLines={2} 
                        
                    />
                </View>
                <View className="flex mt-4 mx-10 border rounded-md border-slate-200 p-1">
                    <TextInput className="align-top"
                        onChangeText={onChangeBio} 
                        value={bio}
                        placeholder="Bio"
                        multiline={true}
                        numberOfLines={4} 
                        
                    />
                </View>
                <View className="flex-2 flex-row">
                    <View className="flex-1 flex-col mt-4 ml-10 mr-1">
                        <View className="flex">
                            <Text>Last Contact</Text>
                        </View>
                        <View className="flex border mt-1 rounded-md border-slate-200 ">
                            <Pressable onPress={showDatepicker} className="my-1">
                                <Text className='pl-1'>{date.getDate()} {Months[date.getMonth()]} {date.getFullYear()}</Text>
                                {show && (
                                    <DateTimePicker
                                    className="pl-1"
                                    testID="dateTimePicker"
                                    value={date}
                                    mode="date"
                                    onChange={onChange}
                                    />
                                )}
                            </Pressable>
                        </View>
                    </View>
                    <View className="flex-1 flex-col mt-4 ml-1 mr-10 ">
                        <View className="flex ">
                            <Text>Contact frequency - every</Text>
                        </View>
                        <CommunicationFrequencySelector 
                            items={FrequencyOption}
                            onChange={onChangeRemindPeriod}/>
                        <Text>Remind period: wks={remindPeriodWks} mos={remindPeriodMos}</Text>
                    </View>
                </View>

                <View className="flex-1 flex-col mt-4 mx-10">
                    <Text>Tags</Text>
                </View>

                {/* Dynamically Render Existing Tags */}
                {tags && 
                <XStack className="border rounded-md border-slate-200 flex-wrap items-start justify-start mx-10 mt-2 p-1" space="$2" rowGap="$2">  
                {tags.map((tag, index) => (
                    <Group key={index} orientation='horizontal'>
                    <Group.Item>
                    <View className="border rounded-md border-slate-200 p-1">
                        <Text >{tag}</Text>
                    </View>
                    </Group.Item>
                    <Group.Item>
                    <View className="border rounded-md border-slate-200 p-1 items-center">
                        <Pressable onPress={() => removeTag(index)}><XIcon size={16} /></Pressable>
                    </View>
                    </Group.Item>
                    </Group>
                ))}
                </XStack>
                }
                
                {/* Input for Adding a New Tag */}
                <View className="flex flex-row mx-10 mt-4">
                    <View className="flex-1 border rounded-md border-slate-200 p-1 min-h-[36px] justify-center">
                        <TextInput
                            className="flex-1 pl-1"
                            placeholder="Enter new tag"
                            value={newTag}
                            onChangeText={(text) => setNewTag(text)}
                        />
                    </View>
                    <View className="border rounded-md border-slate-200 px-2 min-h-[36px] items-center justify-center">
                        <Pressable onPress={addTag} className="ml-2">
                            <PlusIcon />
                        </Pressable>
                    </View>
                </View>

                { id === '0' 
                    ? (<Button marginTop="$5" marginHorizontal="$10" onPress={postNewContact} >
                           Add
                       </Button>)
                    : (<Button marginTop="$5" marginHorizontal="$10" onPress={updateContact} >
                        Update
                    </Button>)}
                {/* </Loader> */}
            </YStack>
            </ScrollView>
        </View>
  );
}
