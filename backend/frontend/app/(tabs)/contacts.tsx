import { Text, View } from '@/components/Themed';
import { Contacts } from '@/constants/PlaceholderData'
import  ContactsList from '@/components/ContactsList'
import { ScrollView, YStack, Paragraph } from 'tamagui';


export default function contactsScreen() {
  const filterHeader = <Text className="block mb-2 mx-2 text-base font-medium">
                         Sort by...
                       </Text>
    return (
        <View className="flex-1 justify-start bg-white	">
            <ScrollView>
                <Paragraph className="block mb-2 mx-2 text-base font-medium">
                    Sort by...
                </Paragraph>
                <YStack >
                    <ContactsList contacts={Contacts} header={filterHeader}/>
                </YStack>
            </ScrollView>
        </View>
    );

}
