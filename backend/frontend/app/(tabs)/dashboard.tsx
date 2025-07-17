import { Text, View, RefreshControl } from 'react-native';
import { useState, useEffect } from 'react';

import ContactsList from '@/components/ContactsList'
import { Link } from 'expo-router';
import { Button, YStack, ScrollView } from 'tamagui';
import axios from 'axios';
import { searchContactsURL } from '@/constants/Apis';
import { Loader } from '@/components/Loader';
import { useAuth } from '@/components/AuthContext';

import { getCurrentLocation } from '@/utils/locationutil';

export default function DashboardScreen() {

    const [contacts, setContacts] = useState([]);
    const [nearbyContacts, setNearbyContacts] = useState([]);
    const [featLoading, setFeatLoading] = useState(true);
    const [nearbyLoading, setNearbyLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    // const [location, setLocation] = useState<Location.LocationObject | null>(null);
    // const [locErrorMsg, setLocErrorMsg] = useState<string | null>(null);
    const { token, setToken } = useAuth();

    console.log(token);

    useEffect(() => {
        fetchContactsByNextContactDate();
        fetchContactsByLocation();
    }, []);

    const getContacts = async () => {
        fetchContactsByNextContactDate();
        fetchContactsByLocation();
    }

    const fetchContactsByNextContactDate = async () => {
        console.log("Searching for contacts by nextContactDate")
        setFeatLoading(true);
        const dateLowerBound = new Date(0);
        const dateUpperBound = new Date(Date.now());
        console.log("Got Dates");
    
        // Search query to be sent
        const requestBody = {
            user_token: token,
            search_params: {
                query_string: "",
                order_by: "Next contact date",
                tags: [],
                lower_bound_date: dateLowerBound,
                upper_bound_date: dateUpperBound
            }
        }
        console.log("Sending FetchContactsByNextContactDate request with body:", requestBody);

        try {
            const response = await axios.post(searchContactsURL, requestBody);
            setContacts(response.data);
            setFeatLoading(false);
            console.log("Successfully got FetchContactsByNextContactDate response");

        } catch (error) {
            console.error('Error received in FetchContactsByNextContactDate response:', error);
        } finally {
            setFeatLoading(false);
        }
    };

    const fetchContactsByLocation = async () => {
        console.log("Searching for contacts by location")
        setNearbyLoading(true);
        const location = await getCurrentLocation();
        if (!location) {
            console.log("Location not retrieved, not searching for nearby contacts");
            return; // Exit if location is null
        }
        console.log("Location retrieved!", location);

        const dateLowerBound = new Date(0);
        const dateUpperBound = new Date(Date.now());
        console.log("Got Dates");
    
        // Search query to be sent
        const requestBody = {
            user_token: token,
            search_params: {
                query_string: "",
                order_by: "Distance",
                tags: [],
                lower_bound_date: dateLowerBound,
                upper_bound_date: dateUpperBound,
                user_lat: location.latitude,
                user_lon: location.longitude,
            }
        }
        console.log("Sending FetchContactsByLocation request with body:", requestBody);

        try {
            const response = await axios.post(searchContactsURL, requestBody);
            setNearbyContacts(response.data);
            setNearbyLoading(false);
        } catch (error) {
            console.error('Error received in FetchContactsByLocation response:', error);
        } finally {
            setNearbyLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-white">
        <ScrollView
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={getContacts} />}>
        {/* Scrolling Stack */}
        <YStack space="$5" marginBottom="$5">
            {/* Featured Contacts Stack */}
            <YStack marginLeft={20} marginRight={20}>
                <Text className="block mb-2 mx-2 text-base font-medium text-gray-900 dark:text-white 	">
                    FEATURED CONTACTS
                </Text>
                <Loader loading={featLoading} >
                    <ContactsList contacts={contacts.slice(0,3)} prefix="featured" />
                </Loader>
                <Link href='/(tabs)/contacts' asChild><Button>See All</Button></Link>
            </YStack>
            {/* Nearby Contacts Stack */}
            <YStack marginLeft={20} marginRight={20}>
                <Text className="block mb-2 mx-2 text-base font-medium text-gray-900 dark:text-white 	">
                    NEARBY CONTACTS
                </Text>
                <Loader loading={nearbyLoading} >
                    {<ContactsList contacts={nearbyContacts.slice(0,3)} prefix="nearby" />}
                </Loader>
                <Link href='/(tabs)/contacts' asChild><Button>See All</Button></Link>
            </YStack>
        </YStack>
        </ScrollView>
        </View>
    );
}
