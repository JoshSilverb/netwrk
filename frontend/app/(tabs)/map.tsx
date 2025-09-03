import { useState, useEffect } from 'react';
import MapView, { Marker } from 'react-native-maps';
import { Sheet } from '@tamagui/sheet';
import { Text, YStack, Button, XStack, ScrollView, View, Image } from 'tamagui'; 
import ContactsList from '@/components/ContactsList';
import { Loader } from '@/components/Loader';
import { searchContactsURL } from '@/constants/Apis';
import { useAuth } from '@/components/AuthContext';
import { RotateCw } from '@tamagui/lucide-icons';
import { RefreshControl } from 'react-native';
import { SPACING, TYPOGRAPHY, CONTAINER_STYLES, BORDER_RADIUS } from '@/constants/Styles';
import { getCurrentLocation } from '@/utils/locationutil';

import axios from 'axios';

export default function mapScreen() {

  const [isSheetOpen,    setIsSheetOpen]    = useState(false);
  const [activeLocation, setActiveLocation] = useState('');
  const [refreshing,     setRefreshing]     = useState(false);

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [mapRegion, setMapRegion] = useState({
    latitude: 40.7128,      // Default to NYC
    longitude: -74.0060,    // Fixed longitude (was missing negative sign)
    latitudeDelta: 50,
    longitudeDelta: 50,
  });
  const { token, setToken }     = useAuth();

  const [contactsByLocation, _]   = useState(new Map<string, string[]>());

  // const contactsByLocation = new Map<string, string[]>();

  // Function to open the modal sheet
  const handleMarkerPress = (location:string) => {
    console.log("Opening marker for location:", location);
    setActiveLocation(location);
    // console.log("All contacts:", contactsByLocation)

    console.log("Should have these contacts:", contactsByLocation.get(location))
    setIsSheetOpen(true);
  };

  useEffect(() => {
      fetchContacts();
      setInitialMapRegion();
  }, []);

  const setInitialMapRegion = async () => {
    try {
      const location = await getCurrentLocation();
      if (location) {
        console.log("Setting initial map region to:", location);
        setMapRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 50,
          longitudeDelta: 50,
        });
      }
    } catch (error) {
      console.error('Error getting current location for map:', error);
      // Keep default region if location fails
    }
  };

  function fillContactLocationMap(contacts) {
    contactsByLocation.clear();
    console.log("Called fillContactLocationMap with", contacts.length, "contacts");
    for (const contact of contacts) {
      console.log("Looking at a contact");

      const location:string = contact.location
      if (contactsByLocation.has(location)) {
        console.log("appending location", location);
        contactsByLocation.get(location).push(contact);
      }
      else {
        console.log("Adding location", location);
        contactsByLocation.set(location, [contact]);
      }
    }

    // console.log("Contacts by location:", contactsByLocation);
  }

  const fetchContacts = async () => {
    console.log("Fetching contacts");

    const dateLowerBound = new Date(0);
    const dateUpperBound = new Date(Date.now());

    // Contact data to be sent
    const requestBody = {
        user_token: token,
        search_params: {
          "lower_bound_date": dateLowerBound, 
          "upper_bound_date": dateUpperBound,
          "order_by": "Date added",
          "query_string": "",
          "tags": []
        }
    }

    try {
        const response = await axios.post(searchContactsURL, requestBody);
        setContacts(response.data);
        console.log("Contacts:", response.data);
        fillContactLocationMap(response.data);
        setLoading(false);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
        
  };

  const handleRefresh = async () => {
    console.log("Refreshing");
    setIsSheetOpen(false);
    setLoading(true);
    fetchContacts();
  }

  function getContactCoords(contact) {
    // Assumes contact coords are formatted like this:
    //  POINT(-122.4194 37.7749)
    const lonStartIdx = contact.coordinate.indexOf("(") + 1;
    const lonEndIdx = contact.coordinate.indexOf(" ");
    const latStartIdx = lonEndIdx + 1;
    const latEndIdx = contact.coordinate.indexOf(")");

    const lon = parseFloat(contact.coordinate.substring(lonStartIdx, lonEndIdx));
    const lat = parseFloat(contact.coordinate.substring(latStartIdx, latEndIdx));

    return {latitude: lat, longitude: lon};
  } 

  // const location = await getCurrentLocation();
  // if (!location) {
  //     console.log("Location not retrieved, not searching for nearby contacts");
  //     return; // Exit if location is null
  // }

  return (
    <View style={CONTAINER_STYLES.screen}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
      <YStack space={SPACING.lg} padding={SPACING.lg}>
        {/* Header */}
        <YStack 
          space={SPACING.sm}
          padding={SPACING.md}
          marginVertical={SPACING.sm}
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius={BORDER_RADIUS.md}
          backgroundColor="$gray1"
        >
          <Text 
            fontSize={TYPOGRAPHY.sizes.md}
            fontWeight={TYPOGRAPHY.weights.medium}
            color="$gray11"
            marginBottom={SPACING.xs}
          >
            Contacts Map
          </Text>
          <Text 
            fontSize={TYPOGRAPHY.sizes.sm}
            color="$gray10"
          >
            Tap on markers to see contacts at each location
          </Text>
        </YStack>
      
        {/* Map Container */}
        <YStack 
          marginVertical={SPACING.sm}
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius={BORDER_RADIUS.md}
          backgroundColor="$gray1"
          overflow="hidden"
        >
          <Loader loading={loading}>
            <MapView 
              style={{
                width: '100%', 
                height: 400,
                borderRadius: BORDER_RADIUS.md
              }}
              region={mapRegion}
              onRegionChangeComplete={setMapRegion}
            >
              {contacts.map((contact, index) => (
                <View key={index}>
                  {contactsByLocation.has(contact.location) && 
                  <Marker
                  coordinate={getContactCoords(contact)}
                  title={contact.location}
                  onPress={() => handleMarkerPress(contact.location)}
                >
                <Image
                  source={require('@/assets/images/mapmarker.png')}
                  style={{ height: 25, width: 25 }}
                  resizeMode="contain" 
                />
              </Marker>
              }
              </View>
              ))}
            
            </MapView>
            </Loader>
        </YStack>
      </YStack>
      </ScrollView>
      {/* Location Details Sheet */}
      <Sheet
        forceRemoveScrollEnabled={isSheetOpen}
        modal
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        snapPoints={[70]}
        dismissOnSnapToBottom
      >
        <Sheet.Frame backgroundColor="$background">
          <Sheet.Handle backgroundColor="$gray8" />
          <Sheet.Overlay />
          <Sheet.ScrollView>
            <YStack space={SPACING.lg} padding={SPACING.lg}>
              {/* Sheet Header */}
              <YStack 
                space={SPACING.sm}
                padding={SPACING.md}
                borderWidth={1}
                borderColor="$borderColor"
                borderRadius={BORDER_RADIUS.md}
                backgroundColor="$gray1"
              >
                <Text 
                  fontSize={TYPOGRAPHY.sizes.md}
                  fontWeight={TYPOGRAPHY.weights.medium}
                  color="$gray11"
                  marginBottom={SPACING.xs}
                >
                  Contacts in {activeLocation}
                </Text>
                <Text 
                  fontSize={TYPOGRAPHY.sizes.sm}
                  color="$gray10"
                >
                  {contactsByLocation.get(activeLocation)?.length || 0} contact{contactsByLocation.get(activeLocation)?.length !== 1 ? 's' : ''} found
                </Text>
              </YStack>
              
              {/* Contacts List */}
              <YStack 
                space={SPACING.sm}
                padding={SPACING.md}
                marginVertical={SPACING.sm}
                borderWidth={1}
                borderColor="$borderColor"
                borderRadius={BORDER_RADIUS.md}
                backgroundColor="$gray1"
              >
                {(activeLocation.length != 0) && 
                  <ContactsList 
                    contacts={contactsByLocation.get(activeLocation)} 
                    prefix="locationlist" 
                  />
                }
              </YStack>
              
              {/* Close Button */}
              <Button 
                onPress={() => setIsSheetOpen(false)}
                size="$4"
                backgroundColor="$blue9"
                color="white"
                marginTop={SPACING.md}
              >
                Close
              </Button>
            </YStack>
          </Sheet.ScrollView>
        </Sheet.Frame>
      </Sheet>
    </View>
  );
}
