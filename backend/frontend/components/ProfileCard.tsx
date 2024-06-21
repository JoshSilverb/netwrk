import React from "react";

import { Contact } from '@/constants/Definitions';
import { Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';

const ProfileCard = ({ contact, keyNum } : { contact : Contact, keyNum : number}) => {
    return (
        <Link href="/contactpage" asChild>
            <Pressable>
                <View key={contact.id} className={"flex-col mx-2 p-4 bg-slate-200 mb-1 rounded"}>
                    
                    <View className="flex-row pb-2">
                        <Text numberOfLines={1} className="flex-1 truncate text-sm font-semibold md:text-base">
                            {contact.fullname}
                        </Text>
                        <Text numberOfLines={1} className="flex-1 text-sm text-gray-500 sm:block">
                            {contact.location}
                        </Text>
                    </View>
                    <View className="flex-row">
                        <Text numberOfLines={1} className="flex-1 truncate text-sm text-gray-500 sm:block">
                            {contact.userbio}
                        </Text>
                    </View>
                </View>
            </Pressable>
        </Link>
    )
};

export default ProfileCard