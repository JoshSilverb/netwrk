import { View } from '@/components/Themed';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Contact } from '@/constants/Definitions';
import { Button, Paragraph, XStack, YStack, Avatar, ScrollView, Accordion, Square } from 'tamagui';
import { ChevronUp, ChevronDown } from '@tamagui/lucide-icons'
import { removeContactForUserURL } from '@/constants/Apis';
import { useState, useEffect } from 'react';
import { Loader } from '@/components/Loader';
import { getContactByIdURL } from '@/constants/Apis';
import axios from 'axios';
import { useRouter } from 'expo-router';


export default function ContactPage() {
  const { id } = useLocalSearchParams();

  const requestURL = getContactByIdURL + "/" + id;
  
  const [contact, setContact] = useState([]);
  const [loading, setLoading] = useState(true);

  const [errorReceived, setErrorReceived] = useState(false);

  useEffect(() => {
      fetchContactById();
  }, []);
  const fetchContactById = async () => {
      try {
        console.log("Request url: ", requestURL);
          const response = await axios.get(requestURL);
          setContact(response.data);
          setLoading(false);
          setErrorReceived(false);
      } catch (error) {
          console.error('Error fetching data:', error);
          setLoading(false);
          setErrorReceived(true);
      }
  };

    //================================
    // Sending this contact to backend
    //================================

    // Contact data to be sent
    const requestBody = {
        creatorUsername: 'josh',
        contactId: id
    }

  // Send data to backend and redirect to contact page
  const router = useRouter();

  const removeContact = async () => {
      try {
          const response = await axios.post(removeContactForUserURL, requestBody)
          console.log(response.data)
          // setContactId(response.data)
          if (response.status == 200) {
              const redirectLink = "/(tabs)/contacts/";
              router.replace(redirectLink);
          }

      }
      catch (error) {
          console.error("Error during remove contact POST request:", error);
      }
  }

  
  const editContact = async () => {
    // const editLink = "/add/" + id;
    router.push({ pathname: '/add', params: { id } });
}

  if (errorReceived) {
    return (
      <View className="flex-1 bg-white">
        <Stack.Screen options={{ title: "Error" }} />
        <Paragraph>Could not find contact</Paragraph>
      </View>)
  }

  return (

    <View className="flex-1 bg-white">
      <Stack.Screen options={{ title: "" }} />

      <YStack flex={1} position="relative">
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
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
      
      {/* Bottom buttons Stack */}
      <XStack 
        position="absolute"
        bottom={0} // Anchors to the bottom of the screen
        left={0}
        right={0}
        backgroundColor="rgba(255, 255, 255, 0.8)" // Translucent background
        padding={16}
        justifyContent="space-between"
        alignItems="center">
        <Button onPress={removeContact}>Delete</Button>
        <Button>Share</Button>
        <Button onPress={editContact}>Edit</Button>
      </XStack>
      </YStack>
    </View>
  );
}
