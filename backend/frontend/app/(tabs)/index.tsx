import { Text, View } from 'react-native';

import { Contacts } from '@/constants/PlaceholderData'
import ContactsList from '@/components/ContactsList'
import { Link } from 'expo-router';
import { Button, YStack, ScrollView } from 'tamagui';


export default function DashboardScreen() {
    return (

        <View className="flex-1 bg-white">
        <ScrollView>
        {/* Scrolling Stack */}
        <YStack space="$5" marginBottom="$5">
            {/* Featured Contacts Stack */}
            <YStack marginLeft={20} marginRight={20}>
                <Text className="block mb-2 mx-2 text-base font-medium text-gray-900 dark:text-white 	">
                    FEATURED CONTACTS
                </Text>
                <ContactsList contacts={Contacts.slice(0,3)} address={"/(tabs)/contacts"} />
                <Link href='/(tabs)/contacts' asChild><Button>See All</Button></Link>
            </YStack>
            {/* Nearby Contacts Stack */}
            <YStack marginLeft={20} marginRight={20}>
                <Text className="block mb-2 mx-2 text-base font-medium text-gray-900 dark:text-white 	">
                    NEARBY CONTACTS
                </Text>
                <ContactsList contacts={Contacts.slice(4,7)} address={"/(tabs)/contacts"} />
                <Link href='/(tabs)/contacts' asChild><Button>See All</Button></Link>
            </YStack>
        </YStack>
        </ScrollView>
        </View>
    );
}
