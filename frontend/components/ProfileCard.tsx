import React from 'react';
import { Contact } from '@/constants/Definitions';
import { useRouter } from 'expo-router';
import { ChevronRight, User as UserIcon } from '@tamagui/lucide-icons';
import { Avatar, XStack, YStack, SizableText, View } from 'tamagui';
import { Pressable } from 'react-native';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/constants/Styles';

const ProfileCard = ({
    contact,
}: {
    contact: Contact & { tags?: string[]; lastcontact?: string };
}) => {
    const router = useRouter();

    const handlePress = () => {
        router.push(`/contact/${contact.contact_id}`);
    };

    return (
        <Pressable onPress={handlePress}>
            {({ pressed }) => (
                <XStack
                    alignItems="center"
                    space={SPACING.md}
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

                    <YStack flex={1} space={SPACING.xs}>
                        <SizableText
                            fontSize={TYPOGRAPHY.sizes.md}
                            fontWeight={TYPOGRAPHY.weights.bold}
                            numberOfLines={1}
                        >
                            {contact.fullname}
                        </SizableText>

                        {contact.location ? (
                            <SizableText
                                fontSize={TYPOGRAPHY.sizes.sm}
                                color="$gray10"
                                numberOfLines={1}
                            >
                                {contact.location}
                            </SizableText>
                        ) : null}

                        {contact.tags && contact.tags.length > 0 ? (
                            <XStack flexWrap="wrap" gap={SPACING.xs} marginTop={2}>
                                {contact.tags.slice(0, 3).map((tag) => (
                                    <View
                                        key={tag}
                                        backgroundColor="$gray3"
                                        borderRadius={BORDER_RADIUS.xs}
                                        paddingHorizontal={SPACING.xs}
                                        paddingVertical={2}
                                    >
                                        <SizableText fontSize={TYPOGRAPHY.sizes.xs} color="$gray11">
                                            {tag}
                                        </SizableText>
                                    </View>
                                ))}
                            </XStack>
                        ) : contact.lastcontact ? (
                            <SizableText fontSize={TYPOGRAPHY.sizes.xs} color="$gray9">
                                Last contacted {contact.lastcontact}
                            </SizableText>
                        ) : null}
                    </YStack>

                    <ChevronRight size={16} color="$gray8" />
                </XStack>
            )}
        </Pressable>
    );
};

export default ProfileCard;
