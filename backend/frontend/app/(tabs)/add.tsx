import React from 'react';

import { Text, View } from '@/components/Themed';
import { TextInput, ScrollView, Pressable } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Months } from '@/constants/Definitions';
import { XStack, YStack, Button, Paragraph } from 'tamagui';
import { addContactForUserURL, getContactByIdURL, updateContactForUserURL } from '@/constants/Apis';
import axios from 'axios';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useAuth } from '@/components/AuthContext';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { placesApiKey } from '@/constants/Secrets';
import { Plus as PlusIcon, Minus as MinusIcon } from '@tamagui/lucide-icons';


export default function AddContactPage() {
    const { id } = useLocalSearchParams();
    console.log("Rendering add page with ID param =", id);

    const [loading,       setLoading]       = React.useState(true);
    // const [errorReceived, setErrorReceived] = React.useState(false);    

    // Basic data 
    const [fullname,   onChangeFullname]   = React.useState('');
    const [location,   onChangeLocation]   = React.useState('');
    const [bio,        onChangeBio]        = React.useState('');
    const [metThrough, onChangeMetThrough] = React.useState('');
    const [socials,    setSocials]         = React.useState([]);
    const [newSocial,  setNewSocial]       = React.useState({ label: '', address: ''});
    const [relevance,  onChangeRelevance]  = React.useState('');
    const [tags,       onChangeTags]       = React.useState('');

    // Extra location var
    const ref = React.useRef();

    // Last Contact date picker
    const [date, setDate] = React.useState(new Date(Date.now()));
    const [show, setShow] = React.useState(false);

    const { token, setToken } = useAuth();

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
        onChangeRelevance("");
        onChangeTags("");
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
        onChangeRelevance(contact.importance);
        // onChangeTags();
        setDate(new Date(contact.lastcontact));
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
                "importance": relevance,
                "tags": tags
            }
        }

        console.log("Adding new user with details:", requestBody.newContact);

        try {
            const response = await axios.post(addContactForUserURL, requestBody)
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
                "importance": relevance,
                "lastcontact": date,
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
                {/* Dynamically Render Existing Socials */}
                {socials.map((social, index) => (
                    <View key={index} className="flex flex-row mx-10 mt-4">
                        <View className="flex-1 border rounded-md border-slate-200 p-1 min-h-[36px] justify-center">
                            <TextInput
                                className="flex-1 pl-1"
                                value={social.label}
                                onChangeText={(text) => editSocial(index, 'label', text)}
                            />
                        </View>
                        <View className="flex-1 border rounded-md border-slate-200 p-1 mx-1 min-h-[36px] justify-center">
                            <TextInput
                                className="flex-1 pl-1"
                                value={social.address}
                                onChangeText={(text) => editSocial(index, 'address', text)}
                            />
                        </View>
                        <View className="border rounded-md border-slate-200 px-2 min-h-[36px] items-center justify-center">
                            <Pressable onPress={() => removeSocial(index)} className="ml-2">
                                <MinusIcon />
                            </Pressable>
                        </View>
                    </View>
                ))}

                {/* Input for Adding a New Social */}
                <View className="flex flex-row mx-10 mt-4">
                    <View className="flex-1 border rounded-md border-slate-200 p-1 min-h-[36px] justify-center">
                        <TextInput
                            className="flex-1 pl-1"
                            placeholder="Enter social media"
                            value={newSocial.label}
                            onChangeText={(text) => setNewSocial({ ...newSocial, label: text })}
                        />
                    </View>
                    <View className="flex-1 border rounded-md border-slate-200 p-1 mx-1 min-h-[36px] justify-center">
                        <TextInput
                            className="flex-1 pl-1"
                            placeholder="Enter address"
                            value={newSocial.address}
                            onChangeText={(text) => setNewSocial({ ...newSocial, address: text })}
                        />
                    </View>
                    <View className="border rounded-md border-slate-200 px-2 min-h-[36px] items-center justify-center">
                        <Pressable onPress={addSocial} className="ml-2">
                            <PlusIcon />
                        </Pressable>
                    </View>
                </View>
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
                            <Text>Relevance</Text>
                        </View>
                        <View className="flex border mt-1 rounded-md border-slate-200">
                            <TextInput 
                                className="p-1" 
                                onChangeText={onChangeRelevance} 
                                value={relevance} 
                                placeholder="5" 
                                textAlign='start'
                                inputMode='numeric'
                            />
                        </View>
                    </View>
                </View>

                <View className="flex-1 flex-col mt-4 mx-10">
                    <View className="flex">
                        <Text>Tags (separated by commas)</Text>
                    </View>
                    <View className="flex border mt-1 rounded-md border-slate-200">
                        <TextInput 
                            className="pl-1" 
                            onChangeText={onChangeTags} 
                            value={tags} 
                            placeholder="tag-1, tag-2, ..." 
                            textAlign='start'
                        />
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
