import { View } from '@/components/Themed';
import { Stack, useLocalSearchParams, Link } from 'expo-router';
import { Contact } from '@/constants/Definitions';
import { Button, Paragraph, XStack, YStack, Avatar, ScrollView } from 'tamagui';
import { useState, useEffect } from 'react';
import { Loader } from '@/components/Loader';
import { getContactsForUserURL } from '@/constants/Apis';
import axios from 'axios';

function getContactById(id: number, contacts: Contact[]): Contact | null {
  const contact = contacts.find(contact => contact.id === id);
  return contact || null;
}

export default function ContactPage() {
  const { id } = useLocalSearchParams();
  const editLink = "/contact/edit/" + id;

  
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const contact = getContactById(parseInt(id), contacts);

  if (contact === null) {
    return (
      <View className="flex-1 bg-white">
        <Stack.Screen options={{ title: "Error" }} />
        <Paragraph>Could not find contact</Paragraph>
      </View>)
  }

  return (

    <View className="flex-1 bg-white">
      <Stack.Screen options={{ title: "" }} />

      <ScrollView>
      <YStack alignItems="flex-start" gap="$2" padding="$5">
        <Loader loading={loading}>
        {/* Header Stack */}
        <YStack alignSelf="center" alignItems='center' gap="$2">
          <Avatar circular size="$10">
              <Avatar.Image
              accessibilityLabel={contact.fullname}
              src="https://images.unsplash.com/photo-1548142813-c348350df52b?&w=150&h=150&dpr=2&q=80"
              />
          </Avatar>

          <Paragraph className="font-bold" size="$8">
            {contact.fullname}
          </Paragraph>

          <Paragraph color="gray">{contact.location}</Paragraph>
        </YStack>

        {/* Contact Info Stack */}
        <Paragraph className="font-bold" size="$6" color="gray">
          Contact info
        </Paragraph>
        <YStack alignSelf='flex-start' space="$2" paddingLeft="$2">
          <Button size="$2">{contact.emailaddress}</Button>
          <Button size="$2">{contact.phonenumber}</Button>
        </YStack>

        {/* Bio and Notes Stack */}
        <Paragraph className="font-bold" size="$6" color="gray">
          About
        </Paragraph>
        <YStack alignSelf='flex-start' space="$2" paddingLeft="$2">
          <YStack space="$1">
            <Paragraph className="font-bold" size="$4" color="gray">User Bio</Paragraph>
            <Paragraph borderStyle="solid" borderColor="lightgray" borderWidth={1} borderRadius={4} padding={10}>{contact.userbio}</Paragraph>
          </YStack>
          <YStack space="$1">
            <Paragraph className="font-bold" size="$4" color="gray">User Notes</Paragraph>
            <Paragraph borderStyle="solid" borderColor="lightgray" borderWidth={1} borderRadius={4} padding={10}>Notes notes ntoes notes</Paragraph>
          </YStack>
          <YStack space="$1">
            <Paragraph className="font-bold" size="$4" color="gray">Met through</Paragraph>
            <Paragraph borderStyle="solid" borderColor="lightgray" borderWidth={1} borderRadius={4} padding={10}>Met in college</Paragraph>
          </YStack>
        </YStack>

        {/* Stats Stack */}
        <Paragraph className="font-bold" size="$6" color="gray">
          Stats
        </Paragraph>
        <YStack alignSelf='flex-start' space="$2" paddingLeft="$2">
          <XStack space="$5">
            <Paragraph className="font-bold" size="$4" color="gray">Last contacted:</Paragraph>
            <Paragraph borderStyle="solid" borderColor="lightgray" borderWidth={1} borderRadius={4} paddingLeft={10} paddingRight={10}>8 Sep 2024</Paragraph>
          </XStack>
          <XStack space="$5">
            <Paragraph className="font-bold" size="$4" color="gray">Relevance score:</Paragraph>
            <Paragraph borderStyle="solid" borderColor="lightgray" borderWidth={1} borderRadius={4} paddingLeft={10} paddingRight={10}>5</Paragraph>
          </XStack>
        </YStack>

        {/* Tags Stack */}
        <Paragraph className="font-bold" size="$6" color="gray">
          Tags
        </Paragraph>
        <XStack flexWrap="wrap" alignItems="flex-start" justifyContent="flex-start" space="$2" paddingLeft="$2" rowGap="$2">  
          <Button size="$2" backgroundColor="lightgray" borderWidth={2} borderColor="gray">College Friend</Button>
          <Button size="$2" backgroundColor="lightgray" borderWidth={2} borderColor="gray">In AI</Button>
          <Button size="$2" backgroundColor="lightgray" borderWidth={2} borderColor="gray">Party Friend</Button>
          <Button size="$2" backgroundColor="lightgray" borderWidth={2} borderColor="gray">Product Manager</Button>
          <Button size="$2" backgroundColor="lightgray" borderWidth={2} borderColor="gray">New York</Button>
          <Button size="$2" backgroundColor="lightgray" borderWidth={2} borderColor="gray">Microsoft</Button>
          <Button size="$2" backgroundColor="lightgray" borderWidth={2} borderColor="gray">CEO</Button>
        </XStack>
        </Loader>
      </YStack>
      </ScrollView>        
      
      <XStack paddingLeft="$5" paddingRight="$5" paddingBottom="$3" alignSelf="center" gap="$2">
        <Link push href={editLink} asChild >
          <Button>Edit</Button>
        </Link>
        <Link push href="#" asChild >
          <Button>Generate Message</Button>
        </Link>
        <Link push href="#" asChild >
          <Button>Share</Button>
        </Link>
      </XStack>
    </View>
  );
}
