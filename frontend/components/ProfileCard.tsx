import React from 'react';
import { Contact } from '@/constants/Definitions';
import { useRouter } from 'expo-router';
import { User as UserIcon } from '@tamagui/lucide-icons';
import { Avatar, XStack, YStack, SizableText, View } from 'tamagui';
import { Pressable } from 'react-native';
import { SPACING, TYPOGRAPHY } from '@/constants/Styles';

const ProfileCard = ({
    contact,
}: {
    contact: Contact & { tags?: string[]; lastcontact?: string };
}) => {
    const router = useRouter();

    const handlePress = () => {
        router.push(`/contact/${contact.contact_id}`);
    };

    const displayBio = contact.userbio || (contact.is_linked ? contact.linked_user_bio : null);
    const isProfileBio = contact.is_linked && !contact.userbio && !!contact.linked_user_bio;
    const subtitle = displayBio
        ? displayBio
        : contact.lastcontact
        ? `Last: ${contact.lastcontact}`
        : '';

    return (
        <Pressable onPress={handlePress}>
            {({ pressed }) => (
                <XStack
                    alignItems="center"
                    gap={SPACING.md}
                    paddingHorizontal={SPACING.md}
                    paddingVertical={SPACING.sm + 2}
                    borderBottomWidth={1}
                    borderBottomColor="$borderColor"
                    backgroundColor={pressed ? '$gray2' : '$background'}
                >
                    <Avatar circular size="$4">
                        {(contact.is_linked ? (contact.linked_user_profile_pic_url || contact.profile_pic_url) : contact.profile_pic_url) ? (
                            <Avatar.Image
                                accessibilityLabel={contact.fullname}
                                src={(contact.is_linked ? (contact.linked_user_profile_pic_url || contact.profile_pic_url) : contact.profile_pic_url)!}
                            />
                        ) : (
                            <Avatar.Fallback backgroundColor="$color3" alignItems="center" justifyContent="center">
                                <UserIcon size={20} color="$gray9" />
                            </Avatar.Fallback>
                        )}
                    </Avatar>

                    <YStack flex={1} gap={2}>
                        <SizableText
                            fontSize={TYPOGRAPHY.sizes.md}
                            fontWeight={TYPOGRAPHY.weights.bold}
                            numberOfLines={1}
                        >
                            {contact.fullname}
                        </SizableText>

                        {subtitle ? (
                            <XStack alignItems="center" gap={5}>
                                {isProfileBio && (
                                    <View
                                        width={6}
                                        height={6}
                                        borderRadius={3}
                                        backgroundColor="#14B8A6"
                                        flexShrink={0}
                                    />
                                )}
                                <SizableText
                                    fontSize={TYPOGRAPHY.sizes.sm}
                                    color="$gray10"
                                    numberOfLines={1}
                                    flex={1}
                                >
                                    {subtitle}
                                </SizableText>
                            </XStack>
                        ) : null}
                    </YStack>

                    {(contact.is_linked ? (contact.linked_user_location || contact.location) : contact.location) ? (
                        <SizableText
                            fontSize={TYPOGRAPHY.sizes.xs}
                            color="$gray9"
                            numberOfLines={1}
                            maxWidth={100}
                            textAlign="right"
                        >
                            {contact.is_linked ? (contact.linked_user_location || contact.location) : contact.location}
                        </SizableText>
                    ) : null}
                </XStack>
            )}
        </Pressable>
    );
};

export default ProfileCard;
