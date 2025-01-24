import { useState, useEffect } from 'react';
import { Text } from '@/components/Themed';
import MapView, { Marker } from 'react-native-maps';
import { Sheet } from '@tamagui/sheet';
import { YStack, Button, XStack, ScrollView, View, Image } from 'tamagui'; 
import ContactsList from '@/components/ContactsList';
import { Loader } from '@/components/Loader';
import { getContactsForUserURL } from '@/constants/Apis';
import { useAuth } from '@/components/AuthContext';
import { RotateCw } from '@tamagui/lucide-icons';
import { RefreshControl } from 'react-native';


import axios from 'axios';

export default function mapScreen() {

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Function to open the modal sheet
  const handleMarkerPress = () => {
    setIsSheetOpen(true);
  };

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token, setToken } = useAuth();

  useEffect(() => {
      fetchContacts();
  }, []);

  const fetchContacts = async () => {
    console.log("Fetching contacts");

    // Contact data to be sent
    const requestBody = {
        user_token: token
    }

    try {
        const response = await axios.post(getContactsForUserURL, requestBody);
        setContacts(response.data);
        console.log("Contacts:", contacts);
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

  return (
    <View className='bg-white pt-5'>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
      <YStack>
        <XStack>
          <Text className=" mb-2 mx-2 text-base font-medium text-gray-900">
            Contacts map 
          </Text>
          {/* <Button onPress={handleRefresh}><RotateCw /></Button> */}
        </XStack>
      
      <Loader loading={loading}>
        <MapView style={{width: '100%', height: 500}}>
          {contacts.map((contact, index) => (
            <Marker
              coordinate={{latitude: Math.random() * 180 - 90,
              longitude: Math.random() * 360 - 180}}
              title={contact.location}
              key={index}
              onPress={handleMarkerPress}
          >
            <Image
              // source={require('@/assets/images/mapmarker.png')}
              source={require('@/assets/images/mapmarker.png')}
              style={{ height: 25, width: 25 }}
              resizeMode="contain" 
          />
          </Marker>
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
              <ContactsList contacts={contacts.slice(0,3)} address={"/(tabs)/contacts"} />
              <Button onPress={() => setIsSheetOpen(false)}>Close</Button>
              {/* Add more content here */}
            </YStack>
          </Sheet.ScrollView>
        </Sheet.Frame>
      </Sheet>
    </View>
  );
}
