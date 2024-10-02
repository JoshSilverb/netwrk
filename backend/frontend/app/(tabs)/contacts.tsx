import { useState, useEffect } from 'react';
import { Text, View } from '@/components/Themed';
import  ContactsList from '@/components/ContactsList'
import { ScrollView, YStack, Paragraph } from 'tamagui';
import { Loader } from '@/components/Loader';
import { getContactsForUserURL } from '@/constants/Apis';
import axios from 'axios';

export default function contactsScreen() {
    
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);

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
        <View className="flex-1 justify-start bg-white	">
            <ScrollView>
                <Paragraph className="block mb-2 mx-2 text-base font-medium">
                    Sort by...
                </Paragraph>
                <YStack >
                    <Loader loading={loading}>
                        <ContactsList contacts={contacts}/>
                    </Loader>
                </YStack>
            </ScrollView>
        </View>
    );

}
