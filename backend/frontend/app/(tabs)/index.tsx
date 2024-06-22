import { Text, View } from 'react-native';

import { Contacts } from '@/constants/PlaceholderData'
import ContactsList from '@/components/ContactsList'
import { SafeAreaView } from 'react-native-safe-area-context';


export default function DashboardScreen() {
  return (

    <SafeAreaView className="flex-1 flex-col justify-start bg-slate-50">
        <View className="col-span-full mb-4 ">
          <Text className="block m-2 text-base font-medium text-gray-900 dark:text-white 	">
              FEATURED CONTACTS
          </Text>
          <ContactsList contacts={Contacts.slice(0,3)} address={"/(tabs)/contacts"} />
        </View>
    </SafeAreaView>
  );
}
