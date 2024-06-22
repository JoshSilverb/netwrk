import { Text, View } from '@/components/Themed';
import { Contacts } from '@/constants/PlaceholderData'
import  ContactsList from '@/components/ContactsList'
import { SafeAreaView } from 'react-native-safe-area-context';


export default function contactsScreen() {

    return (
      <SafeAreaView className="flex-1 flex-col justify-start bg-slate-50	">
        <View className="col-span-full mb-4 ">
          <Text className="block m-2 text-base font-medium">
              Sort by...
          </Text>
            <ContactsList contacts={Contacts} />
        </View>
      </SafeAreaView>
    );

}
