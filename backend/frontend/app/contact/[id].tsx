import { Text, View } from '@/components/Themed';
import { Stack, useLocalSearchParams, Link } from 'expo-router';
import { Contact } from '@/constants/Definitions';
import { Contacts } from '@/constants/PlaceholderData'
import { Pressable } from 'react-native';

function getContactById(id: number, contacts: Contact[]): Contact | null {
  const contact = contacts.find(contact => contact.id === id);
  return contact || null;
}

export default function ContactPage() {
  const { id } = useLocalSearchParams();

  const contact = getContactById(parseInt(id), Contacts);

  if (contact === null) {
    return (
      <View>
        <Stack.Screen options={{ title: "Error" }} />
        <Text>Could not find contact</Text>
      </View>)
  }

  return (

    <View>
      <Stack.Screen options={{ title: "" }} />

      <View className="flex flex-col">
        <View className="flex flex-row pt-4 justify-center">
          <Text className="font-bold text-lg">
            {contact.fullname}
          </Text>
        </View>
        <View className="flex flex-row pt-4 justify-center">
          <Text className="">{contact.location}</Text>
        </View>
        <View className="flex flex-row pt-4 justify-center">
          <View className="flex flex-1 items-center">
            <Text>{contact.emailaddress}</Text>
          </View>
          <View className="flex flex-1 items-center">
            <Text>{contact.phonenumber}</Text>
          </View>
        </View>
        <View className="flex flex-row pt-4 justify-center">
          <Text>{contact.userbio}</Text>
        </View>
        <View className="flex flex-row pt-4 justify-center">
          <Text>[how did we meet]</Text>
        </View>
        <View className="flex flex-row pt-4 justify-center">
          <Text>[last time contacted]</Text>
        </View>
        <View className="flex flex-row pt-4 justify-center">
          <Text>[importance score]</Text>
        </View>

        <View className="flex flex-row pt-8 justify-center">
          <Link push href="#" className="flex flex-1 items-start mx-1 p-4 rounded-xl bg-slate-300" >
            <Text>Edit</Text>
          </Link>
          <Link push href="#" className="flex flex-1 items-start mx-1 p-4 rounded-xl bg-slate-300" >
            <Text>Generate Intro Message</Text>
          </Link>
          <Link push href="#" className="flex flex-1 items-start mx-1 p-4 rounded-xl bg-slate-300" >
            <Text>Share</Text>
          </Link>
        </View>
      </View>




    </View>
  );
}
