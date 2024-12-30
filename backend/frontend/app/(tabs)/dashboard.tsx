import { Text, View } from 'react-native';
import { useState, useEffect } from 'react';

import ContactsList from '@/components/ContactsList'
import { Link } from 'expo-router';
import { Button, YStack, ScrollView } from 'tamagui';
import axios from 'axios';
import { getContactsForUserURL } from '@/constants/Apis';
import { Loader } from '@/components/Loader';
import { useAuth } from '@/components/AuthContext';


export default function DashboardScreen() {

    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);

    const { token, setToken } = useAuth();

    console.log(token);

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        try {
            const response = await axios.get(getContactsForUserURL);
            setContacts(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    return (
        <View className="flex-1 bg-white">
        <ScrollView>
        {/* Scrolling Stack */}
        <YStack space="$5" marginBottom="$5">
            {/* Featured Contacts Stack */}
            <YStack marginLeft={20} marginRight={20}>
                <Text className="block mb-2 mx-2 text-base font-medium text-gray-900 dark:text-white 	">
                    FEATURED CONTACTS
                </Text>
                <Loader loading={loading} >
                    <ContactsList contacts={contacts.slice(0,3)} address={"/(tabs)/contacts"} />
                </Loader>
                <Link href='/(tabs)/contacts' asChild><Button>See All</Button></Link>
            </YStack>
            {/* Nearby Contacts Stack */}
            <YStack marginLeft={20} marginRight={20}>
                <Text className="block mb-2 mx-2 text-base font-medium text-gray-900 dark:text-white 	">
                    NEARBY CONTACTS
                </Text>
                <Loader loading={loading} >
                    <ContactsList contacts={contacts.slice(4,7)} address={"/(tabs)/contacts"} />
                </Loader>
                <Link href='/(tabs)/contacts' asChild><Button>See All</Button></Link>
            </YStack>
        </YStack>
        </ScrollView>
        </View>
    );
}
