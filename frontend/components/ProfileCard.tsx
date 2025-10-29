import React from "react";

import { Contact } from '@/constants/Definitions';
import { Link, useRouter } from 'expo-router';
import { ChevronDown, User as UserIcon } from '@tamagui/lucide-icons'
import { Accordion, Paragraph, Square, Avatar, XStack, YStack, SizableText, View, Button } from 'tamagui'
import { SPACING, TYPOGRAPHY, CONTAINER_STYLES } from '@/constants/Styles';

const ProfileCard = ({ 
    contact, 
    keyNum, 
    onMorePressCallback 
} : { 
    contact: Contact, 
    keyNum: number, 
    onMorePressCallback?: () => void
}) => {

    const contactLinkUrl = "/contact/" + contact.contact_id;

    const router = useRouter();
    
    const callCallbackAndRedirect = async () => {
        // Call parent-provided callback if given.
        onMorePressCallback?.();

        // Redirect to contact page
        router.push(contactLinkUrl);
    }

    return (
        <Accordion
            overflow="hidden"
            type="multiple"
            marginBottom={SPACING.sm}
            borderRadius={SPACING.sm}
            borderWidth={1}
            borderColor="$borderColor"
            backgroundColor="$background"
            collapsable={false}
        >
            <Accordion.Item value={String(keyNum)}>
                <Accordion.Trigger 
                    flexDirection="row" 
                    justifyContent="space-between"
                    padding={SPACING.md}
                >
                    {({
                    open,
                    }: {
                    open: boolean
                    }) => (
                    <>
                        <XStack alignItems="center" gap={SPACING.md} flex={1}>
                            <Avatar circular size="$4">
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
                            
                            <YStack flex={1} alignItems="flex-start">
                                <SizableText 
                                    fontSize={TYPOGRAPHY.sizes.md}
                                    fontWeight={TYPOGRAPHY.weights.bold}
                                    numberOfLines={1}
                                >
                                    {contact.fullname}
                                </SizableText>
                                <SizableText 
                                    fontSize={TYPOGRAPHY.sizes.sm}
                                    color="$gray10"
                                    numberOfLines={1}
                                >
                                    {contact.location}
                                </SizableText>
                            </YStack>
                        </XStack>

                        <Square rotate={open ? '180deg' : '0deg'}>
                            <ChevronDown size="$1" />
                        </Square>
                    </>
                    )}
                </Accordion.Trigger>
                <Accordion.Content 
                    exitStyle={{ opacity: 0 }}
                    padding={SPACING.md}
                    paddingTop={0}
                >
                    <YStack space={SPACING.sm}>
                        <Paragraph 
                            fontSize={TYPOGRAPHY.sizes.sm}
                            color="$gray11"
                            numberOfLines={3}
                        >
                            {contact.userbio}
                        </Paragraph>
                            <Button
                                size="$2"
                                backgroundColor="$blue9"
                                color="white"
                                alignSelf="flex-start"
                                onPress={callCallbackAndRedirect}
                                pressStyle={{ opacity: 0.8, backgroundColor: '$blue10' }}
                                focusStyle={{ backgroundColor: '$blue10' }}
                            >
                                More...
                            </Button>
                        {/* </Link> */}
                    </YStack>
                </Accordion.Content>
            </Accordion.Item>
        </Accordion>
    );
};

export default ProfileCard