import React from 'react';
import { Stack, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { View, Text, Button, Paragraph, XStack, YStack, Avatar, ScrollView, Separator } from 'tamagui';
import { User as UserIcon } from '@tamagui/lucide-icons'
import { removeContactForUserURL, getContactByIdURL } from '@/constants/Apis';
import { Alert } from 'react-native';
import { useCallback } from 'react';
import { Loader } from '@/components/Loader';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useAuth } from '@/components/AuthContext';
import { SPACING, TYPOGRAPHY, CONTAINER_STYLES, BORDER_RADIUS } from '@/constants/Styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/QueryKeys';


export default function ContactPage() {
  const { id } = useLocalSearchParams();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: contact = {}, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.contact(id as string),
    queryFn: async () => {
      const response = await axios.post(getContactByIdURL, {
        user_token: token,
        contact_id: id,
      });
      return response.data;
    },
  });

  // Refetch on screen focus only if the query was invalidated (no-op when fresh)
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [])
  );

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await axios.post(removeContactForUserURL, { user_token: token, contact_id: id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      router.replace('/(tabs)/contacts/');
    },
    onError: () => {
      if (__DEV__) console.error('Error deleting contact');
    },
  });

  const confirmAndRemoveContact = () => {
    Alert.alert(
      "Delete Contact",
      `Are you sure you want to delete ${contact.fullname || 'this contact'}? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate() },
      ]
    );
  };
  
  const editContact = async () => {
    router.push({ pathname: '/(tabs)/add', params: { id: id } });
  }

  if (isError) {
    return (
      <View style={{ flex: 1 }}>
        <Stack.Screen options={{ title: "Error", headerBackTitle: 'Back' }} />
        <Paragraph>Could not find contact</Paragraph>
      </View>)
  }

  return (
    <View style={CONTAINER_STYLES.screen} backgroundColor="$background">
      <Stack.Screen options={{ title: "", headerBackTitle: 'Back' }} />

      <YStack flex={1} position="relative">
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}>
      <YStack space={SPACING.xl} paddingVertical={SPACING.lg}>
        <Loader loading={isLoading}>
        {/* Header */}
        <YStack
          alignSelf="center"
          alignItems='center'
          space={SPACING.md}
          paddingVertical={SPACING.lg}
          paddingBottom={SPACING.xl}
          paddingHorizontal={SPACING.lg}
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
        <YStack paddingVertical={SPACING.md} paddingHorizontal={SPACING.lg} borderTopWidth={1} borderTopColor="$borderColor">
          <Text
            fontSize={TYPOGRAPHY.sizes.xs}
            fontWeight={TYPOGRAPHY.weights.medium}
            color="$gray12"
            textTransform="uppercase"
            letterSpacing={0.5}
            marginBottom={SPACING.xs}
          >
            How you met
          </Text>
          <Text fontSize={TYPOGRAPHY.sizes.sm}>
            {contact.metthrough || "No information provided"}
          </Text>
        </YStack>

        {/* Notes */}
        <YStack paddingVertical={SPACING.md} paddingHorizontal={SPACING.lg} borderTopWidth={1} borderTopColor="$borderColor">
          <Text
            fontSize={TYPOGRAPHY.sizes.xs}
            fontWeight={TYPOGRAPHY.weights.medium}
            color="$gray12"
            textTransform="uppercase"
            letterSpacing={0.5}
            marginBottom={SPACING.xs}
          >
            Notes
          </Text>
          <Text fontSize={TYPOGRAPHY.sizes.sm}>
            {contact.userbio || "No notes added"}
          </Text>
        </YStack>

        {/* Contact Schedule */}
        <YStack paddingVertical={SPACING.md} paddingHorizontal={SPACING.lg} borderTopWidth={1} borderTopColor="$borderColor">
          <Text
            fontSize={TYPOGRAPHY.sizes.xs}
            fontWeight={TYPOGRAPHY.weights.medium}
            color="$gray12"
            textTransform="uppercase"
            letterSpacing={0.5}
            marginBottom={SPACING.sm}
          >
            Contact Schedule
          </Text>

          <XStack justifyContent="space-between" alignItems="center" paddingVertical={SPACING.xs}>
            <Text fontSize={TYPOGRAPHY.sizes.sm} color="$gray10">Last Contact</Text>
            <Text fontSize={TYPOGRAPHY.sizes.sm} fontWeight={TYPOGRAPHY.weights.medium}>
              {contact.lastcontact}
            </Text>
          </XStack>

          {(contact.remind_in_weeks != null || contact.remind_in_months != null) && (
            <>
              <Separator marginVertical={SPACING.xs} />
              <XStack justifyContent="space-between" alignItems="center" paddingVertical={SPACING.xs}>
                <Text fontSize={TYPOGRAPHY.sizes.sm} color="$gray10">Frequency</Text>
                <Text fontSize={TYPOGRAPHY.sizes.sm} fontWeight={TYPOGRAPHY.weights.medium}>
                  {(contact.remind_in_months !== 0) && `${contact.remind_in_months} months`}
                  {(contact.remind_in_weeks !== 0) && `${contact.remind_in_weeks} weeks`}
                </Text>
              </XStack>

              <Separator marginVertical={SPACING.xs} />

              <XStack justifyContent="space-between" alignItems="center" paddingVertical={SPACING.xs}>
                <Text fontSize={TYPOGRAPHY.sizes.sm} color="$gray10">Next Contact</Text>
                <Text
                  fontSize={TYPOGRAPHY.sizes.sm}
                  fontWeight={TYPOGRAPHY.weights.bold}
                  color="$gray12"
                >
                  {contact.nextcontact}
                </Text>
              </XStack>
            </>
          )}
        </YStack>
        
        {/* Tags */}
        <YStack paddingVertical={SPACING.md} paddingHorizontal={SPACING.lg} borderTopWidth={1} borderTopColor="$borderColor" space={SPACING.sm}>
          <Text
            fontSize={TYPOGRAPHY.sizes.xs}
            fontWeight={TYPOGRAPHY.weights.medium}
            color="$gray12"
            textTransform="uppercase"
            letterSpacing={0.5}
          >
            Tags
          </Text>

          {contact.tags && contact.tags.length > 0 ? (
            <XStack flexWrap="wrap" gap={SPACING.xs}>
              {contact.tags.map((tag, index) => (
                <View
                  key={`tag-${index}`}
                  backgroundColor="$gray3"
                  borderRadius={BORDER_RADIUS.xs}
                  paddingHorizontal={SPACING.xs}
                  paddingVertical={2}
                >
                  <Text fontSize={TYPOGRAPHY.sizes.xs} color="$gray11">
                    {tag}
                  </Text>
                </View>
              ))}
            </XStack>
          ) : (
            <Text fontSize={TYPOGRAPHY.sizes.sm} color="$gray9" fontStyle="italic">
              No tags added
            </Text>
          )}
        </YStack>

        {/* Contact Info */}
        <YStack paddingVertical={SPACING.md} paddingHorizontal={SPACING.lg} borderTopWidth={1} borderTopColor="$borderColor" space={SPACING.sm}>
          <Text
            fontSize={TYPOGRAPHY.sizes.xs}
            fontWeight={TYPOGRAPHY.weights.medium}
            color="$gray12"
            textTransform="uppercase"
            letterSpacing={0.5}
          >
            Contact Info
          </Text>

          {contact.socials && contact.socials.length > 0 ? (
            <YStack>
              {contact.socials.map((social, index) => (
                <React.Fragment key={`social-${index}`}>
                  {index > 0 && <Separator marginVertical={SPACING.xs} />}
                  <XStack space={SPACING.sm} alignItems="center" paddingVertical={SPACING.xs}>
                    <Text
                      fontSize={TYPOGRAPHY.sizes.sm}
                      fontWeight={TYPOGRAPHY.weights.medium}
                      color="$gray10"
                      minWidth={80}
                    >
                      {social.label}
                    </Text>
                    <Text fontSize={TYPOGRAPHY.sizes.sm} flex={1}>
                      {social.address}
                    </Text>
                  </XStack>
                </React.Fragment>
              ))}
            </YStack>
          ) : (
            <Text fontSize={TYPOGRAPHY.sizes.sm} color="$gray9" fontStyle="italic">
              No contact info added
            </Text>
          )}
        </YStack>
        </Loader>
      </YStack>
      </ScrollView>        
      
      {/* Bottom Action Buttons */}
      <View
        position="absolute"
        bottom={insets.bottom}
        left={0}
        right={0}
        padding={SPACING.md}
        backgroundColor="$background"
        borderTopWidth={1}
        borderTopColor="$borderColor"
        shadowColor="$shadowColor"
        shadowOffset={{ width: 0, height: -2 }}
        shadowOpacity={0.1}
        shadowRadius={4}
        elevation={4}
      >
        <XStack space={SPACING.sm}>
          <Button
            onPress={confirmAndRemoveContact}
            size="$4"
            variant="outlined"
            borderColor="$red9"
            color="$red9"
            fontSize={TYPOGRAPHY.sizes.md}
            fontWeight={TYPOGRAPHY.weights.bold}
            borderRadius={BORDER_RADIUS.md}
            flex={1}
          >
            Delete
          </Button>
          <Button
            size="$4"
            variant="outlined"
            fontSize={TYPOGRAPHY.sizes.md}
            fontWeight={TYPOGRAPHY.weights.bold}
            borderRadius={BORDER_RADIUS.md}
            flex={1}
          >
            Share
          </Button>
          <Button
            onPress={editContact}
            size="$4"
            backgroundColor="$blue9"
            color="white"
            fontSize={TYPOGRAPHY.sizes.md}
            fontWeight={TYPOGRAPHY.weights.bold}
            borderRadius={BORDER_RADIUS.md}
            flex={1}
          >
            Edit
          </Button>
        </XStack>
      </View>
      </YStack>
    </View>
  );
}
