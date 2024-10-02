import { useState } from 'react';
import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/Themed';
import MapView, { Marker } from 'react-native-maps';
import { Contacts } from '@/constants/PlaceholderData';
import { Image } from 'react-native';
import type { SheetProps } from '@tamagui/sheet';
import { Sheet, useSheet } from '@tamagui/sheet';
import { YStack, Button } from 'tamagui'; 
import ContactsList from '@/components/ContactsList';

export default function mapScreen() {

  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Function to open the modal sheet
  const handleMarkerPress = () => {
    setIsSheetOpen(true);
  };
  
  return (
    <View className='bg-white'>
      <Text className=" mb-2 mx-2 text-base font-medium text-gray-900">
          Contacts map
      </Text>
      <MapView style={{width: '100%', height: '100%'}}>
        {Contacts.map((contact, index) => (
          <Marker
            coordinate={{latitude: Math.random() * 180 - 90,
            longitude: Math.random() * 360 - 180}}
            title={contact.location}
            key={index}
            onPress={handleMarkerPress}
        >
        <Image
            source={require('@/assets/images/mapmarker.png')}
            style={{ height: 25 }}
            resizeMode="contain" 
        />
        </Marker>
        ))}
      
      </MapView>
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
              <ContactsList contacts={Contacts.slice(0,3)} address={"/(tabs)/contacts"} />
              <Button onPress={() => setIsSheetOpen(false)}>Close</Button>
              {/* Add more content here */}
            </YStack>
          </Sheet.ScrollView>
        </Sheet.Frame>
      </Sheet>
    </View>
  );
}
