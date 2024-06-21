import { Text, View } from 'react-native';

import EditScreenInfo from '@/components/EditScreenInfo';
import FeaturedProfiles from '@/components/FeaturedProfiles';
import { Contacts } from '@/constants/PlaceholderData'
import ContactsList from '@/components/ContactsList'
export default function DashboardScreen() {
  return (

    <View className="flex-1 flex-col  justify-start bg-slate-50	">
      <View className="flex-1 flex-column ">
        <View className="col-span-full mb-4 ">
          <Text className="block m-2 text-base font-medium text-gray-900 dark:text-white 	">
              FEATURED CONTACTS
          </Text>
          {/* <FeaturedProfiles profiles={Contacts.slice(0,3)} /> */}
          <ContactsList contacts={Contacts.slice(0,3)} address={"/(tabs)/contacts"} />
        </View>
      </View>
    </View>
  );
}
