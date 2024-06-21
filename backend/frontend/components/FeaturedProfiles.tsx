import React from 'react';
import ProfileCard from '@/components/ProfileCard';
import { Text, View } from 'react-native';
import { Link } from 'expo-router';

const FeaturedProfiles = ({ profiles }) => {
  return (
    <View className=" rounded-xl bg-gray-50 p-4 overflow-y-auto ">
        {profiles.map((profile, key) => (
          <ProfileCard contact={profile} key={key} />
        ))}
        <View className="flex flex-row items-center justify-between py-4 focus:ring-blue-500 focus:border-blue-500 block text-base font-medium text-gray-900 dark:text-white border-t-2">
          <Link replace href="/(tabs)/contacts">See all</Link>
          
          {/* <Text onPress={() => Linking.openURL('/contacts')}>
            See all
          </Text> */}
        </View>
    </View>
  );
};

export default FeaturedProfiles;