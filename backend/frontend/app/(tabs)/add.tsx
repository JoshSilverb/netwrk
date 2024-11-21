import React from 'react';

import { Text, View } from '@/components/Themed';
import { TextInput, ScrollView, Pressable } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Months } from '@/constants/Definitions';
import { SafeAreaView } from 'react-native-safe-area-context';
import { XStack, YStack, Button, Paragraph } from 'tamagui';
import { addContactForUserURL, getContactByIdURL, updateContactForUserURL } from '@/constants/Apis';
import axios from 'axios';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Loader } from '@/components/Loader';

export default function AddContactPage() {
    const { id } = useLocalSearchParams();
    console.log("Got ID=", id);

    const [loading,       setLoading]       = React.useState(true);
    // const [errorReceived, setErrorReceived] = React.useState(false);    

    // Basic data 
    const [fullname,   onChangeFullname]   = React.useState('');
    const [location,   onChangeLocation]   = React.useState('');
    const [email,      onChangeEmail]      = React.useState('');
    const [phone,      onChangePhone]      = React.useState('');
    const [meeting,    onChangeMeeting]    = React.useState('');
    const [bio,        onChangeBio]        = React.useState('');
    const [notes,      onChangenotes]      = React.useState('');
    const [metThrough, onChangeMetThrough] = React.useState('');
    const [linkedin,   onChangeLinkedin]   = React.useState('');
    const [instagram,  onChangeInstagram]  = React.useState('');
    const [relevance,  onChangeRelevance]  = React.useState('');
    const [tags,       onChangeTags]       = React.useState('');


    // Last Contact date picker
    const [date, setDate] = React.useState(new Date(Date.now()));
    const [show, setShow] = React.useState(false);

    
    // If id isn't set, then this is in pure add mode, not edit, so don't need 
    // loading and error flags.
    const [resolvedId, setResolvedId] = React.useState<string | undefined>(undefined);

    const router = useRouter();

    React.useEffect(() => {
        if (typeof id === 'undefined') {
            console.log("Id is undefined");
            setLoading(false);
        }
        else {
            setResolvedId(id as string);
            fetchContactById(id as string);
        }

    }, [id, router]);

    const fetchContactById = async (id: string) => {
        try {
            const requestURL = getContactByIdURL + "/" + id;
            console.log("Request url: ", requestURL);
            const response = await axios.get(requestURL);
            setDataFromContact(response.data);
            setLoading(false);
            // setErrorReceived(false);
        } catch (error) {
            console.error('Error fetching data:', error);
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
        onChangeEmail("");
        onChangePhone("");
        onChangeMeeting("");
        onChangeBio("");
        onChangenotes("");
        onChangeMetThrough("");
        onChangeLinkedin("");
        onChangeInstagram("");
        onChangeRelevance("");
        onChangeTags("");
        setDate(new Date(Date.now()));
    }

    const setDataFromContact = (contact) => {
        onChangeFullname(contact.fullname);
        onChangeLocation(contact.location);
        onChangeEmail(contact.emailaddress);
        onChangePhone(contact.phonenumber);
        // onChangeMeeting("");
        onChangeBio(contact.userbio);
        // onChangenotes("");
        // onChangeMetThrough("");
        // onChangeLinkedin("");
        // onChangeInstagram("");
        // onChangeRelevance("");
        // onChangeTags("");
        // setDate(new Date(Date.now()));
    }

    //================================
    // Sending this contact to backend
    //================================

    

    // Send data to backend and redirect to contact page

    const postNewContact = async () => {
        // Contact data to be sent
        const requestBody = {
            creatorUsername: 'josh',
            newContact: {
                "fullname": fullname,
                "location": location,
                "emailaddress": email,
                "phonenumber": phone,
                "meeting": meeting,
                "userbio": bio,
                "notes": notes,
                "metThrough": metThrough,
                "linkedin": linkedin,
                "instagram": instagram,
                "relevance": relevance,
                "tags": tags
            }
        }

        try {
            const response = await axios.post(addContactForUserURL, requestBody)
            console.log(response.data)
            // setContactId(response.data)
            if (response.status == 200) {
                // resetData();   // TODO: SEE IF THIS LINE IS ACTUALLY NEEDED
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
            creatorUsername: 'josh',
            newContact: {
                "contact_id": id as string,
                "fullname": fullname,
                "location": location,
                "emailaddress": email,
                "phonenumber": phone,
                "meeting": meeting,
                "userbio": bio,
                "notes": notes,
                "metThrough": metThrough,
                "linkedin": linkedin,
                "instagram": instagram,
                "relevance": relevance,
                "tags": tags
            }
        }
        
        try {
            const response = await axios.post(updateContactForUserURL, requestBody)
            console.log(response.data)
            // setContactId(response.data)
            if (response.status == 200) {
                // resetData();   // TODO: SEE IF THIS LINE IS ACTUALLY NEEDED
                const redirectLink = "/contact/" + response.data;
                router.replace(redirectLink);
            }

        }
        catch (error) {
            console.error("Error during add contact POST request:", error);
        }
    }
    
    console.log("Rendering! loading=", loading);
    return (

        <View className="flex-1 flex-col justify-start bg-white">
            <ScrollView automaticallyAdjustKeyboardInsets={true}>
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
                    <TextInput 
                        className="" 
                        onChangeText={onChangeLocation} 
                        value={location} 
                        placeholder="Location"
                        textContentType='location' 
                        textAlign='center'
                    />
                </View>
                <View className="flex flex-row mt-4">
                    <View className="flex-1 flex mt-4 ml-10 mr-1 border rounded-md border-slate-200">
                        <TextInput 
                            className="pl-1" 
                            onChangeText={onChangeEmail} 
                            value={email} 
                            placeholder="Email Address" 
                            textContentType='emailAddress'
                            textAlign='start'
                        />
                    </View>
                    <View className="flex-1 mt-4 ml-1 mr-10 border rounded-md border-slate-200">
                        <TextInput 
                            className="pl-1" 
                            onChangeText={onChangePhone} 
                            value={phone} 
                            placeholder="Phone Number" 
                            textContentType='telephoneNumber'
                            textAlign='start'
                        />
                    </View>
                </View>
                <View className="flex flex-row">
                    <View className="flex-1 mt-4 ml-10 mr-1 border rounded-md border-slate-200">
                        <TextInput 
                            className="pl-1" 
                            onChangeText={onChangeLinkedin} 
                            value={linkedin} 
                            placeholder="LinkedIn" 
                            textAlign='start'
                        />
                    </View>
                    <View className="flex-1 mt-4 ml-1 mr-10 border rounded-md border-slate-200">
                        <TextInput 
                            className="pl-1" 
                            onChangeText={onChangeInstagram} 
                            value={instagram} 
                            placeholder="Instagram" 
                            textAlign='start'
                        />
                    </View>
                </View>
                <View className="flex mt-4 mx-10 border rounded-md border-slate-200">
                    <TextInput 
                        // note that 4px padding is equiv to p-1 in tailwind
                        style={{textAlignVertical: "top", paddingLeft: 4}}
                        onChangeText={onChangeMeeting} 
                        value={meeting}
                        placeholder="Met through"
                        multiline={true}
                        numberOfLines={2} 
                        
                    />
                </View>
                <View className="flex mt-4 mx-10 border rounded-md border-slate-200">
                    <TextInput 
                        // note that 4px padding is equiv to p-1 in tailwind
                        style={{textAlignVertical: "top", paddingLeft: 4}}
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
                                    className="p-1"
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
                                className="pl-1" 
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
                {typeof id === 'undefined' 
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
