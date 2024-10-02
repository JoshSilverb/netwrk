import React from "react";

import { Contact } from '@/constants/Definitions';
import { Link } from 'expo-router';
import { ChevronDown } from '@tamagui/lucide-icons'
import { Accordion, Paragraph, Square, Avatar, XStack, YStack, SizableText, View, Button } from 'tamagui'

const ProfileCard = ({ contact, keyNum } : { contact : Contact, keyNum : number}) => {
    const contactLinkUrl = "/contact/" + contact.id;

    return (
        <Accordion overflow="hidden" type="multiple" marginBottom={10}>
            <Accordion.Item value={String(keyNum)}>
                <Accordion.Trigger flexDirection="row" justifyContent="space-between">
                    {({
                    open,
                    }: {
                    open: boolean
                    }) => (
                    <>
                        <XStack alignSelf="center" alignItems="center" gap="$6">
                            <Avatar circular size="$3">
                                <Avatar.Image
                                accessibilityLabel="Cam"
                                src="https://images.unsplash.com/photo-1548142813-c348350df52b?&w=150&h=150&dpr=2&q=80"
                                />
                            </Avatar>
                            <YStack>
                                <YStack alignItems="center" gap="$2">
                                    <SizableText fontWeight="bold">{contact.fullname}</SizableText>
                                </YStack>
                                <YStack alignItems="center" gap="$2">
                                    <SizableText fontWeight="normal">{contact.location}</SizableText> 
                                </YStack>
                            </YStack>
                        </XStack>

                        <Square  rotate={open ? '180deg' : '0deg'}>
                        <ChevronDown size="$1" />
                        </Square>
                    </>
                    )}
                </Accordion.Trigger>
                <View flexDirection="row">
                    <View>
                    <Accordion.Content  flex={1} exitStyle={{ opacity: 0 }}>
                        <YStack alignSelf="center">
                            <Paragraph className="pb-2">{contact.userbio}</Paragraph>
                            <Link href={contactLinkUrl} key={keyNum} asChild >
                                <Button>More...</Button>
                            </Link>
                        </YStack>
                    </Accordion.Content>
                    </View>
                </View>
            </Accordion.Item>
        </Accordion>
    );
};

export default ProfileCard