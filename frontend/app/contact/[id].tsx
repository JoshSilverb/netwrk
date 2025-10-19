import { Stack, useLocalSearchParams } from 'expo-router';
import { Contact } from '@/constants/Definitions';
import { View, Text, Group, Button, Paragraph, XStack, YStack, Avatar, ScrollView, Accordion, Square } from 'tamagui';
import { ChevronUp, ChevronDown, User as UserIcon } from '@tamagui/lucide-icons'
import { removeContactForUserURL } from '@/constants/Apis';
import { useState, useEffect } from 'react';
import { Loader } from '@/components/Loader';
import { getContactByIdURL } from '@/constants/Apis';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useAuth } from '@/components/AuthContext';
import { SPACING, TYPOGRAPHY, CONTAINER_STYLES, BORDER_RADIUS } from '@/constants/Styles';


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
        contact_id: id
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
    router.push({ pathname: '/(tabs)/add', params: { id: id } });
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
    <View style={CONTAINER_STYLES.screen}>
      <Stack.Screen options={{ title: "" }} />

      <YStack flex={1} position="relative">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
      <YStack space={SPACING.xl} padding={SPACING.lg}>
        <Loader loading={loading}>
        {/* Header */}
        <YStack 
          alignSelf="center" 
          alignItems='center' 
          space={SPACING.md}
          paddingVertical={SPACING.lg}
        >
          <Avatar circular size="$10">
              {contact.profile_pic_url ? (
              <Avatar.Image
                  accessibilityLabel={contact.fullname}
                  src={contact.profile_pic_url}
              />
              ) : (
              <Avatar.Fallback backgroundColor="$color3" alignItems="center" justifyContent="center">
                  <UserIcon size={24} color="gray" />
              </Avatar.Fallback>
              )}
          </Avatar>

          <Text 
            fontSize={TYPOGRAPHY.sizes.title}
            fontWeight={TYPOGRAPHY.weights.bold}
            textAlign="center"
          >
            {contact.fullname}
          </Text>

          <Text 
            fontSize={TYPOGRAPHY.sizes.md}
            color="$gray10"
            textAlign="center"
          >
            {contact.location}
          </Text>
        </YStack>


        {/* How you met */}
        <YStack 
          space={SPACING.sm}
          padding={SPACING.md}
          marginVertical={SPACING.sm}
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius={BORDER_RADIUS.md}
          backgroundColor="$gray1"
        >
          <Text 
            fontSize={TYPOGRAPHY.sizes.md}
            fontWeight={TYPOGRAPHY.weights.medium}
            color="$gray11"
            marginBottom={SPACING.xs}
          >
            How you met
          </Text>
          <View 
            padding={SPACING.md}
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius={BORDER_RADIUS.sm}
            backgroundColor="$background"
          >
            <Text fontSize={TYPOGRAPHY.sizes.sm}>
              {contact.metthrough || "No information provided"}
            </Text>
          </View>
        </YStack>

        {/* Notes */}
        <YStack 
          space={SPACING.sm}
          padding={SPACING.md}
          marginVertical={SPACING.sm}
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius={BORDER_RADIUS.md}
          backgroundColor="$gray1"
        >
          <Text 
            fontSize={TYPOGRAPHY.sizes.md}
            fontWeight={TYPOGRAPHY.weights.medium}
            color="$gray11"
            marginBottom={SPACING.xs}
          >
            Notes
          </Text>
          <View 
            padding={SPACING.md}
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius={BORDER_RADIUS.sm}
            backgroundColor="$background"
          >
            <Text fontSize={TYPOGRAPHY.sizes.sm}>
              {contact.userbio || "No notes added"}
            </Text>
          </View>
        </YStack>

        {/* Contact Schedule */}
        <YStack 
          space={SPACING.md}
          padding={SPACING.md}
          marginVertical={SPACING.sm}
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius={BORDER_RADIUS.md}
          backgroundColor="$gray1"
        >
          <Text 
            fontSize={TYPOGRAPHY.sizes.md}
            fontWeight={TYPOGRAPHY.weights.medium}
            color="$gray11"
            marginBottom={SPACING.xs}
          >
            Contact Schedule
          </Text>
          
          <YStack space={SPACING.sm}>
            <XStack justifyContent="space-between" alignItems="center">
              <Text 
                fontSize={TYPOGRAPHY.sizes.sm}
                fontWeight={TYPOGRAPHY.weights.medium}
                color="$gray10"
                flex={1}
              >
                Last Contact:
              </Text>
              <View 
                padding={SPACING.sm}
                borderWidth={1}
                borderColor="$borderColor"
                borderRadius={BORDER_RADIUS.sm}
                backgroundColor="$background"
                flex={2}
              >
                <Text 
                  fontSize={TYPOGRAPHY.sizes.sm}
                  textAlign="center"
                >
                  {contact.lastcontact}
                </Text>
              </View>
            </XStack>
            
            <XStack justifyContent="space-between" alignItems="center">
              <Text 
                fontSize={TYPOGRAPHY.sizes.sm}
                fontWeight={TYPOGRAPHY.weights.medium}
                color="$gray10"
                flex={1}
              >
                Frequency:
              </Text>
              <View 
                padding={SPACING.sm}
                borderWidth={1}
                borderColor="$borderColor"
                borderRadius={BORDER_RADIUS.sm}
                backgroundColor="$background"
                flex={2}
              >
                <Text 
                  fontSize={TYPOGRAPHY.sizes.sm}
                  textAlign="center"
                >
                  {(contact.remind_in_months !== 0) && `${contact.remind_in_months} months`}
                  {(contact.remind_in_weeks !== 0) && `${contact.remind_in_weeks} weeks`}
                </Text>
              </View>
            </XStack>
            
            <XStack justifyContent="space-between" alignItems="center">
              <Text 
                fontSize={TYPOGRAPHY.sizes.sm}
                fontWeight={TYPOGRAPHY.weights.medium}
                color="$gray10"
                flex={1}
              >
                Next Contact:
              </Text>
              <View 
                padding={SPACING.sm}
                borderWidth={1}
                borderColor="$borderColor"
                borderRadius={BORDER_RADIUS.sm}
                backgroundColor="$blue2"
                flex={2}
              >
                <Text 
                  fontSize={TYPOGRAPHY.sizes.sm}
                  textAlign="center"
                  color="$blue11"
                  fontWeight={TYPOGRAPHY.weights.medium}
                >
                  {contact.nextcontact}
                </Text>
              </View>
            </XStack>
          </YStack>
        </YStack>
        
        {/* Tags */}
        <YStack 
          space={SPACING.sm}
          padding={SPACING.md}
          marginVertical={SPACING.sm}
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius={BORDER_RADIUS.md}
          backgroundColor="$gray1"
        >
          <Text 
            fontSize={TYPOGRAPHY.sizes.md}
            fontWeight={TYPOGRAPHY.weights.medium}
            color="$gray11"
            marginBottom={SPACING.xs}
          >
            Tags
          </Text>
          
          {contact.tags && contact.tags.length > 0 ? (
            <XStack 
              flexWrap="wrap" 
              gap={SPACING.xs}
              padding={SPACING.sm}
              borderRadius={BORDER_RADIUS.sm}
              backgroundColor="$gray2"
            >
              {contact.tags.map((tag, index) => (
                <View
                  key={`tag-${index}`}
                  backgroundColor="$blue4"
                  borderRadius={BORDER_RADIUS.xs}
                  paddingHorizontal={SPACING.xs}
                  paddingVertical={2}
                >
                  <Text 
                    fontSize={TYPOGRAPHY.sizes.xs}
                    color="$blue11"
                  >
                    {tag}
                  </Text>
                </View>
              ))}
            </XStack>
          ) : (
            <Text 
              fontSize={TYPOGRAPHY.sizes.sm}
              color="$gray9"
              fontStyle="italic"
            >
              No tags added
            </Text>
          )}
        </YStack>

        {/* Social Media */}
        <YStack 
          space={SPACING.md}
          padding={SPACING.md}
          marginVertical={SPACING.sm}
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius={BORDER_RADIUS.md}
          backgroundColor="$gray1"
        >
          <Text 
            fontSize={TYPOGRAPHY.sizes.md}
            fontWeight={TYPOGRAPHY.weights.medium}
            color="$gray11"
            marginBottom={SPACING.xs}
          >
            Social Media
          </Text>
          
          {console.log("contact", contact)}
          {contact.socials && contact.socials.length > 0 ? (
            contact.socials.map((social, index) => (
              <XStack 
                key={`social-${index}`}
                space={SPACING.xs}
                padding={SPACING.sm}
                borderWidth={1}
                borderColor="$borderColor"
                borderRadius={BORDER_RADIUS.sm}
                backgroundColor="$background"
                alignItems="center"
              >
                <Text 
                  fontSize={TYPOGRAPHY.sizes.sm}
                  fontWeight={TYPOGRAPHY.weights.medium}
                  color="$gray10"
                  minWidth={80}
                >
                  {social.label}:
                </Text>
                <Text 
                  fontSize={TYPOGRAPHY.sizes.sm}
                  flex={1}
                >
                  {social.address}
                </Text>
              </XStack>
            ))
          ) : (
            <Text 
              fontSize={TYPOGRAPHY.sizes.sm}
              color="$gray9"
              fontStyle="italic"
            >
              No social media added
            </Text>
          )}
        </YStack>
        </Loader>
      </YStack>
      </ScrollView>        
      
      {/* Bottom Action Buttons */}
      <XStack 
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        backgroundColor="$background"
        borderTopWidth={1}
        borderTopColor="$borderColor"
        padding={SPACING.md}
        justifyContent="space-between"
        alignItems="center"
        shadowColor="$shadowColor"
        shadowOffset={{ width: 0, height: -2 }}
        shadowOpacity={0.1}
        shadowRadius={4}
        elevation={4}
      >
        <Button 
          onPress={removeContact}
          size="$3"
          backgroundColor="$red9"
          color="white"
        >
          Delete
        </Button>
        <Button 
          size="$3"
          variant="outlined"
        >
          Share
        </Button>
        <Button 
          onPress={editContact}
          size="$3"
          backgroundColor="$blue9"
          color="white"
        >
          Edit
        </Button>
      </XStack>
      </YStack>
    </View>
  );
}
