import { View } from '@/components/Themed';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Contact } from '@/constants/Definitions';
import { Text, Group, Button, Paragraph, XStack, YStack, Avatar, ScrollView, Accordion, Square } from 'tamagui';
import { ChevronUp, ChevronDown } from '@tamagui/lucide-icons'
import { removeContactForUserURL } from '@/constants/Apis';
import { useState, useEffect } from 'react';
import { Loader } from '@/components/Loader';
import { getContactByIdURL } from '@/constants/Apis';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useAuth } from '@/components/AuthContext';


export default function ContactPage() {
  const { id } = useLocalSearchParams();
  
  const [contact, setContact] = useState([]);
  const [loading, setLoading] = useState(true);

  const [errorReceived, setErrorReceived] = useState(false);

  const { token, setToken } = useAuth();
  
  useEffect(() => {
      fetchContactById();
  }, []);

  const fetchContactById = async () => {
    const requestBody = {
        user_token: token,
        contact_id: id
    }

    console.log("Sending FetchContactById request to", getContactByIdURL, "with body:", requestBody);

      try {
          const response = await axios.post(getContactByIdURL, requestBody);
          console.log(response.data);
          setContact(response.data);
          setLoading(false);
          setErrorReceived(false);
      } catch (error) {
          console.error('Error fetching data:', error);
          setLoading(false);
          setErrorReceived(true);
      }
  };

  // Send data to backend and redirect to contact page
  const router = useRouter();

  const removeContact = async () => {
    const requestBody = {
        user_token: token,
        contactId: id
    }

    console.log("Removing contact with ID:", id);

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
    router.push({ pathname: '/add', params: { id: id } });
  }

  function getDateString(date: Date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    return `${year}-${month}-${day}`
  }

  function nextContactDate(lastcontact: string, weeks: number, months: number) {
    console.log(`Calculating next contact date with lastcontact=${lastcontact}, weeks=${weeks}, months=${months}`)
    const lastContactDate = new Date(lastcontact);
    let nextContactDate = new Date(lastContactDate);
    nextContactDate.setMonth(lastContactDate.getMonth() + months);
    nextContactDate.setDate(lastContactDate.getDate() + (weeks * 7));

    return getDateString(nextContactDate)
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
        <YStack alignSelf='flex-start' paddingLeft="$2">
          {console.log("contact", contact)}
          {contact.socials && contact.socials.map((social, index) => (
              <Group orientation="horizontal" className='py-1' key={`social-${index}`}>
                <Group.Item>
                  <View className="border rounded-md border-slate-200 p-1 justify-center">
                    <Text>{social.label}</Text>
                  </View>
                </Group.Item>
                <Group.Item>
                  <Button className="border rounded-md border-slate-200 p-1 justify-center" backgroundColor="white">{social.address}</Button>
                </Group.Item>
              </Group>
          ))}
        </YStack>

        {/* Bio and Notes Stack */}
        <Paragraph className="font-bold" size="$6" color="gray">
          About
        </Paragraph>
        <YStack alignSelf='flex-start' space="$2" paddingLeft="$2">
          <YStack space="$1">
            <Paragraph className="font-bold" size="$4" color="gray">Met through</Paragraph>
            <Paragraph borderStyle="solid" borderColor="lightgray" borderWidth={1} borderRadius={4} padding={10}>{contact.metthrough}</Paragraph>
          </YStack>
          <YStack space="$1">
            <Paragraph className="font-bold" size="$4" color="gray">User Bio</Paragraph>
            <Paragraph borderStyle="solid" borderColor="lightgray" borderWidth={1} borderRadius={4} padding={10}>{contact.userbio}</Paragraph>
          </YStack>
        </YStack>

        {/* Stats Stack */}
        <Paragraph className="font-bold" size="$6" color="gray">
          Outreach Stats
        </Paragraph>
        <XStack alignSelf='flex-start' space="$5" paddingLeft="$2">
          <YStack space="$1">
            <Paragraph className="font-bold" size="$4" color="gray">Previous:</Paragraph>
            <Paragraph borderStyle="solid" borderColor="lightgray" borderWidth={1} borderRadius={4} paddingLeft={10} paddingRight={10}>{contact.lastcontact}</Paragraph>
          </YStack>
          <YStack space="$1">
            <Paragraph className="font-bold" size="$4" color="gray">Frequency:</Paragraph>
            <Paragraph borderStyle="solid" borderColor="lightgray" borderWidth={1} borderRadius={4} paddingLeft={10} paddingRight={10}>
              {(contact.remind_in_months !== 0) && `${contact.remind_in_months} months`}
              {(contact.remind_in_weeks !== 0) && `${contact.remind_in_weeks} weeks`}
            </Paragraph>
          </YStack>
          <YStack space="$1">
            <Paragraph className="font-bold" size="$4" color="gray">Next:</Paragraph>
            <Paragraph borderStyle="solid" borderColor="lightgray" borderWidth={1} borderRadius={4} paddingLeft={10} paddingRight={10}>
              {contact.nextcontact}
            </Paragraph>
          </YStack>
        </XStack>
        
        {/* Tags Stack */}
        <Paragraph className="font-bold" size="$6" color="gray">
          Tags
        </Paragraph>
        {/* Dynamically Render Contact's Tags */}
        {contact.tags && 
        <XStack className="border rounded-md border-slate-200 flex-wrap items-start justify-start  mt-2 p-1" space="$2" rowGap="$2">  
        {contact.tags.map((tag, index) => (
          <Button key={`tag-${index}`} size="$2" backgroundColor="lightgray" borderWidth={2} borderColor="gray">{tag}</Button>
        ))}
        </XStack>
        }
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
