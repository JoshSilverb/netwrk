import { Text, View } from '@/components/Themed';
import { Stack, useLocalSearchParams, Link } from 'expo-router';
import { Contact } from '@/constants/Definitions';
import { Contacts } from '@/constants/PlaceholderData'
import { Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Paragraph } from 'tamagui';

function getContactById(id: number, contacts: Contact[]): Contact | null {
  const contact = contacts.find(contact => contact.id === id);
  return contact || null;
}

export default function ContactPage() {
  const { id } = useLocalSearchParams();

  const contact = getContactById(parseInt(id), Contacts);

  if (contact === null) {
    return (
      <View className="flex-1 bg-white">
        <Stack.Screen options={{ title: "Error" }} />
        <Text>Could not find contact</Text>
      </View>)
  }

  return (

    <View className="flex-1 bg-white">
      <Stack.Screen options={{ title: "" }} />
      <Paragraph>Edit page</Paragraph>
    </View>
  );
}
