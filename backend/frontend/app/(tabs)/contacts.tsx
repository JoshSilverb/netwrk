import { StyleSheet } from 'react-native';

import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/Themed';
import { Contacts } from '@/constants/PlaceholderData'
import  ContactsList from '@/components/ContactsList'

export default function contactsScreen() {

    return (
      <View className="flex-1 flex-col  justify-start bg-slate-50	">
      <View className="flex-1 flex-column ">
        <View className="col-span-full mb-4 ">

            <ContactsList contacts={Contacts} />
        </View>
      </View>
      </View>
    );

  {/* return (
    <View style={styles.container}>
      <Text style={styles.title}>Tab Two</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <EditScreenInfo path="app/(tabs)/contacts.tsx" />
    </View>
  ); */}
}

{/* const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
}); */}
