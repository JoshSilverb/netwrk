import React from 'react';
import { Stack, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { View, Text, Button, XStack, YStack, Avatar, ScrollView } from 'tamagui';
import { User as UserIcon, MapPin } from '@tamagui/lucide-icons';
import { removeContactForUserURL, getContactByIdURL } from '@/constants/Apis';
import { Alert, StyleSheet } from 'react-native';
import { useCallback } from 'react';
import { Loader } from '@/components/Loader';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useAuth } from '@/components/AuthContext';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/constants/Styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/QueryKeys';

const TEAL = '#14B8A6';
const NAVY = '#0F172A';

function SectionCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <YStack
      backgroundColor="$background"
      borderRadius={12}
      marginHorizontal={SPACING.md}
      marginBottom={SPACING.sm}
      borderWidth={1}
      borderColor="$borderColor"
      overflow="hidden"
    >
      <XStack paddingHorizontal={SPACING.md} paddingTop={SPACING.md} paddingBottom={SPACING.xs}>
        <Text fontSize={11} fontWeight="600" color="$gray9" textTransform="uppercase" letterSpacing={0.8}>
          {label}
        </Text>
      </XStack>
      <YStack paddingHorizontal={SPACING.md} paddingBottom={SPACING.md}>
        {children}
      </YStack>
    </YStack>
  );
}

function ScheduleRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <XStack justifyContent="space-between" alignItems="center" paddingVertical={SPACING.xs}
      borderBottomWidth={1} borderBottomColor="$borderColor">
      <Text fontSize={TYPOGRAPHY.sizes.sm} color="$gray10">{label}</Text>
      <Text fontSize={TYPOGRAPHY.sizes.sm} fontWeight="600" color={accent ? TEAL : '$color'}>
        {value}
      </Text>
    </XStack>
  );
}

export default function ContactPage() {
  const { id } = useLocalSearchParams();
  const { token } = useAuth() as { token: string | null };
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
      'Delete Contact',
      `Are you sure you want to delete ${contact.fullname || 'this contact'}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() },
      ]
    );
  };

  const editContact = () => {
    router.push({ pathname: '/(tabs)/add', params: { id } });
  };

  if (isError) {
    return (
      <View style={{ flex: 1 }}>
        <Stack.Screen options={{ title: 'Error', headerBackTitle: 'Back' }} />
        <Text>Could not find contact</Text>
      </View>
    );
  }

  const frequency =
    contact.remind_in_weeks != null
      ? `Every ${contact.remind_in_weeks} week${contact.remind_in_weeks !== 1 ? 's' : ''}`
      : contact.remind_in_months != null
      ? `Every ${contact.remind_in_months} month${contact.remind_in_months !== 1 ? 's' : ''}`
      : null;

  return (
    <View style={{ flex: 1 }} backgroundColor="$background">
      <Stack.Screen options={{ title: '', headerBackTitle: 'Back', headerTintColor: '#14B8A6' }} />

      <YStack flex={1} position="relative">
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}>
          <Loader loading={isLoading}>
            {/* Hero header */}
            <View style={styles.heroBackground} />
            <YStack alignItems="center" paddingTop={SPACING.xl} paddingBottom={SPACING.lg} gap={SPACING.sm}>
              <Avatar circular size="$12">
                {contact.profile_pic_url ? (
                  <Avatar.Image accessibilityLabel={contact.fullname} src={contact.profile_pic_url} />
                ) : (
                  <Avatar.Fallback backgroundColor="$color3" alignItems="center" justifyContent="center">
                    <UserIcon size={28} color="$gray9" />
                  </Avatar.Fallback>
                )}
              </Avatar>

              <Text
                fontSize={TYPOGRAPHY.sizes.title}
                fontWeight="700"
                textAlign="center"
                paddingHorizontal={SPACING.lg}
              >
                {contact.fullname}
              </Text>

              {contact.location ? (
                <XStack alignItems="center" gap={4}>
                  <MapPin size={13} color={TEAL} />
                  <Text fontSize={TYPOGRAPHY.sizes.sm} color="$gray10">{contact.location}</Text>
                </XStack>
              ) : null}
            </YStack>

            {/* How you met */}
            <SectionCard label="How you met">
              <Text fontSize={TYPOGRAPHY.sizes.sm} color={contact.metthrough ? '$color' : '$gray9'}
                fontStyle={contact.metthrough ? 'normal' : 'italic'}>
                {contact.metthrough || 'No information provided'}
              </Text>
            </SectionCard>

            {/* Notes */}
            <SectionCard label="Notes">
              <Text fontSize={TYPOGRAPHY.sizes.sm} color={contact.userbio ? '$color' : '$gray9'}
                fontStyle={contact.userbio ? 'normal' : 'italic'}>
                {contact.userbio || 'No notes added'}
              </Text>
            </SectionCard>

            {/* Contact Schedule */}
            <SectionCard label="Contact Schedule">
              {contact.lastcontact ? (
                <ScheduleRow label="Last Contact" value={contact.lastcontact} />
              ) : null}
              {frequency ? (
                <ScheduleRow label="Frequency" value={frequency} />
              ) : null}
              {contact.nextcontact ? (
                <ScheduleRow label="Next Contact" value={contact.nextcontact} accent />
              ) : null}
              {!contact.lastcontact && !frequency && !contact.nextcontact ? (
                <Text fontSize={TYPOGRAPHY.sizes.sm} color="$gray9" fontStyle="italic">
                  No schedule set
                </Text>
              ) : null}
            </SectionCard>

            {/* Tags */}
            <SectionCard label="Tags">
              {contact.tags && contact.tags.length > 0 ? (
                <XStack flexWrap="wrap" gap={SPACING.xs}>
                  {contact.tags.map((tag: string, index: number) => (
                    <View key={`tag-${index}`} style={styles.tagPill}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </XStack>
              ) : (
                <Text fontSize={TYPOGRAPHY.sizes.sm} color="$gray9" fontStyle="italic">
                  No tags added
                </Text>
              )}
            </SectionCard>

            {/* Contact Info / Socials */}
            <SectionCard label="Contact Info">
              {contact.socials && contact.socials.length > 0 ? (
                <YStack>
                  {contact.socials.map((social: { label: string; address: string }, index: number) => (
                    <XStack
                      key={`social-${index}`}
                      gap={SPACING.sm}
                      alignItems="center"
                      paddingVertical={SPACING.xs}
                      borderBottomWidth={index < contact.socials.length - 1 ? 1 : 0}
                      borderBottomColor="$borderColor"
                    >
                      <Text fontSize={TYPOGRAPHY.sizes.sm} fontWeight="600" color={TEAL} minWidth={80}>
                        {social.label}
                      </Text>
                      <Text fontSize={TYPOGRAPHY.sizes.sm} flex={1} color="$color">
                        {social.address}
                      </Text>
                    </XStack>
                  ))}
                </YStack>
              ) : (
                <Text fontSize={TYPOGRAPHY.sizes.sm} color="$gray9" fontStyle="italic">
                  No contact info added
                </Text>
              )}
            </SectionCard>
          </Loader>
        </ScrollView>

        {/* Bottom Action Bar */}
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
          shadowOpacity={0.08}
          shadowRadius={4}
          elevation={4}
        >
          <XStack gap={SPACING.sm}>
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
              onPress={editContact}
              size="$4"
              backgroundColor={TEAL}
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

const styles = StyleSheet.create({
  heroBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 130,
    backgroundColor: NAVY,
  },
  tagPill: {
    backgroundColor: 'rgba(20, 184, 166, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.25)',
  },
  tagText: {
    fontSize: 12,
    color: TEAL,
    fontWeight: '500',
  },
});
