import { Text, View, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import ContactsList from '@/components/ContactsList'
import { Link } from 'expo-router';
import { Button, YStack, ScrollView } from 'tamagui';
import axios from 'axios';
import { searchContactsURL } from '@/constants/Apis';
import { Loader } from '@/components/Loader';
import { useAuth } from '@/components/AuthContext';
import { SPACING, TYPOGRAPHY, CONTAINER_STYLES } from '@/constants/Styles';
import { useFocusEffect } from 'expo-router'

import { formatDateForAPI } from '@/utils/utilfunctions';
import { getCurrentLocation } from '@/utils/locationutil';

export default function DashboardScreen() {

    const [contacts, setContacts] = useState([]);
    const [nearbyContacts, setNearbyContacts] = useState([]);
    const [featLoading, setFeatLoading] = useState(true);
    const [nearbyLoading, setNearbyLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    // const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [featuredError, setFeaturedError] = useState<string>('');
    const [locationError, setLocationError] = useState<string>('');
    const { token, setToken } = useAuth();

    console.log(token);

    // This ensures the page shows updated data whenever it's opened
    useFocusEffect(
        useCallback(() => {
            getContacts();
        }, [token])
    );
    
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
                lower_bound_date: formatDateForAPI(dateLowerBound),
                upper_bound_date: formatDateForAPI(dateUpperBound)
            }
        }
        console.log("Sending FetchContactsByNextContactDate request with body:", requestBody);

        try {
            const response = await axios.post(searchContactsURL, requestBody);
            setContacts(response.data);
            setFeatLoading(false);
            console.log("Successfully got FetchContactsByNextContactDate response");
            setFeaturedError('');
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                if (error.response.status === 401) {
                    setFeaturedError('Invalid user token, try logging in again.');
                } else {
                    setFeaturedError(`Server error: ${error.response.status}`);
                }
            } else {
                setFeaturedError('Network error');
            }
        }
    };

    const fetchContactsByLocation = async () => {
        console.log("Searching for contacts by location")
        setNearbyLoading(true);
        const location = await getCurrentLocation();
        if (!location) {
            console.log("Location not retrieved, not searching for nearby contacts");
            setLocationError('Failed to get user location.');
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
                lower_bound_date: formatDateForAPI(dateLowerBound),
                upper_bound_date: formatDateForAPI(dateUpperBound),
                user_lat: location.latitude,
                user_lon: location.longitude,
            }
        }
        console.log("Sending FetchContactsByLocation request with body:", requestBody);

        try {
            const response = await axios.post(searchContactsURL, requestBody);
            setNearbyContacts(response.data);
            setNearbyLoading(false);
            setLocationError('');

        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                if (error.response.status === 401) {
                    setLocationError('Invalid user token, try logging in again.');
                } else {
                    setLocationError(`Server error: ${error.response.status}`);
                }
            } else {
                setLocationError('Network error');
            }
        }
    };

    return (
        <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <View style={CONTAINER_STYLES.screen}>
        <ScrollView
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={getContacts} />}>
        {/* Scrolling Stack */}
        <YStack space={SPACING.xl} paddingBottom={SPACING.xl}>
            {/* Featured Contacts Stack */}
            <YStack style={CONTAINER_STYLES.section}>
                <Text style={{
                    fontSize: TYPOGRAPHY.sizes.sm,
                    fontWeight: TYPOGRAPHY.weights.bold,
                    color: '#6c757d',
                    marginBottom: SPACING.sm,
                    letterSpacing: 0.5,
                    textTransform: 'uppercase'
                }}>
                    FEATURED CONTACTS
                </Text>
                <Loader loading={featLoading} >
                    {featuredError && (
                    <Text color="$red9" mt="$3">
                        {featuredError}
                    </Text>
                    )}
                    <ContactsList contacts={contacts.slice(0,3)} prefix="featured" />
                </Loader>
                <Link href='/(tabs)/contacts' asChild>
                    <Button 
                        size="$3" 
                        backgroundColor="$blue9" 
                        color="white"
                        marginTop={SPACING.md}
                    >
                        See All
                    </Button>
                </Link>
            </YStack>
            {/* Nearby Contacts Stack */}
            <YStack style={CONTAINER_STYLES.section}>
                <Text style={{
                    fontSize: TYPOGRAPHY.sizes.sm,
                    fontWeight: TYPOGRAPHY.weights.bold,
                    color: '#6c757d',
                    marginBottom: SPACING.sm,
                    letterSpacing: 0.5,
                    textTransform: 'uppercase'
                }}>
                    NEARBY CONTACTS
                </Text>
                <Loader loading={nearbyLoading} >
                    {locationError && (
                    <Text color="$red9" mt="$3">
                        {locationError}
                    </Text>
                    )}
                    {<ContactsList contacts={nearbyContacts.slice(0,3)} prefix="nearby" />}
                </Loader>
                <Link href='/(tabs)/contacts' asChild>
                    <Button 
                        size="$3" 
                        backgroundColor="$blue9" 
                        color="white"
                        marginTop={SPACING.md}
                    >
                        See All
                    </Button>
                </Link>
            </YStack>
        </YStack>
        </ScrollView>
        </View>
        </SafeAreaView>
    );
}
