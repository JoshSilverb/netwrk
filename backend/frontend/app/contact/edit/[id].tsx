import { Text, View } from '@/components/Themed';
import { Stack, useLocalSearchParams, Link } from 'expo-router';
import { Contact } from '@/constants/Definitions';
// import { Contacts } from '@/constants/PlaceholderData'
import { Paragraph } from 'tamagui';
import { Loader } from '@/components/Loader';
import { getContactsForUserURL } from '@/constants/Apis';
import axios from 'axios';
import { useState, useEffect } from 'react';


function getContactById(id: number, contacts: Contact[]): Contact | null {
  const contact = contacts.find(contact => contact.id === id);
  return contact || null;
}

export default function ContactPage() {
  const { id } = useLocalSearchParams();
  
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);


  const contact = getContactById(parseInt(id), contacts);

  useEffect(() => {
      fetchContacts();
  }, []);

  const fetchContacts = async () => {
      try {
          const response = await axios.get(getContactsForUserURL);
          setContacts(response.data);
          setLoading(false);
      } catch (error) {
          console.error('Error fetching data:', error);
      }
  };

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
      <Loader loading={loading}></Loader>
    </View>
  );
}
