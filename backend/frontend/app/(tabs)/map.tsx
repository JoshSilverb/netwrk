import { StyleSheet } from 'react-native';

import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/Themed';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import { Contacts } from '@/constants/PlaceholderData'


export default function mapScreen() {
  return (
    <SafeAreaView >
      <Text className=" mb-2 mx-2 text-base font-medium text-gray-900">
          Contacts map
      </Text>
      <MapView style={{width: '100%', height: '100%'}}>
        {Contacts.map((contact, index) => (
          <Marker
            coordinate={{latitude: Math.random() * 180 - 90,
            longitude: Math.random() * 360 - 180}}
            title={contact.fullname}
            description={contact.location}
            key={index}
        />
        ))}
      
      </MapView>
      
    </SafeAreaView>
  );
}
