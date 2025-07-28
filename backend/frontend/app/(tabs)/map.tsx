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


import axios from 'axios';

export default function mapScreen() {

  const [isSheetOpen,    setIsSheetOpen]    = useState(false);
  const [activeLocation, setActiveLocation] = useState('');
  const [refreshing,     setRefreshing]     = useState(false);

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading]   = useState(true);
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
  }, []);

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

  return (
    <View className='bg-white pt-5'>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
      <YStack>
        <XStack>
          <Text className=" mb-2 mx-2 text-base font-medium text-gray-900">
            Contacts map 
          </Text>
        </XStack>
      
      <Loader loading={loading}>
        <MapView style={{width: '100%', height: 500}}>
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
      </ScrollView>
      {/* Tamagui Sheet - Modal that slides up */}
      <Sheet
        forceRemoveScrollEnabled={isSheetOpen}
        modal
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        snapPoints={[70]} // This sets the distance from the bottom (e.g., 80% of screen height)
        dismissOnSnapToBottom
      >
        <Sheet.Frame>
          <Sheet.Handle />
          <Sheet.Overlay />
          <Sheet.ScrollView>
            <YStack p="$4" space>
              {/* Content inside the modal */}
              {(activeLocation.length != 0) && <ContactsList contacts={contactsByLocation.get(activeLocation)} prefix="locationlist" />}
              <Button onPress={() => setIsSheetOpen(false)}>Close</Button>
              {/* Add more content here */}
            </YStack>
          </Sheet.ScrollView>
        </Sheet.Frame>
      </Sheet>
    </View>
  );
}
