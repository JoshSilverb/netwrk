import React from "react";

import { Contact } from '@/constants/Definitions';
import { Link } from 'expo-router';
import { ChevronDown } from '@tamagui/lucide-icons'
import { Accordion, Paragraph, Square, Avatar, XStack, YStack, SizableText, View, Button } from 'tamagui'
import { SPACING, TYPOGRAPHY, CONTAINER_STYLES } from '@/constants/Styles';

const ProfileCard = ({ contact, keyNum } : { contact : Contact, keyNum : number}) => {
    const contactLinkUrl = "/contact/" + contact.contact_id;

    return (
        <Accordion 
            overflow="hidden" 
            type="multiple" 
            marginBottom={SPACING.sm}
            borderRadius={SPACING.sm}
            borderWidth={1}
            borderColor="$borderColor"
            backgroundColor="$background"
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
                                <Avatar.Image
                                accessibilityLabel={contact.fullname}
                                src={contact.profile_pic_url || "https://images.unsplash.com/photo-1548142813-c348350df52b?&w=150&h=150&dpr=2&q=80"}
                                />
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
                        <Link href={contactLinkUrl} key={keyNum} asChild >
                            <Button 
                                size="$2" 
                                backgroundColor="$blue9" 
                                color="white"
                                alignSelf="flex-start"
                            >
                                More...
                            </Button>
                        </Link>
                    </YStack>
                </Accordion.Content>
            </Accordion.Item>
        </Accordion>
    );
};

export default ProfileCard