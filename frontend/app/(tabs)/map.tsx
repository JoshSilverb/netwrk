import React, { useState, useMemo, useEffect, useRef } from 'react';
import MapView, { Marker } from 'react-native-maps';
import { YStack, XStack, View, Avatar, SizableText } from 'tamagui';
import { StyleSheet, ScrollView, Pressable, Image, Animated, Dimensions, Text, View as RNView, Platform } from 'react-native';
import { User as UserIcon } from '@tamagui/lucide-icons';
import { useRouter } from 'expo-router';
import { searchContactsURL } from '@/constants/Apis';
import { useAuth } from '@/components/AuthContext';
import { SPACING, TYPOGRAPHY } from '@/constants/Styles';
import { getCurrentLocation } from '@/utils/locationutil';
import { formatDateForAPI } from '@/utils/utilfunctions';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/QueryKeys';
import axios from 'axios';

const NAVY = '#0F172A';
const NAVY_SURFACE = '#1E293B';
const NAVY_BORDER = '#334155';
const TEAL = '#14B8A6';
const SLATE_MUTED = '#94A3B8';

function ContactMarker({
  location,
  locContacts,
  isActive,
  onPress,
}: {
  location: string;
  locContacts: any[];
  isActive: boolean;
  onPress: () => void;
}) {
  const [tracksViews, setTracksViews] = useState(true);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      setTracksViews(isActive);
      return;
    }
    setTracksViews(true);
    const t = setTimeout(() => setTracksViews(false), 500);
    return () => clearTimeout(t);
  }, [isActive]);

  const coord = parseCoordinate(locContacts[0].coordinate);
  if (!coord) return null;

  const profilePicUrl = locContacts.length === 1
    ? (locContacts[0].is_linked
        ? (locContacts[0].linked_user_profile_pic_url || locContacts[0].profile_pic_url)
        : locContacts[0].profile_pic_url)
    : null;

  const freezeOnAndroid = () => { if (Platform.OS === 'android') setTracksViews(false); };

  return (
    <Marker
      coordinate={coord}
      onPress={onPress}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={tracksViews}
    >
      <RNView collapsable={false} style={{ alignItems: 'center', width: 40, height: 44, justifyContent: 'flex-start' }}>
        <RNView collapsable={false} style={[styles.markerCircle, isActive ? styles.markerActive : styles.markerInactive]}>
          {locContacts.length > 1 ? (
            <Text style={styles.markerCount}>{locContacts.length}</Text>
          ) : profilePicUrl ? (
            <Image
              source={{ uri: profilePicUrl }}
              style={isActive ? styles.markerAvatarActive : styles.markerAvatarInactive}
              onLoad={freezeOnAndroid}
              onError={freezeOnAndroid}
            />
          ) : Platform.OS === 'ios' ? (
            <UserIcon size={isActive ? 16 : 12} color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontSize: isActive ? 13 : 10, fontWeight: '700' }}>{'●'}</Text>
          )}
        </RNView>
        <RNView style={[styles.pinTail, { borderTopColor: isActive ? TEAL : '#334155' }]} />
      </RNView>
    </Marker>
  );
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
const PANEL_EXPANDED_HEIGHT = Math.round(SCREEN_HEIGHT * 0.55);

function parseCoordinate(wkt: string | null | undefined): { latitude: number; longitude: number } | null {
  if (!wkt) return null;
  const match = wkt.match(/POINT\(([^ ]+) ([^)]+)\)/);
  if (!match) return null;
  return { longitude: parseFloat(match[1]), latitude: parseFloat(match[2]) };
}

export default function MapScreen() {
  const router = useRouter();

  const [activeLocation, setActiveLocation] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 40.7128,
    longitude: -74.0060,
    latitudeDelta: 50,
    longitudeDelta: 50,
  });

  const panelHeight = useRef(new Animated.Value(0)).current;
  const { token } = useAuth() as { token: string | null };

  const mapParams = {
    lower_bound_date: formatDateForAPI(new Date(0)),
    upper_bound_date: formatDateForAPI(new Date()),
    order_by: 'DATE_ADDED',
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

  const mappedContacts = useMemo(
    () => contacts.filter((c: any) => !!parseCoordinate(c.coordinate)),
    [contacts]
  );

  const contactsByLocation = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const contact of mappedContacts) {
      const loc = (contact.linked_user_location || contact.location) || '';
      if (!map.has(loc)) map.set(loc, []);
      map.get(loc)!.push(contact);
    }
    return map;
  }, [mappedContacts]);

  useEffect(() => {
    (async () => {
      try {
        const location = await getCurrentLocation();
        if (location) {
          setUserLocation({ latitude: location.latitude, longitude: location.longitude });
          setMapRegion({
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 50,
            longitudeDelta: 50,
          });
        }
      } catch {}
    })();
  }, []);

  function expandPanel(location: string) {
    setActiveLocation(location);
    Animated.spring(panelHeight, {
      toValue: PANEL_EXPANDED_HEIGHT,
      useNativeDriver: false,
      bounciness: 4,
    }).start();
  }

  function collapsePanel() {
    Animated.spring(panelHeight, {
      toValue: 0,
      useNativeDriver: false,
      bounciness: 4,
    }).start(() => setActiveLocation(null));
  }

  const activeContacts = activeLocation ? (contactsByLocation.get(activeLocation) ?? []) : [];

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        region={mapRegion}
        onRegionChangeComplete={setMapRegion}
        onPress={collapsePanel}
      >
        {/* Contact markers — one per unique location */}
        {Array.from(contactsByLocation.entries()).map(([location, locContacts]) => (
          <ContactMarker
            key={location}
            location={location}
            locContacts={locContacts}
            isActive={location === activeLocation}
            onPress={() => expandPanel(location)}
          />
        ))}

        {/* User location dot */}
        {userLocation && (
          <Marker coordinate={userLocation} anchor={{ x: 0.5, y: 0.5 }} flat zIndex={1000} tracksViewChanges={false}>
            <RNView collapsable={false} style={{ alignItems: 'center', justifyContent: 'center', width: 44, height: 44 }}>
              <RNView style={styles.userLocationOuter} />
              <RNView style={styles.userLocationInner} />
            </RNView>
          </Marker>
        )}
      </MapView>

      {/* Persistent bottom panel */}
      <Animated.View style={[styles.panel, { height: panelHeight }]}>
        {activeLocation && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: PANEL_EXPANDED_HEIGHT }}>
            <View style={styles.handleWrapper}>
              <View style={styles.handle} />
            </View>
            <XStack
              paddingHorizontal={SPACING.md}
              paddingTop={SPACING.xs}
              paddingBottom={SPACING.sm}
              borderBottomWidth={1}
              borderBottomColor={NAVY_BORDER}
              alignItems="center"
            >
              <YStack flex={1}>
                <SizableText fontSize={TYPOGRAPHY.sizes.md} fontWeight="700" color="white" numberOfLines={1}>
                  {activeLocation}
                </SizableText>
                <SizableText fontSize={TYPOGRAPHY.sizes.sm} color={SLATE_MUTED}>
                  {activeContacts.length} {activeContacts.length === 1 ? 'contact' : 'contacts'}
                </SizableText>
              </YStack>
            </XStack>

            <ScrollView style={{ flex: 1, maxHeight: PANEL_EXPANDED_HEIGHT - 100 }} contentContainerStyle={{ paddingBottom: 24 }}>
              {activeContacts.map((contact: any) => (
                <Pressable
                  key={contact.contact_id}
                  onPress={() => {
                    collapsePanel();
                    router.push(`/contact/${contact.contact_id}`);
                  }}
                >
                  {({ pressed }) => (
                    <XStack
                      alignItems="center"
                      gap={SPACING.md}
                      paddingHorizontal={SPACING.md}
                      paddingVertical={SPACING.sm + 2}
                      borderBottomWidth={1}
                      borderBottomColor={NAVY_BORDER}
                      backgroundColor={pressed ? NAVY_SURFACE : NAVY}
                    >
                      <Avatar circular size="$4">
                        {(contact.is_linked ? (contact.linked_user_profile_pic_url || contact.profile_pic_url) : contact.profile_pic_url) ? (
                          <Avatar.Image
                            accessibilityLabel={contact.fullname}
                            src={(contact.is_linked ? (contact.linked_user_profile_pic_url || contact.profile_pic_url) : contact.profile_pic_url)!}
                          />
                        ) : (
                          <Avatar.Fallback backgroundColor={NAVY_SURFACE} alignItems="center" justifyContent="center">
                            <UserIcon size={20} color={SLATE_MUTED} />
                          </Avatar.Fallback>
                        )}
                      </Avatar>
                      <YStack flex={1}>
                        <SizableText fontSize={TYPOGRAPHY.sizes.md} fontWeight="700" color="white" numberOfLines={1}>
                          {contact.fullname}
                        </SizableText>
                        {(() => {
                          const bio = contact.userbio || (contact.is_linked ? contact.linked_user_bio : null);
                          return bio ? (
                            <SizableText fontSize={TYPOGRAPHY.sizes.sm} color={SLATE_MUTED} numberOfLines={1}>
                              {bio}
                            </SizableText>
                          ) : contact.lastcontact ? (
                            <SizableText fontSize={TYPOGRAPHY.sizes.sm} color={SLATE_MUTED} numberOfLines={1}>
                              Last: {contact.lastcontact}
                            </SizableText>
                          ) : null;
                        })()}
                      </YStack>
                    </XStack>
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: NAVY,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
    overflow: 'hidden',
  },
  handleWrapper: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: NAVY_BORDER,
  },
  markerCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  markerActive: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: TEAL,
    shadowColor: TEAL,
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 8,
  },
  markerInactive: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#334155',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
  },
  markerCount: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  markerAvatarActive: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  markerAvatarInactive: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  pinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
  userLocationOuter: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.3)',
    position: 'absolute',
  },
  userLocationInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
});
