import { useState, useEffect } from 'react';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Sheet } from '@tamagui/sheet';
import { Text, YStack, Button, XStack, View, Image } from 'tamagui';
import { ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ContactsList from '@/components/ContactsList';
import { Loader } from '@/components/Loader';
import { searchContactsURL } from '@/constants/Apis';
import { useAuth } from '@/components/AuthContext';
import { RotateCw } from '@tamagui/lucide-icons';
import { SPACING, TYPOGRAPHY, CONTAINER_STYLES, BORDER_RADIUS } from '@/constants/Styles';
import { getCurrentLocation } from '@/utils/locationutil';
import { formatDateForAPI } from '@/utils/utilfunctions';

import axios from 'axios';

export default function mapScreen() {

  const [isSheetOpen,    setIsSheetOpen]    = useState(false);
  const [activeLocation, setActiveLocation] = useState('');
  const [refreshing,     setRefreshing]     = useState(false);

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [isMapInteracting, setIsMapInteracting] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 40.7128,      // Default to NYC
    longitude: -74.0060,
    latitudeDelta: 50,
    longitudeDelta: 50,
  });
  const { token, setToken }     = useAuth();

  const [contactsByLocation, _]   = useState(new Map<string, string[]>());

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
        setUserLocation({
          latitude: location.latitude,
          longitude: location.longitude,
        });
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

      const location:string = contact.location
      if (contactsByLocation.has(location)) {
        contactsByLocation.get(location).push(contact);
      }
      else {
        contactsByLocation.set(location, [contact]);
      }
    }
  }

  const fetchContacts = async () => {
    console.log("Fetching contacts");

    const dateLowerBound = new Date(0);
    const dateUpperBound = new Date(Date.now());

    // Contact data to be sent
    const requestBody = {
        user_token: token,
        search_params: {
          "lower_bound_date": formatDateForAPI(dateLowerBound), 
          "upper_bound_date": formatDateForAPI(dateUpperBound),
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

  return (
    <View style={CONTAINER_STYLES.screen}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        contentInsetAdjustmentBehavior="automatic"
        scrollEnabled={!isMapInteracting}
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
              onTouchStart={() => setIsMapInteracting(true)}
              onTouchEnd={() => setIsMapInteracting(false)}
              onTouchCancel={() => setIsMapInteracting(false)}
            >
              {contacts.map((contact, index) => (
                <View key={index}>
                  {contact.coordinate && contactsByLocation.has(contact.location) &&
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

              {/* User Location Marker - Blue Circle */}
              {userLocation && (
                <Marker
                  coordinate={userLocation}
                  anchor={{ x: 0.5, y: 0.5 }}
                  flat
                  zIndex={1000}
                >
                  <View style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {/* Outer accuracy circle - semi-transparent blue */}
                    <View style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: 'rgba(0, 122, 255, 0.15)',
                      borderWidth: 1,
                      borderColor: 'rgba(0, 122, 255, 0.3)',
                      position: 'absolute',
                    }} />
                    {/* Inner location dot - solid blue with white border */}
                    <View style={{
                      width: 16,
                      height: 16,
                      borderRadius: 8,
                      backgroundColor: '#007AFF',
                      borderWidth: 3,
                      borderColor: '#FFFFFF',
                    }} />
                  </View>
                </Marker>
              )}

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
        zIndex={100000}
      >
        <Sheet.Overlay
          animation="lazy"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <Sheet.Frame backgroundColor="$background" padding="$2" space flex={1}>
          <Sheet.Handle backgroundColor="$gray8" />
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
          >
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
                    onMorePressCallback={() => setIsSheetOpen(false)}
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
                pressStyle={{ opacity: 0.8, backgroundColor: '$blue10' }}
                focusStyle={{ backgroundColor: '$blue10' }}
              >
                Close
              </Button>
            </YStack>
          </ScrollView>
        </Sheet.Frame>
      </Sheet>
    </View>
  );
}
