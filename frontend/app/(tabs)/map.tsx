import { useState, useEffect, useMemo } from 'react';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Sheet } from '@tamagui/sheet';
import { Text, YStack, Button, XStack, View, Image, Avatar, SizableText } from 'tamagui';
import { StyleSheet, ScrollView, Pressable } from 'react-native';
import { User as UserIcon, ChevronRight } from '@tamagui/lucide-icons';
import { useRouter } from 'expo-router';
import { searchContactsURL } from '@/constants/Apis';
import { useAuth } from '@/components/AuthContext';
import { SPACING, TYPOGRAPHY, CONTAINER_STYLES } from '@/constants/Styles';
import { getCurrentLocation } from '@/utils/locationutil';
import { formatDateForAPI } from '@/utils/utilfunctions';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/QueryKeys';

import axios from 'axios';

export default function MapScreen() {
  const router = useRouter();

  const [isSheetOpen,    setIsSheetOpen]    = useState(false);
  const [activeLocation, setActiveLocation] = useState('');

  const [userLocation, setUserLocation] = useState(null);
  const [isMapInteracting, setIsMapInteracting] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 40.7128,      // Default to NYC
    longitude: -74.0060,
    latitudeDelta: 50,
    longitudeDelta: 50,
  });
  const { token } = useAuth();

  const mapParams = {
    lower_bound_date: formatDateForAPI(new Date(0)),
    upper_bound_date: formatDateForAPI(new Date()),
    order_by: 'Date added',
    query_string: '',
    tags: [],
  };

  const { data: contacts = [] } = useQuery({
    queryKey: queryKeys.contacts(mapParams),
    queryFn: async () => {
      const response = await axios.post(searchContactsURL, {
        user_token: token,
        search_params: mapParams,
      });
      return response.data;
    },
  });

  const contactsByLocation = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const contact of contacts) {
      if (!map.has(contact.location)) map.set(contact.location, []);
      map.get(contact.location)!.push(contact);
    }
    return map;
  }, [contacts]);

  // Function to open the modal sheet
  const handleMarkerPress = (location:string) => {
    setActiveLocation(location);
    // console.log("All contacts:", contactsByLocation)

    setIsSheetOpen(true);
  };

  useEffect(() => {
      setInitialMapRegion();
  }, []);

  const setInitialMapRegion = async () => {
    try {
      const location = await getCurrentLocation();
      if (location) {
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
    <View style={[CONTAINER_STYLES.screen, { flex: 1 }]}>
      <MapView
        style={StyleSheet.absoluteFillObject}
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
            <YStack space={SPACING.lg}>
              {/* Sheet Header */}
              <YStack
                paddingHorizontal={SPACING.md}
                paddingVertical={SPACING.sm}
                borderBottomWidth={1}
                borderBottomColor="$borderColor"
              >
                <Text
                  fontSize={TYPOGRAPHY.sizes.md}
                  fontWeight={TYPOGRAPHY.weights.medium}
                  color="$color"
                >
                  Contacts in {activeLocation}
                </Text>
                <Text
                  fontSize={TYPOGRAPHY.sizes.sm}
                  color="$gray10"
                  marginTop={SPACING.xs}
                >
                  {contactsByLocation.get(activeLocation)?.length || 0} contact{contactsByLocation.get(activeLocation)?.length !== 1 ? 's' : ''} found
                </Text>
              </YStack>

              {/* Contacts List */}
              <YStack borderTopWidth={1} borderTopColor="$borderColor">
                {contactsByLocation.get(activeLocation)?.map((contact) => (
                  <Pressable
                    key={contact.contact_id}
                    onPress={() => {
                      setIsSheetOpen(false);
                      router.push(`/contact/${contact.contact_id}`);
                    }}
                  >
                    {({ pressed }) => (
                      <XStack
                        alignItems="center"
                        space={SPACING.md}
                        paddingHorizontal={SPACING.md}
                        paddingVertical={SPACING.sm}
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
                        <YStack flex={1}>
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
                        </YStack>
                        <ChevronRight size={16} color="$gray8" />
                      </XStack>
                    )}
                  </Pressable>
                ))}
              </YStack>
              
              {/* Close Button */}
              <Button
                onPress={() => setIsSheetOpen(false)}
                size="$4"
                backgroundColor="$blue9"
                color="white"
                marginTop={SPACING.md}
                marginHorizontal={SPACING.lg}
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
