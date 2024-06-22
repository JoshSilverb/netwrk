import React from 'react';

import { Text, View } from '@/components/Themed';
import { TextInput, Button, Pressable } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Months } from '@/constants/Definitions';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddContactPage() {
    const [fullname,   onChangeFullname]   = React.useState('');
    const [location,   onChangeLocation]   = React.useState('');
    const [email,      onChangeEmail]      = React.useState('');
    const [phone,      onChangePhone]      = React.useState('');
    const [bio,        onChangeBio]        = React.useState('');
    const [instagram,  onChangeInstagram]  = React.useState('');
    const [twitter,    onChangeTwitter]    = React.useState('');

    // Last Contact date picker
    const [date, setDate] = React.useState(new Date(Date.now()));
    const [show, setShow] = React.useState(false);

    const onChange = (event, selectedDate) => {
        const currentDate = selectedDate;
        setShow(false);
        setDate(currentDate);
    };

    const showDatepicker = () => {
        setShow(true);
        setMode('date');
    };

    const [importance, onChangeImportance] = React.useState('');

    return (

        <SafeAreaView className="flex-1 flex-col justify-start bg-slate-50">
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
                        className="" 
                        onChangeText={onChangeEmail} 
                        value={email} 
                        placeholder="Email Address" 
                        textContentType='emailAddress'
                        textAlign='start'
                    />
                </View>
                <View className="flex-1 mt-4 ml-1 mr-10 border rounded-md border-slate-200">
                    <TextInput 
                        className="" 
                        onChangeText={onChangePhone} 
                        value={phone} 
                        placeholder="Phone Number" 
                        textContentType='telephoneNumber'
                        textAlign='start'
                    />
                </View>
            </View>
            <View className="flex flex-row justify-center">
                <View className="flex-1 mt-4 ml-10 mr-1 border rounded-md border-slate-200">
                    <TextInput 
                        className="" 
                        onChangeText={onChangeInstagram} 
                        value={instagram} 
                        placeholder="Instagram" 
                        textAlign='start'
                    />
                </View>
                <View className="flex-1 mt-4 ml-1 mr-10 border rounded-md border-slate-200">
                    <TextInput 
                        className="" 
                        onChangeText={onChangeTwitter} 
                        value={twitter} 
                        placeholder="Twitter" 
                        textAlign='start'
                    />
                </View>
            </View>
            <View className="flex mt-4 mx-10 border rounded-md border-slate-200">
                <TextInput 
                    style={{textAlignVertical: "top"}}
                    onChangeText={onChangeBio} 
                    value={bio}
                    placeholder="Bio"
                    multiline={true}
                    numberOfLines={4} 
                    
                />
            </View>

            <View className="flex-2 flex-row justify-center">
                <View className="flex-1 flex-col mt-4 ml-10 mr-1">
                    <View className="flex">
                        <Text>Last Contact</Text>
                    </View>
                    <View className="flex border mt-1 rounded-md border-slate-200">
                        <Pressable onPress={showDatepicker} className="my-1">
                            <Text>{date.getDate()} {Months[date.getMonth()]} {date.getFullYear()}</Text>
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
                <View className="flex-1 flex-col mt-4 ml-1 mr-10">
                <View className="flex">
                        <Text>Importance Score</Text>
                    </View>
                    <View className="flex border mt-1 rounded-md border-slate-200">
                        <TextInput 
                            className="" 
                            onChangeText={onChangeImportance} 
                            value={importance} 
                            placeholder="5" 
                            textAlign='start'
                            inputMode='numeric'
                        />
                    </View>
                </View>
            </View>

            <View className="flex flex-row p-2 my-4 mx-20 justify-center border border-slate-200 rounded-xl bg-slate-300">
                <Pressable>
                    <Text className='content-center'>Add</Text>
                </Pressable>
            </View>
        </SafeAreaView>
  );
}
