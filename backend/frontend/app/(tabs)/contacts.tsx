import { Text, View } from '@/components/Themed';
import { Contacts } from '@/constants/PlaceholderData'
import  ContactsList from '@/components/ContactsList'
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';


export default function contactsScreen() {
  const filterHeader = <Text className="block mb-2 mx-2 text-base font-medium">
                         Sort by...
                       </Text>
    return (
      <SafeAreaView className="flex-1 flex-col justify-start bg-slate-50	">
        <View className="flex-1 col-span-full mb-4 bg-slate-50">
          <ContactsList contacts={Contacts} header={filterHeader}/>
        </View>
      </SafeAreaView>
    );

}
