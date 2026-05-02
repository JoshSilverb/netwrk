import React from 'react';
import { Contact } from '@/constants/Definitions';
import { useRouter } from 'expo-router';
import { User as UserIcon } from '@tamagui/lucide-icons';
import { Avatar, XStack, YStack, SizableText } from 'tamagui';
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

    const subtitle = contact.userbio
        ? contact.userbio
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
                        {contact.profile_pic_url ? (
                            <Avatar.Image
                                accessibilityLabel={contact.fullname}
                                src={contact.profile_pic_url}
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
                            <SizableText
                                fontSize={TYPOGRAPHY.sizes.sm}
                                color="$gray10"
                                numberOfLines={1}
                            >
                                {subtitle}
                            </SizableText>
                        ) : null}
                    </YStack>

                    {contact.location ? (
                        <SizableText
                            fontSize={TYPOGRAPHY.sizes.xs}
                            color="$gray9"
                            numberOfLines={1}
                            maxWidth={100}
                            textAlign="right"
                        >
                            {contact.location}
                        </SizableText>
                    ) : null}
                </XStack>
            )}
        </Pressable>
    );
};

export default ProfileCard;
