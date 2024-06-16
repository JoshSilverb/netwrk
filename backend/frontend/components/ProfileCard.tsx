import React from "react";
import clsx from 'clsx';
import { Contact } from '@/constants/Definitions';
import { Text, View } from 'react-native';

const ProfileCard = ({ contact, keyNum } : { contact : Contact, keyNum : number}) => {
    return (
        
        <View
            key={contact.id}
            className={clsx(
                'flex-col  py-4',
                {
                'border-t': keyNum !== 0,
                },
            )}
        >
            {/* <View className="flex grid grid-cols-2 gap-4 flex-1"> */}
                <View className="flex-row pb-2">
                {/* <Text>HI</Text> */}

                    {/* <View className="flex items-left flex-1"> */}
                        <Text className="flex-1 truncate text-sm font-semibold md:text-base">
                            {contact.fullname}
                        </Text>
                        <Text className="flex-1  text-sm text-gray-500 sm:block">
                            {contact.location}
                        </Text>
                </View>
                <View className="flex-row">

                    {/* </View> */}
                    {/* <View className="flex items-right flex-1"> */}
                        
                    {/* </View> */}
                    {/* <View className="flex items-left flex-1 col-span-2"> */}
                        <Text className="flex-1 truncate  text-sm text-gray-500 sm:block">
                            {contact.userbio}
                        </Text>
                    {/* </View> */}

                </View>
        </View>
    )
};

export default ProfileCard